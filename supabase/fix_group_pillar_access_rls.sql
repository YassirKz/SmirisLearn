-- ============================================================
-- CORRECTION DES POLITIQUES RLS SUR LA TABLE group_pillar_access
-- À exécuter dans le SQL Editor de Supabase
-- ============================================================

-- 1. S'assurer que la RLS est activée
ALTER TABLE group_pillar_access ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes politiques conflictuelles s'il y en a
DROP POLICY IF EXISTS "Admins can manage group pillar access" ON group_pillar_access;
DROP POLICY IF EXISTS "Users can read group pillar access" ON group_pillar_access;
DROP POLICY IF EXISTS "Admins can insert group pillar access" ON group_pillar_access;
DROP POLICY IF EXISTS "Admins can delete group pillar access" ON group_pillar_access;
DROP POLICY IF EXISTS "Select group pillar access" ON group_pillar_access;

-- 3. Politique de lecture (SELECT) : Permettre aux membres (admins et étudiants) de l'organisation de voir les accès
CREATE POLICY "Users can read group pillar access"
ON group_pillar_access
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN groups g ON g.id = group_pillar_access.group_id
    WHERE p.id = auth.uid()
    AND (p.organization_id = g.organization_id OR p.role = 'super_admin')
  )
);

-- 4. Politique d'écriture globale (ALL) ou spécifiques (INSERT/DELETE) : Permettre aux admins de gérer les accès
CREATE POLICY "Admins can manage group pillar access"
ON group_pillar_access
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN groups g ON g.id = group_pillar_access.group_id
    WHERE p.id = auth.uid()
    AND (
      (p.role = 'org_admin' AND p.organization_id = g.organization_id)
      OR p.role = 'super_admin'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN groups g ON g.id = group_pillar_access.group_id
    WHERE p.id = auth.uid()
    AND (
      (p.role = 'org_admin' AND p.organization_id = g.organization_id)
      OR p.role = 'super_admin'
    )
  )
);
