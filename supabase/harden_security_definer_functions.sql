-- Corrections des fonctions SECURITY DEFINER revelees par l'audit.
-- A executer apres harden_rpc_permissions.sql dans Supabase SQL Editor.
-- Les signatures sont conservees pour ne pas casser le client existant.

BEGIN;

CREATE OR REPLACE FUNCTION public.accept_invitation_and_create_org(
  p_org_name text,
  p_admin_id uuid,
  p_admin_name text,
  p_token text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation pending_companies%ROWTYPE;
  v_org_id uuid;
  v_slug text;
  v_caller_email text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_admin_id THEN
    RAISE EXCEPTION 'Permission refusee';
  END IF;

  SELECT * INTO v_invitation
  FROM pending_companies
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND OR v_invitation.expires_at < now() THEN
    RAISE EXCEPTION 'Invitation invalide ou expiree';
  END IF;

  SELECT email INTO v_caller_email FROM profiles WHERE id = auth.uid();
  IF v_caller_email IS NULL OR lower(v_caller_email) <> lower(v_invitation.admin_email) THEN
    RAISE EXCEPTION 'Cette invitation ne correspond pas au compte connecte';
  END IF;

  v_slug := trim(both '-' FROM lower(regexp_replace(v_invitation.name, '[^a-zA-Z0-9]+', '-', 'g')));

  INSERT INTO organizations (name, slug, plan_type, trial_ends_at, subscription_status)
  VALUES (v_invitation.name, v_slug, 'starter', now() + interval '14 days', 'trial')
  RETURNING id INTO v_org_id;

  UPDATE profiles
  SET organization_id = v_org_id,
      full_name = v_invitation.admin_name,
      role = 'org_admin'
  WHERE id = auth.uid();

  DELETE FROM pending_companies WHERE id = v_invitation.id;
  RETURN v_org_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_member_invitation(
  p_token text,
  p_user_id uuid,
  p_full_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation member_invitations%ROWTYPE;
  v_caller_email text;
  v_current_organization_id uuid;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Permission refusee';
  END IF;

  SELECT * INTO v_invitation
  FROM member_invitations
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND OR v_invitation.expires_at < now() THEN
    RAISE EXCEPTION 'Invitation invalide ou expiree';
  END IF;

  SELECT email, organization_id
  INTO v_caller_email, v_current_organization_id
  FROM profiles
  WHERE id = auth.uid();

  v_caller_email := COALESCE(v_caller_email, auth.jwt() ->> 'email');
  IF v_caller_email IS NULL OR lower(v_caller_email) <> lower(v_invitation.email) THEN
    RAISE EXCEPTION 'Cette invitation ne correspond pas au compte connecte';
  END IF;

  IF v_current_organization_id IS NOT NULL
    AND v_current_organization_id <> v_invitation.organization_id THEN
    RAISE EXCEPTION 'Ce compte appartient deja a une autre organisation';
  END IF;

  UPDATE profiles
  SET organization_id = v_invitation.organization_id,
      role = v_invitation.role::user_role,
      full_name = COALESCE(NULLIF(trim(p_full_name), ''), NULLIF(trim(full_name), ''), split_part(v_invitation.email, '@', 1))
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    INSERT INTO profiles (id, email, role, full_name, organization_id, created_at)
    VALUES (
      auth.uid(), v_invitation.email, v_invitation.role::user_role,
      COALESCE(NULLIF(trim(p_full_name), ''), split_part(v_invitation.email, '@', 1)),
      v_invitation.organization_id, now()
    );
  END IF;

  DELETE FROM member_invitations WHERE id = v_invitation.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_video(p_student_id uuid, p_video_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sequence_order integer;
  v_pillar_id uuid;
  v_prev_video_id uuid;
  v_prev_watched boolean;
  v_prev_quiz_id uuid;
  v_prev_quiz_passed boolean;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_student_id THEN
    RETURN false;
  END IF;

  SELECT v.sequence_order, v.pillar_id
  INTO v_sequence_order, v_pillar_id
  FROM videos AS v
  WHERE v.id = p_video_id;

  IF NOT FOUND OR NOT EXISTS (
    SELECT 1
    FROM profiles AS profile
    JOIN pillars AS pillar ON pillar.id = v_pillar_id
    WHERE profile.id = auth.uid()
      AND (
        profile.role = 'super_admin'::user_role
        OR (
          profile.organization_id = pillar.organization_id
          AND (
            profile.role = 'org_admin'::user_role
            OR EXISTS (
              SELECT 1
              FROM group_members AS membership
              JOIN groups AS group_item ON group_item.id = membership.group_id
              JOIN group_pillar_access AS access ON access.group_id = membership.group_id
              WHERE membership.user_id = auth.uid()
                AND access.pillar_id = v_pillar_id
                AND group_item.organization_id = pillar.organization_id
            )
          )
        )
      )
  ) THEN
    RETURN false;
  END IF;

  IF v_sequence_order <= 1 THEN
    RETURN true;
  END IF;

  SELECT id INTO v_prev_video_id
  FROM videos
  WHERE pillar_id = v_pillar_id AND sequence_order < v_sequence_order
  ORDER BY sequence_order DESC
  LIMIT 1;

  IF v_prev_video_id IS NULL THEN
    RETURN true;
  END IF;

  SELECT watched, quiz_passed
  INTO v_prev_watched, v_prev_quiz_passed
  FROM user_progress
  WHERE user_id = auth.uid() AND video_id = v_prev_video_id;

  IF v_prev_watched IS NOT TRUE THEN
    RETURN false;
  END IF;

  SELECT id INTO v_prev_quiz_id FROM quizzes WHERE video_id = v_prev_video_id LIMIT 1;
  RETURN v_prev_quiz_id IS NULL OR v_prev_quiz_passed IS TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_organization_limits_full(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org organizations%ROWTYPE;
  v_limits jsonb;
  v_users_count integer;
  v_videos_count integer;
  v_storage_mb integer;
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND (role = 'super_admin'::user_role OR (organization_id = p_org_id AND role = 'org_admin'::user_role))
  ) THEN
    RAISE EXCEPTION 'Permission refusee';
  END IF;

  SELECT * INTO v_org FROM organizations WHERE id = p_org_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organisation introuvable';
  END IF;

  IF v_org.plan_type = 'unlimited' THEN
    RETURN jsonb_build_object(
      'organization_id', p_org_id, 'organization_name', v_org.name, 'plan_type', 'unlimited',
      'limits', jsonb_build_object('users', -1, 'videos', -1, 'storage', -1),
      'current_usage', jsonb_build_object('users', 0, 'videos', 0, 'storage_mb', 0),
      'can_add_users', true, 'can_add_videos', true, 'storage_percent_used', 0, 'timestamp', now()::text
    );
  END IF;

  SELECT default_limits -> v_org.plan_type INTO v_limits FROM system_settings WHERE id = 1;
  SELECT count(*) INTO v_users_count FROM profiles WHERE organization_id = p_org_id;
  SELECT count(*) INTO v_videos_count FROM videos AS video
  JOIN pillars AS pillar ON pillar.id = video.pillar_id
  WHERE pillar.organization_id = p_org_id;
  v_storage_mb := v_videos_count * 50;

  RETURN jsonb_build_object(
    'organization_id', p_org_id, 'organization_name', v_org.name, 'plan_type', v_org.plan_type,
    'limits', v_limits,
    'current_usage', jsonb_build_object('users', v_users_count, 'videos', v_videos_count, 'storage_mb', v_storage_mb),
    'can_add_users', CASE WHEN (v_limits ->> 'users')::int = -1 THEN true ELSE (v_limits ->> 'users')::int > v_users_count END,
    'can_add_videos', CASE WHEN (v_limits ->> 'videos')::int = -1 THEN true ELSE (v_limits ->> 'videos')::int > v_videos_count END,
    'storage_percent_used', CASE WHEN (v_limits ->> 'storage')::int IN (-1, 0) THEN 0 ELSE round((v_storage_mb::numeric / (v_limits ->> 'storage')::numeric * 100), 2) END,
    'timestamp', now()::text
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.full_system_cleanup()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitations_deleted integer;
  v_started_at timestamptz := now();
  v_result jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'::user_role) THEN
    RAISE EXCEPTION 'Permission refusee';
  END IF;

  WITH deleted AS (
    DELETE FROM pending_companies WHERE expires_at < now() RETURNING id
  )
  SELECT count(*) INTO v_invitations_deleted FROM deleted;

  PERFORM get_platform_stats();

  v_result := jsonb_build_object(
    'operation', 'full_cleanup', 'invitations_deleted', v_invitations_deleted,
    'duration_ms', extract(epoch FROM (now() - v_started_at)) * 1000,
    'timestamp', now()::text, 'status', 'completed'
  );

  INSERT INTO settings_audit_log (action, new_data, changed_at)
  VALUES ('full_cleanup', v_result, now());
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_member_invitation_by_token(p_token text)
RETURNS TABLE(
  id uuid, organization_id uuid, email text, role text, token text,
  expires_at timestamptz, invited_by uuid, created_at timestamptz, org_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT mi.id, mi.organization_id, mi.email, mi.role, mi.token,
         mi.expires_at, mi.invited_by, mi.created_at, organization.name
  FROM member_invitations AS mi
  LEFT JOIN organizations AS organization ON organization.id = mi.organization_id
  WHERE mi.token = p_token AND mi.expires_at >= now()
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_organization_dashboard_v2(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  v_prev_members integer;
  v_prev_videos integer;
  v_prev_quizzes integer;
  v_curr_members integer;
  v_curr_videos integer;
  v_curr_quizzes integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND (role = 'super_admin'::user_role OR (organization_id = p_org_id AND role = 'org_admin'::user_role))
  ) THEN
    RAISE EXCEPTION 'Permission refusee';
  END IF;

  SELECT total_members, total_videos, total_quizzes
  INTO v_curr_members, v_curr_videos, v_curr_quizzes
  FROM admin_dashboard_stats WHERE organization_id = p_org_id;
  SELECT count(*) INTO v_prev_members FROM profiles WHERE organization_id = p_org_id AND created_at < date_trunc('month', now());
  SELECT count(*) INTO v_prev_videos FROM videos AS video JOIN pillars AS pillar ON pillar.id = video.pillar_id
  WHERE pillar.organization_id = p_org_id AND video.created_at < date_trunc('month', now());
  SELECT count(*) INTO v_prev_quizzes FROM quizzes AS quiz
  JOIN videos AS video ON video.id = quiz.video_id JOIN pillars AS pillar ON pillar.id = video.pillar_id
  WHERE pillar.organization_id = p_org_id AND quiz.created_at < date_trunc('month', now());

  SELECT jsonb_build_object(
    'organization', (SELECT jsonb_build_object('id', id, 'name', name, 'plan_type', plan_type) FROM organizations WHERE id = p_org_id),
    'stats', jsonb_build_object(
      'total_members', coalesce(v_curr_members, 0), 'total_videos', coalesce(v_curr_videos, 0), 'total_quizzes', coalesce(v_curr_quizzes, 0),
      'growth_members', CASE WHEN v_prev_members > 0 THEN ((coalesce(v_curr_members, 0) - v_prev_members)::float / v_prev_members * 100)::int ELSE 0 END,
      'growth_videos', CASE WHEN v_prev_videos > 0 THEN ((coalesce(v_curr_videos, 0) - v_prev_videos)::float / v_prev_videos * 100)::int ELSE 0 END,
      'growth_quizzes', CASE WHEN v_prev_quizzes > 0 THEN ((coalesce(v_curr_quizzes, 0) - v_prev_quizzes)::float / v_prev_quizzes * 100)::int ELSE 0 END,
      'avg_score', (SELECT avg_score FROM admin_dashboard_stats WHERE organization_id = p_org_id)
    ),
    'recent_activities', coalesce((
      SELECT jsonb_agg(activity) FROM (
        SELECT jsonb_build_object('description', notification.title, 'timestamp', notification.created_at) AS activity
        FROM notifications AS notification JOIN profiles AS profile ON profile.id = notification.user_id
        WHERE profile.organization_id = p_org_id ORDER BY notification.created_at DESC LIMIT 5
      ) AS activities
    ), '[]'::jsonb),
    'top_students', coalesce((
      SELECT jsonb_agg(student) FROM (
        SELECT jsonb_build_object('name', profile.full_name, 'completion', coalesce(avg(progress.quiz_score), 0)::int) AS student
        FROM profiles AS profile LEFT JOIN user_progress AS progress ON progress.user_id = profile.id
        WHERE profile.organization_id = p_org_id AND profile.role = 'student'::user_role
        GROUP BY profile.id, profile.full_name ORDER BY coalesce(avg(progress.quiz_score), 0) DESC LIMIT 5
      ) AS students
    ), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_platform_settings_v1(
  p_trial_days integer, p_allow_registration boolean, p_maintenance_mode boolean,
  p_max_file_size integer, p_allowed_video_formats text[], p_api_enabled boolean, p_api_rate_limit integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'::user_role) THEN
    RAISE EXCEPTION 'Permission refusee';
  END IF;

  UPDATE system_settings SET
    trial_days = p_trial_days, allow_registration = p_allow_registration,
    maintenance_mode = p_maintenance_mode, max_file_size = p_max_file_size,
    allowed_video_formats = p_allowed_video_formats, api_enabled = p_api_enabled,
    api_rate_limit = p_api_rate_limit, updated_at = now()
  WHERE id = 1;
  IF NOT FOUND THEN
    INSERT INTO system_settings (id, trial_days, allow_registration, maintenance_mode, max_file_size, allowed_video_formats, api_enabled, api_rate_limit)
    VALUES (1, p_trial_days, p_allow_registration, p_maintenance_mode, p_max_file_size, p_allowed_video_formats, p_api_enabled, p_api_rate_limit);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_platform(search_query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_organization_id uuid;
  v_is_super_admin boolean;
  v_organizations jsonb;
  v_users jsonb;
  v_videos jsonb;
BEGIN
  SELECT organization_id, role = 'super_admin'::user_role
  INTO v_organization_id, v_is_super_admin
  FROM profiles WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Permission refusee';
  END IF;

  SELECT jsonb_agg(item) INTO v_organizations FROM (
    SELECT jsonb_build_object('type', 'organization', 'id', organization.id, 'name', organization.name, 'plan', organization.plan_type, 'created', organization.created_at) AS item
    FROM organizations AS organization
    WHERE (v_is_super_admin OR organization.id = v_organization_id)
      AND organization.name ILIKE '%' || left(search_query, 100) || '%'
    ORDER BY organization.created_at DESC LIMIT 10
  ) AS organizations_result;

  SELECT jsonb_agg(item) INTO v_users FROM (
    SELECT jsonb_build_object('type', 'user', 'id', profile.id, 'name', coalesce(profile.full_name, profile.email), 'email', profile.email, 'role', profile.role, 'organization', organization.name) AS item
    FROM profiles AS profile LEFT JOIN organizations AS organization ON organization.id = profile.organization_id
    WHERE (v_is_super_admin OR profile.organization_id = v_organization_id)
      AND (profile.full_name ILIKE '%' || left(search_query, 100) || '%' OR profile.email ILIKE '%' || left(search_query, 100) || '%')
    ORDER BY profile.created_at DESC LIMIT 10
  ) AS users_result;

  SELECT jsonb_agg(item) INTO v_videos FROM (
    SELECT jsonb_build_object('type', 'video', 'id', video.id, 'title', video.title, 'description', video.description, 'pillar', pillar.name, 'organization', organization.name) AS item
    FROM videos AS video JOIN pillars AS pillar ON pillar.id = video.pillar_id JOIN organizations AS organization ON organization.id = pillar.organization_id
    WHERE (v_is_super_admin OR organization.id = v_organization_id)
      AND (video.title ILIKE '%' || left(search_query, 100) || '%' OR video.description ILIKE '%' || left(search_query, 100) || '%')
    ORDER BY video.created_at DESC LIMIT 10
  ) AS videos_result;

  RETURN jsonb_build_object(
    'query', left(search_query, 100), 'organizations', coalesce(v_organizations, '[]'::jsonb),
    'users', coalesce(v_users, '[]'::jsonb), 'videos', coalesce(v_videos, '[]'::jsonb),
    'total_results', coalesce(jsonb_array_length(v_organizations), 0) + coalesce(jsonb_array_length(v_users), 0) + coalesce(jsonb_array_length(v_videos), 0),
    'timestamp', now()::text
  );
END;
$$;

COMMIT;
