import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import React from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import logger from "../lib/logger";

const UserRoleContext = createContext();

export const UserRoleProvider = ({ children }) => {
  const { user } = useAuth();
  const [role, setRole] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isAdminAccess, setIsAdminAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastFetchedUserId = React.useRef(null);
  const hasAttemptedSync = React.useRef(false);

  const fetchRoleData = useCallback(async () => {
    if (!user) {
      setRole(null);
      setOrganizationId(null);
      setIsAdminAccess(false);
      setLoading(false);
      return;
    }

    logger.debug("[UserRoleContext] Chargement du rôle", { userId: user.id });

    // Premier chargement pour cet utilisateur : afficher le spinner
    // Refresh silen cieux (même user.id) : ne pas remettre loading=true
    const isFirstLoad = lastFetchedUserId.current !== user.id;
    if (isFirstLoad) {
      hasAttemptedSync.current = false;
      setLoading(true);
    }

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, organization_id, organizations(subscription_status)")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      const finalRole = profile?.role || "student";
      const finalOrgId = profile?.organization_id;

      // Auto-synchronisation du JWT (user_metadata) si le profil DB a changé (ex: promotion admin)
      // On normalise avec "|| null" pour éviter que "undefined !== null" ne provoque une boucle infinie.
      const userRole = user.user_metadata?.role;
      const userOrg = user.user_metadata?.organization_id || null;
      const dbOrg = profile?.organization_id || null;

      if (
        profile &&
        !hasAttemptedSync.current &&
        (userRole !== profile.role || userOrg !== dbOrg)
      ) {
        hasAttemptedSync.current = true;
        try {
          await supabase.auth.updateUser({
            data: {
              role: profile.role,
              organization_id: profile.organization_id,
            },
          });
        } catch (syncErr) {
          logger.error("Erreur de synchronisation du token JWT:", syncErr);
        }
      }

      setRole(finalRole);
      setOrganizationId(finalOrgId);
      setSubscriptionStatus(profile?.organizations?.subscription_status || null);
      setIsAdminAccess(["super_admin", "org_admin"].includes(finalRole));

      logger.debug("[UserRoleContext] Rôle récupéré", { role: finalRole, organizationId: finalOrgId });

      lastFetchedUserId.current = user.id;
      return { role: finalRole, organizationId: finalOrgId };
    } catch (err) {
      logger.error("Error fetching role data:", err);
      setRole("student");
      return { role: "student", organizationId: null };
    } finally {
      // Toujours relacher le loading (ne bloque que le premier chargement)
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRoleData();
  }, [fetchRoleData]);

  const value = useMemo(
    () => ({
      role,
      organizationId,
      subscriptionStatus,
      isAdminAccess,
      loading,
      refreshRole: fetchRoleData,
    }),
    [role, organizationId, subscriptionStatus, isAdminAccess, loading, fetchRoleData],
  );

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error("useUserRole must be used within a UserRoleProvider");
  }
  return context;
};
