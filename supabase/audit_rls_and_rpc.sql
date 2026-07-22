-- Audit en lecture seule des controles d'acces Smiris Learn.
-- A executer dans Supabase SQL Editor. Ce script ne modifie aucune donnee.

-- 1. RLS doit etre activee sur toutes les tables exposees par l'application.
WITH expected_tables(table_name) AS (
  VALUES
    ('access_requests'), ('api_keys'), ('contacts'), ('group_members'),
    ('group_pillar_access'), ('groups'), ('member_invitations'),
    ('notifications'), ('organizations'), ('pending_companies'), ('pillars'),
    ('profiles'), ('quizzes'), ('system_settings'), ('user_progress'), ('videos')
)
SELECT
  expected_tables.table_name,
  COALESCE(class.relrowsecurity, false) AS rls_enabled,
  COALESCE(class.relforcerowsecurity, false) AS rls_forced,
  CASE
    WHEN class.oid IS NULL THEN 'TABLE_MISSING'
    WHEN NOT class.relrowsecurity THEN 'RLS_DISABLED'
    ELSE 'OK'
  END AS status
FROM expected_tables
LEFT JOIN pg_class AS class
  ON class.relname = expected_tables.table_name
  AND class.relnamespace = 'public'::regnamespace
ORDER BY status DESC, expected_tables.table_name;

-- 2. Toutes les policies RLS de l'application, y compris leur condition d'ecriture.
SELECT
  rls_policy.tablename,
  rls_policy.policyname,
  rls_policy.cmd AS operation,
  rls_policy.roles,
  rls_policy.qual AS using_expression,
  rls_policy.with_check AS with_check_expression
FROM pg_policies AS rls_policy
WHERE rls_policy.schemaname IN ('public', 'storage')
  AND (
    rls_policy.schemaname = 'storage'
    OR rls_policy.tablename IN (
      'access_requests', 'api_keys', 'contacts', 'group_members',
      'group_pillar_access', 'groups', 'member_invitations', 'notifications',
      'organizations', 'pending_companies', 'pillars', 'profiles', 'quizzes',
      'system_settings', 'user_progress', 'videos'
    )
  )
ORDER BY rls_policy.schemaname, rls_policy.tablename, rls_policy.cmd, rls_policy.policyname;

-- 3. Le bucket de videos doit etre prive. Une URL publique contourne les RLS des tables.
SELECT
  id AS bucket_id,
  public AS is_public,
  file_size_limit,
  allowed_mime_types,
  CASE
    WHEN id = 'videos' AND public THEN 'ACTION_REQUIRED_MAKE_PRIVATE'
    WHEN id = 'videos' THEN 'OK'
    ELSE 'INFO'
  END AS status
FROM storage.buckets
WHERE id = 'videos';

-- 4. Policies Storage sur les objets videos. Elles doivent contraindre bucket_id et le dossier organisation.
SELECT
  policyname,
  cmd AS operation,
  roles,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY cmd, policyname;

-- 5. Fonctions RPC appelees par le client: presence, SECURITY DEFINER et droits anon/authenticated.
WITH expected_rpcs(function_name) AS (
  VALUES
    ('accept_invitation_and_create_org'), ('accept_member_invitation'),
    ('can_access_video'), ('check_organization_limits_full'),
    ('full_system_cleanup'), ('get_member_invitation_by_token'),
    ('get_super_admin_dashboard'), ('save_platform_settings_v1'),
    ('search_platform')
)
SELECT
  expected_rpcs.function_name,
  routine.oid IS NOT NULL AS exists_in_public_schema,
  COALESCE(routine.prosecdef, false) AS security_definer,
  COALESCE(array_to_string(routine.proconfig, ', '), '') AS function_config,
  COALESCE(has_function_privilege('anon', routine.oid, 'EXECUTE'), false) AS anon_can_execute,
  COALESCE(has_function_privilege('authenticated', routine.oid, 'EXECUTE'), false) AS authenticated_can_execute,
  CASE
    WHEN routine.oid IS NULL THEN 'FUNCTION_MISSING'
    WHEN routine.prosecdef
      AND NOT EXISTS (
        SELECT 1
        FROM unnest(COALESCE(routine.proconfig, ARRAY[]::text[])) AS config(setting)
        WHERE config.setting LIKE 'search_path=%'
      ) THEN 'ACTION_REQUIRED_SET_SEARCH_PATH'
    ELSE 'REVIEW_GRANTS'
  END AS status
FROM expected_rpcs
LEFT JOIN pg_proc AS routine
  ON routine.proname = expected_rpcs.function_name
  AND routine.pronamespace = 'public'::regnamespace
ORDER BY status DESC, expected_rpcs.function_name;

-- 6. Toute fonction SECURITY DEFINER sans search_path explicite est a corriger en priorite.
SELECT
  namespace.nspname AS schema_name,
  routine.proname AS function_name,
  pg_get_function_identity_arguments(routine.oid) AS arguments,
  array_to_string(routine.proconfig, ', ') AS function_config
FROM pg_proc AS routine
JOIN pg_namespace AS namespace ON namespace.oid = routine.pronamespace
WHERE routine.prosecdef
  AND namespace.nspname IN ('public', 'storage')
  AND NOT EXISTS (
    SELECT 1
    FROM unnest(COALESCE(routine.proconfig, ARRAY[]::text[])) AS config(setting)
    WHERE config.setting LIKE 'search_path=%'
  )
ORDER BY namespace.nspname, routine.proname;

-- 7. Liste complete des droits EXECUTE accordes a anon, authenticated ou public.
SELECT
  namespace.nspname AS schema_name,
  routine.proname AS function_name,
  pg_get_function_identity_arguments(routine.oid) AS arguments,
  routine.prosecdef AS security_definer,
  has_function_privilege('anon', routine.oid, 'EXECUTE') AS anon_can_execute,
  has_function_privilege('authenticated', routine.oid, 'EXECUTE') AS authenticated_can_execute,
  has_function_privilege('public', routine.oid, 'EXECUTE') AS public_can_execute
FROM pg_proc AS routine
JOIN pg_namespace AS namespace ON namespace.oid = routine.pronamespace
WHERE namespace.nspname = 'public'
  AND routine.prokind = 'f'
  AND (
    has_function_privilege('anon', routine.oid, 'EXECUTE')
    OR has_function_privilege('authenticated', routine.oid, 'EXECUTE')
    OR has_function_privilege('public', routine.oid, 'EXECUTE')
  )
ORDER BY routine.prosecdef DESC, routine.proname;
