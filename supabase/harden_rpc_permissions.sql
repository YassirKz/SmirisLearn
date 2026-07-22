-- Durcissement des permissions RPC Smiris Learn.
-- A executer dans Supabase SQL Editor, puis tester les invitations, lecture video,
-- administration et paiement. Les fonctions elles-memes doivent aussi verifier auth.uid()
-- et le role applicatif avant toute operation privilegiee.

BEGIN;

-- Supprime le droit implicite PUBLIC, qui rendait toutes les fonctions appelables par anon.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Empeche que les nouvelles fonctions retrouvent le droit PUBLIC par defaut.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Reautorise uniquement les appels necessaires a l'interface connectee, ainsi que les
-- helpers utilises par les policies RLS. Les signatures absentes sont ignorees.
DO $$
DECLARE
  function_signature text;
  function_ref regprocedure;
BEGIN
  FOREACH function_signature IN ARRAY ARRAY[
    -- RPC client
    'public.accept_invitation_and_create_org(text,uuid,text,text)',
    'public.accept_member_invitation(text,uuid,text)',
    'public.can_access_video(uuid,uuid)',
    'public.check_organization_limits_full(uuid)',
    'public.full_system_cleanup()',
    'public.get_organization_dashboard_v2(uuid)',
    'public.get_super_admin_dashboard()',
    'public.save_platform_settings_v1(integer,boolean,boolean,integer,text[],boolean,integer)',
    'public.search_platform(text)',

    -- Helpers RLS
    'public.get_auth_org_id()',
    'public.get_auth_role()',
    'public.get_group_org_id(uuid)',
    'public.get_my_group_ids()',
    'public.get_my_org_id()',
    'public.get_my_role()',
    'public.get_user_group_role(uuid,uuid)',
    'public.get_user_org_id()',
    'public.get_user_org_id(uuid)',
    'public.is_org_admin(uuid)',
    'public.is_super_admin()',
    'public.is_user_member_of_group(uuid,uuid)'
  ]
  LOOP
    function_ref := to_regprocedure(function_signature);
    IF function_ref IS NOT NULL THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', function_ref);
    END IF;
  END LOOP;
END;
$$;

-- Cette RPC est le seul appel intentionnellement disponible avant connexion.
GRANT EXECUTE ON FUNCTION public.get_member_invitation_by_token(text) TO anon, authenticated;

-- RPC appelees exclusivement par les Edge Functions avec la cle service_role.
DO $$
DECLARE
  function_signature text;
  function_ref regprocedure;
BEGIN
  FOREACH function_signature IN ARRAY ARRAY[
    'public.check_organization_limits_full(uuid)',
    'public.check_rate_limit(text,text,integer,integer)',
    'public.register_stripe_event(text,text)'
  ]
  LOOP
    function_ref := to_regprocedure(function_signature);
    IF function_ref IS NOT NULL THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', function_ref);
    END IF;
  END LOOP;
END;
$$;

COMMIT;

-- Verification: anon ne doit voir que get_member_invitation_by_token.
SELECT
  routine.proname AS function_name,
  pg_get_function_identity_arguments(routine.oid) AS arguments,
  has_function_privilege('anon', routine.oid, 'EXECUTE') AS anon_can_execute,
  has_function_privilege('authenticated', routine.oid, 'EXECUTE') AS authenticated_can_execute,
  has_function_privilege('public', routine.oid, 'EXECUTE') AS public_can_execute
FROM pg_proc AS routine
WHERE routine.pronamespace = 'public'::regnamespace
  AND routine.prokind = 'f'
  AND has_function_privilege('anon', routine.oid, 'EXECUTE')
ORDER BY routine.proname;
