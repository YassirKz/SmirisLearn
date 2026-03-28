import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook pour vérifier si l'organisation actuelle est celle du Super Admin (Smiris Academy)
 * @param {string} orgId - L'ID de l'organisation à vérifier
 * @returns {Object} { isOwnerOrg, loading, orgName }
 */
export function useOwnerOrg(orgId) {
    const [isOwnerOrg, setIsOwnerOrg] = useState(false);
    const [orgName, setOrgName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) {
            setLoading(false);
            return;
        }

        const checkOrg = async () => {
            try {
                // On vérifie soit par l'ID défini dans .env, soit par le nom
                const ownerId = import.meta.env.VITE_OWNER_ORG_ID;
                
                if (ownerId && orgId === ownerId) {
                    setIsOwnerOrg(true);
                    setLoading(false);
                    return;
                }

                // Fallback : Vérification par nom si l'ID n'est pas configuré
                const { data, error } = await supabase
                    .from('organizations')
                    .select('name')
                    .eq('id', orgId)
                    .maybeSingle();

                if (data) {
                    setOrgName(data.name);
                    const name = data.name.toLowerCase();
                    if (name.includes('smiris academy') || name.includes('smris academy')) {
                        setIsOwnerOrg(true);
                    }
                }
            } catch (err) {
                console.error('Erreur checkOwnerOrg:', err);
            } finally {
                setLoading(false);
            }
        };

        checkOrg();
    }, [orgId]);

    return { isOwnerOrg, loading, orgName };
}
