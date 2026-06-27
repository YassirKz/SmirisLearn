import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useUserRole } from "../../hooks/useUserRole";
import LoadingSpinner from "../ui/LoadingSpinner";

/**
 * Composant pour protéger les routes
 * @param {Object} props
 * @param {React.ReactNode} props.children - Composant à protéger
 * @param {Array} props.allowedRoles - Rôles autorisés (ex: ['super_admin', 'org_admin'])
 * @param {string} props.redirectTo - URL de redirection si non autorisé
 */
export default function ProtectedRoute({
  children,
  allowedRoles = [],
  redirectTo = "/login",
}) {
  const { user, loading: authLoading } = useAuth();
  const { role, subscriptionStatus, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const currentPath = location.pathname;

  // Afficher un loader pendant la vérification
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  // Si pas d'utilisateur, rediriger vers login
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si des rôles sont spécifiés et que l'utilisateur n'a pas le bon rôle
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Vérifier le statut de l'abonnement
  if (subscriptionStatus === 'past_due' || subscriptionStatus === 'canceled' || subscriptionStatus === 'suspended') {
    // Si c'est un org_admin et qu'il essaie d'accéder aux paramètres (pour payer), on le laisse passer
    if (role === 'org_admin' && currentPath === '/admin/settings') {
      return children;
    }
    // Sinon, on bloque l'accès
    return <Navigate to="/unauthorized" state={{ errorType: 'trial_expired' }} replace />;
  }

  // Tout est bon, afficher le composant
  return children;
}
