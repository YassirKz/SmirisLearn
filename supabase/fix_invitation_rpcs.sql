-- ============================================================
-- VÉRIFICATION ET CORRECTION DU RPC accept_member_invitation
-- À exécuter dans le SQL Editor de Supabase
-- ============================================================

-- 1. Vérifier que le RPC accept_member_invitation existe et voir sa définition actuelle
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'accept_member_invitation';

-- ============================================================
-- 2. Si le RPC est absent ou incorrect, le (re)créer :
-- ============================================================

CREATE OR REPLACE FUNCTION accept_member_invitation(
  p_token     TEXT,
  p_user_id   UUID,
  p_full_name TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Récupérer l'invitation par token
  SELECT *
  INTO v_invitation
  FROM member_invitations
  WHERE token = p_token
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation introuvable pour ce token';
  END IF;

  IF v_invitation.expires_at < NOW() THEN
    RAISE EXCEPTION 'Invitation expirée';
  END IF;

  -- Mettre à jour le profil : affecter organization_id et role
  UPDATE profiles
  SET
    organization_id = v_invitation.organization_id,
    role            = v_invitation.role::user_role,
    full_name       = COALESCE(
                        NULLIF(TRIM(p_full_name), ''),  -- nom fourni dans le formulaire
                        NULLIF(TRIM(full_name), ''),    -- nom existant s'il y en a un
                        split_part(v_invitation.email, '@', 1) -- fallback sur la partie locale de l'email
                      )
  WHERE id = p_user_id;

  -- Si le profil n'existe pas encore (défaillance ou absence du déclencheur auth.users), le créer
  IF NOT FOUND THEN
    INSERT INTO profiles (id, email, role, full_name, organization_id, created_at)
    VALUES (
      p_user_id,
      v_invitation.email,
      v_invitation.role::user_role,
      COALESCE(NULLIF(TRIM(p_full_name), ''), split_part(v_invitation.email, '@', 1)),
      v_invitation.organization_id,
      NOW()
    );
  END IF;

  -- Supprimer l'invitation après acceptation
  DELETE FROM member_invitations WHERE token = p_token;
END;
$$;

-- Autoriser les utilisateurs authentifiés à appeler ce RPC
GRANT EXECUTE ON FUNCTION accept_member_invitation(TEXT, UUID, TEXT) TO authenticated;

-- ============================================================
-- 3. Vérifier également le RPC get_member_invitation_by_token
-- (pour les visiteurs non connectés qui vérifient leur lien)
-- ============================================================

CREATE OR REPLACE FUNCTION get_member_invitation_by_token(p_token TEXT)
RETURNS TABLE (
  id              UUID,
  organization_id UUID,
  email           TEXT,
  role            TEXT,
  token           TEXT,
  expires_at      TIMESTAMPTZ,
  invited_by      UUID,
  created_at      TIMESTAMPTZ,
  org_name        TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mi.id,
    mi.organization_id,
    mi.email,
    mi.role,
    mi.token,
    mi.expires_at,
    mi.invited_by,
    mi.created_at,
    o.name AS org_name
  FROM member_invitations mi
  LEFT JOIN organizations o ON o.id = mi.organization_id
  WHERE mi.token = p_token
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_member_invitation_by_token(TEXT) TO anon, authenticated;
