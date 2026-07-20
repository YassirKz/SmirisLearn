-- RPC: get_member_invitation_by_token
-- Permet aux utilisateurs non connectés de vérifier une invitation par token
-- SECURITY DEFINER = bypass RLS
CREATE OR REPLACE FUNCTION get_member_invitation_by_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  email TEXT,
  role TEXT,
  token TEXT,
  expires_at TIMESTAMPTZ,
  invited_by UUID,
  created_at TIMESTAMPTZ,
  org_name TEXT
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

-- Permettre à tous (y compris anon) d'appeler cette fonction
GRANT EXECUTE ON FUNCTION get_member_invitation_by_token(TEXT) TO anon, authenticated;
