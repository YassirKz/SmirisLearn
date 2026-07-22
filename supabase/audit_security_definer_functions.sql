-- Audit en lecture seule du contenu des fonctions SECURITY DEFINER les plus sensibles.
-- A executer dans Supabase SQL Editor et partager les resultats avec les secrets masques.

WITH target_functions(function_name) AS (
  VALUES
    ('accept_invitation_and_create_org'),
    ('accept_member_invitation'),
    ('can_access_video'),
    ('check_organization_limits_full'),
    ('full_system_cleanup'),
    ('get_member_invitation_by_token'),
    ('get_organization_dashboard_v2'),
    ('get_super_admin_dashboard'),
    ('record_quiz_attempt'),
    ('save_platform_settings_v1'),
    ('search_platform')
)
SELECT
  routine.proname AS function_name,
  pg_get_function_identity_arguments(routine.oid) AS arguments,
  routine.prosecdef AS security_definer,
  array_to_string(routine.proconfig, ', ') AS function_config,
  pg_get_functiondef(routine.oid) AS definition
FROM target_functions
JOIN pg_proc AS routine
  ON routine.proname = target_functions.function_name
  AND routine.pronamespace = 'public'::regnamespace
ORDER BY routine.proname, pg_get_function_identity_arguments(routine.oid);
