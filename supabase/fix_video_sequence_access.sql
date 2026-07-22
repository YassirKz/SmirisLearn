-- Verrouille chaque video d'un pilier jusqu'a la validation de la precedente.
-- A executer dans Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.can_access_video(p_student_id uuid, p_video_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pillar_id uuid;
  v_previous_video_id uuid;
  v_previous_watched boolean;
  v_previous_quiz_passed boolean;
  v_previous_requires_quiz boolean;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_student_id THEN
    RETURN false;
  END IF;

  SELECT video.pillar_id INTO v_pillar_id
  FROM videos AS video
  WHERE video.id = p_video_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
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

  -- L'ordre est stable meme si deux videos ont le meme sequence_order.
  SELECT previous_video_id INTO v_previous_video_id
  FROM (
    SELECT
      id,
      lag(id) OVER (ORDER BY sequence_order ASC, created_at ASC, id ASC) AS previous_video_id
    FROM videos
    WHERE pillar_id = v_pillar_id
  ) AS ordered_videos
  WHERE id = p_video_id;

  -- La premiere video est la seule ouverte initialement.
  IF v_previous_video_id IS NULL THEN
    RETURN true;
  END IF;

  SELECT watched, quiz_passed
  INTO v_previous_watched, v_previous_quiz_passed
  FROM user_progress
  WHERE user_id = auth.uid() AND video_id = v_previous_video_id;

  IF v_previous_watched IS NOT TRUE THEN
    RETURN false;
  END IF;

  SELECT EXISTS (SELECT 1 FROM quizzes WHERE video_id = v_previous_video_id)
  INTO v_previous_requires_quiz;

  RETURN NOT v_previous_requires_quiz OR v_previous_quiz_passed IS TRUE;
END;
$$;
