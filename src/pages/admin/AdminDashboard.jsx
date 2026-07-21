import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Video,
  Award,
  TrendingUp,
  Sparkles,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  Activity,
  UserPlus,
  PlayCircle,
  X,
  ArrowRight,
  CreditCard,
  Zap,
  Timer,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { supabase } from "../../lib/supabase";
import logger from "../../lib/logger";
import { useSearchParams } from "react-router-dom";
import { useUserRole } from "../../hooks/useUserRole";
import { useStripe } from "../../hooks/useStripe";

// Calcule le nombre de jours restants dans la période d'essai
function getTrialDaysRemaining(endsAt) {
  if (!endsAt) return 0;
  const diff = new Date(endsAt) - new Date();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
}

export default function AdminDashboard() {
  const { organizationId, loading: roleLoading } = useUserRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const { createCheckoutSession, loading: stripeLoading } = useStripe();
  const orgIdFromUrl = searchParams.get("orgId");
  const firstLogin = searchParams.get("firstLogin") === "true";

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isTabVisible, setIsTabVisible] = useState(true);

  // États pour les alertes d'essai
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showTrialBanner, setShowTrialBanner] = useState(false);
  const [orgTrialData, setOrgTrialData] = useState({ subscription_status: null, trial_ends_at: null });

  // Affiche le modal de bienvenue si c'est le premier login via invitation
  useEffect(() => {
    if (firstLogin) {
      setShowWelcomeModal(true);
      // Nettoyer le paramètre firstLogin de l'URL sans recharger
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("firstLogin");
      setSearchParams(newParams, { replace: true });
    }
  }, [firstLogin]);

  // Récupère directement les données d'essai depuis la table organizations
  useEffect(() => {
    const fetchTrialData = async () => {
      const targetOrgId = orgIdFromUrl || organizationId;
      if (!targetOrgId) return;
      try {
        const { data: org } = await supabase
          .from('organizations')
          .select('subscription_status, trial_ends_at')
          .eq('id', targetOrgId)
          .maybeSingle();
        if (org) {
          setOrgTrialData(org);
          if (org.subscription_status === 'trial') {
            setShowTrialBanner(true);
          }
        }
      } catch (err) {
        logger.error('[AdminDashboard] Erreur fetch trial data:', err);
      }
    };
    fetchTrialData();
  }, [orgIdFromUrl, organizationId]);

  const handlePayNow = () => {
    setShowWelcomeModal(false);
    const priceId = import.meta.env.VITE_STRIPE_STARTER_PRICE_ID;
    createCheckoutSession(priceId);
  };

  // Monitoring de la visibilité de l'onglet (Performance)
  useEffect(() => {
    const handleVisibilityChange = () =>
      setIsTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!isTabVisible && dashboardData) return; // Économie de ressources si onglet caché

    logger.debug('[AdminDashboard] Chargement');
    try {
      const targetOrgId = orgIdFromUrl || organizationId;
      if (!targetOrgId) {
        if (!roleLoading) {
          setError("Vous n'êtes assigné à aucune organisation.");
          setLoading(false);
        }
        return;
      }

      // Utilise la nouvelle RPC optimisée (V2)
      const { data, error } = await supabase.rpc(
        "get_organization_dashboard_v2",
        {
          p_org_id: targetOrgId,
        },
      );

      if (error) throw error;
      if (!data)
        throw new Error(
          "Accès refusé ou données introuvables. Vérifiez vos permissions.",
        );

      logger.debug('[AdminDashboard] Données chargées', {
        organizationId: data.organization?.id,
        hasStats: Boolean(data.stats)
      });

      setDashboardData(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      logger.error("Erreur lors du chargement du tableau de bord:", err);
      setError(
        err.message ||
          (typeof err === "object" ? JSON.stringify(err) : String(err)),
      );
    } finally {
      setLoading(false);
    }
  }, [orgIdFromUrl, organizationId, isTabVisible, dashboardData, roleLoading]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // 1 minute (économie serveur)
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-secondary-200/50 dark:border-secondary-200/20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-secondary-200 dark:border-primary-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-6 text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">
            Chargement...
          </p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !dashboardData) {
    return (
      <AdminLayout>
        <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm border border-red-200/50 dark:border-red-800/30 p-6 rounded-3xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100/80 dark:bg-red-900/20 rounded-2xl">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                Erreur de chargement
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {error || "Aucune donnée disponible."}
              </p>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-5 py-2.5 bg-red-500 text-white rounded-2xl text-sm font-semibold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/25"
          >
            Réessayer
          </button>
        </div>
      </AdminLayout>
    );
  }

  const { organization, stats, recent_activities, top_students } =
    dashboardData;

  const cards = [
    {
      label: "Membres",
      value: stats?.total_members || 0,
      growth: stats?.growth_members || 0,
      icon: Users,
      color: "from-blue-500 to-cyan-400",
      glow: "shadow-blue-500/30",
      description: "Nombre total de membres",
    },
    {
      label: "Vidéos",
      value: stats?.total_videos || 0,
      growth: stats?.growth_videos || 0,
      icon: Video,
      color: "from-purple-500 to-pink-500",
      glow: "shadow-purple-500/30",
      description: "Nombre total de vidéos",
    },
    {
      label: "Quiz",
      value: stats?.total_quizzes || 0,
      growth: stats?.growth_quizzes || 0,
      icon: Award,
      color: "from-orange-500 to-amber-400",
      glow: "shadow-orange-500/30",
      description: "Nombre total de quiz",
    },
    {
      label: "Score Moyen",
      value: `${Math.round(stats?.avg_score || 0)}%`,
      growth: 0,
      icon: TrendingUp,
      color: "from-emerald-400 to-teal-500",
      glow: "shadow-emerald-500/30",
      description: "Performance globale",
    },
  ];

  const trialDays = getTrialDaysRemaining(orgTrialData.trial_ends_at);
  const isInTrial = orgTrialData.subscription_status === 'trial';

  return (
    <AdminLayout>
      {/* ================================================ */}
      {/* MODAL DE BIENVENUE — premier login via invitation */}
      {/* ================================================ */}
      <AnimatePresence>
        {showWelcomeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setShowWelcomeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden"
            >
              {/* Bande de gradient haut */}
              <div className="relative h-36 bg-gradient-to-br from-primary-600 via-primary-700 to-blue-600 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent)] pointer-events-none" />
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                <div className="relative text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                    className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg border border-white/30"
                  >
                    <Zap className="w-8 h-8 text-white" />
                  </motion.div>
                  <p className="text-white/90 text-sm font-bold uppercase tracking-widest">Smiris Learn</p>
                </div>
                <button
                  onClick={() => setShowWelcomeModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Corps */}
              <div className="p-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
                    Bienvenue ! 🎉
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                    Votre espace de formation{" "}
                    <span className="font-bold text-gray-800 dark:text-white">
                      {dashboardData?.organization?.name}
                    </span>{" "}
                    est prêt. Vous bénéficiez actuellement d'une{" "}
                    <span className="font-bold text-primary-600 dark:text-primary-400">
                      période d'essai gratuite de 14 jours
                    </span>.
                  </p>

                  {/* Alerte essai */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-2xl p-4 mb-6 flex items-start gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-800/30 rounded-xl shrink-0 mt-0.5">
                      <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-0.5">
                        Période d'essai active — {trialDays} jours restants
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                        Pour conserver l'accès complet à toutes vos fonctionnalités
                        après l'essai, activez votre abonnement avant l'expiration.
                      </p>
                    </div>
                  </div>

                  {/* Boutons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <motion.button
                      whileHover={{ scale: stripeLoading ? 1 : 1.03 }}
                      whileTap={{ scale: stripeLoading ? 1 : 0.97 }}
                      onClick={handlePayNow}
                      disabled={stripeLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {stripeLoading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                          Redirection...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Passer au plan Starter
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                    <button
                      onClick={() => setShowWelcomeModal(false)}
                      disabled={stripeLoading}
                      className="flex-1 px-5 py-3 text-gray-500 dark:text-gray-400 font-semibold hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
                    >
                      Plus tard
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
        style={{ perspective: "1200px" }}
      >
        {/* ============================================== */}
        {/* BANNIÈRE D'ESSAI — visible tant qu'en période d'essai */}
        {/* ============================================== */}
        <AnimatePresence>
          {isInTrial && showTrialBanner && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative overflow-hidden rounded-2xl border border-primary-200 dark:border-primary-700/40 bg-gradient-to-r from-primary-50 via-blue-50 to-sky-50 dark:from-primary-900/20 dark:via-blue-900/20 dark:to-sky-900/20 shadow-lg shadow-primary-500/10"
            >
              {/* Décoration */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_rgba(59,130,246,0.08),_transparent)] pointer-events-none" />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 pr-5">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-primary-100 dark:bg-primary-800/30 rounded-xl border border-primary-200 dark:border-primary-700/40 shrink-0">
                    <Timer className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-bold text-primary-900 dark:text-primary-200 text-sm">
                      ⏳ Période d'essai —{" "}
                      <span className="text-primary-600 dark:text-primary-400">
                        {trialDays} jour{trialDays > 1 ? "s" : ""} restant{trialDays > 1 ? "s" : ""}
                      </span>
                    </p>
                    <p className="text-xs text-primary-700/70 dark:text-primary-400/70 mt-0.5">
                      Passez au plan Starter pour éviter toute interruption de service.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <motion.button
                    whileHover={{ scale: stripeLoading ? 1 : 1.05 }}
                    whileTap={{ scale: stripeLoading ? 1 : 0.95 }}
                    onClick={handlePayNow}
                    disabled={stripeLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl shadow-md shadow-primary-500/20 transition-all disabled:opacity-60"
                  >
                    {stripeLoading ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    Passer au plan Starter
                  </motion.button>
                  <button
                    onClick={() => setShowTrialBanner(false)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-primary-100 dark:hover:bg-primary-800/30 rounded-xl transition-all"
                    title="Fermer"
                  >
                    <X className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* En-tête */}
        <div className="relative mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-500 text-secondary-900 dark:bg-primary-900/30 text-secondary-900 dark:text-primary-300 text-xs font-bold uppercase tracking-widest mb-4"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {organization?.plan_type === "starter"
                  ? "Plan Starter"
                  : "Plan Premium"}
              </motion.div>

              <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight leading-tight">
                {organization?.name || "Tableau de bord"}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 font-medium">
                <Activity className="w-4 h-4 text-primary-500" />
                Vue générale de l'activité
                <span className="mx-2 opacity-50">•</span>
                <span className="text-sm">
                  Mis à jour à {lastUpdate.toLocaleTimeString("fr-FR")}
                </span>
              </p>
            </div>

            {/* Bouton rafraîchir */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchDashboardData}
              className="px-5 py-2.5 bg-white/50 dark:bg-slate-900/20 backdrop-blur-md border border-secondary-200 dark:border-secondary-200/20 rounded-2xl hover:bg-white/80 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:shadow-md"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Rafraîchir
            </motion.button>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, index) => {
            const isPositive = card.growth >= 0;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="bg-white/60 dark:bg-slate-900/60 rounded-3xl p-6 shadow-lg border border-secondary-200 dark:border-secondary-200/20 backdrop-blur-2xl relative overflow-hidden group"
              >
                {/* Glow de fond */}
                <div
                  className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${card.color} rounded-full opacity-0 dark:opacity-20 blur-3xl group-hover:opacity-10 dark:group-hover:opacity-30 transition-opacity duration-500 pointer-events-none`}
                />

                <div className="relative flex items-start justify-between z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={`w-1.5 h-6 rounded-full bg-gradient-to-b ${card.color} opacity-80`}
                      />
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                        {card.label}
                      </p>
                    </div>
                    <h3 className="text-4xl font-black text-gray-800 dark:text-white tracking-tight leading-none mb-3">
                      {card.value}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-bold ${isPositive ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"}`}
                      >
                        {isPositive ? "+" : ""}
                        {card.growth}%
                      </span>
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                        vs mois d.
                      </span>
                    </div>
                  </div>
                  <div
                    className={`p-3.5 bg-gradient-to-br ${card.color} rounded-2xl shadow-lg ${card.glow} group-hover:rotate-6 transition-transform duration-500 shrink-0`}
                  >
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="mt-5 h-1.5 bg-white/40 dark:bg-slate-900/20 rounded-full overflow-hidden relative z-10 border border-secondary-200 dark:border-secondary-200/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min((card.value.toString().includes("%") ? parseInt(card.value) : card.value / 50) * 100, 100)}%`,
                    }}
                    transition={{
                      delay: 0.5 + index * 0.1,
                      duration: 1.5,
                      ease: "easeOut",
                    }}
                    className={`h-full bg-gradient-to-r ${card.color} rounded-full`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Sections détaillées */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Activités récentes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-lg border border-secondary-200 dark:border-secondary-200/20 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600 dark:bg-primary-500/5 dark:bg-primary-600 dark:bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                <div className="p-2.5 bg-accent-500 text-secondary-900 dark:bg-primary-600 dark:bg-primary-500/20 rounded-xl text-primary-500 dark:text-primary-500">
                  <Activity className="w-6 h-6" />
                </div>
                Activités récentes
              </h2>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-slate-900/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-secondary-200 dark:border-secondary-200/20">
                {recent_activities?.length || 0} activités
              </span>
            </div>

            {recent_activities?.length > 0 ? (
              <div className="space-y-4 relative z-10">
                {recent_activities.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-4 p-4 bg-white/40 dark:bg-slate-900/20 rounded-2xl hover:bg-white/70 dark:hover:bg-white/10 border border-secondary-200 dark:border-secondary-200/20 hover:border-secondary-200 dark:hover:border-secondary-200/30 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform">
                      <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                        <Clock className="w-3.5 h-3.5 text-primary-500" />
                        <span>
                          {new Date(activity.timestamp).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="font-medium text-lg">Aucune activité récente</p>
                <p className="text-sm mt-1">
                  L'historique de votre organisation apparaîtra ici
                </p>
              </div>
            )}
          </motion.div>

          {/* Top étudiants */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-lg border border-secondary-200 dark:border-secondary-200/20 overflow-hidden relative"
          >
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-accent-500/10 dark:bg-accent-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                <div className="p-2.5 bg-accent-500 text-secondary-900 dark:bg-accent-500/20 rounded-xl text-primary-500 dark:text-accent-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                Progressions
              </h2>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-slate-900/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-secondary-200 dark:border-secondary-200/20">
                Top {top_students?.length || 0}
              </span>
            </div>

            {top_students?.length > 0 ? (
              <div className="space-y-6 relative z-10">
                {top_students.map((student, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="space-y-3 p-4 bg-white/40 dark:bg-slate-900/20 rounded-2xl hover:bg-white/70 dark:hover:bg-white/10 transition-all border border-secondary-200 dark:border-secondary-200/20 hover:border-secondary-200 dark:hover:border-secondary-200/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {student.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {student.name}
                        </span>
                      </div>
                      <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-br from-green-500 to-emerald-400">
                        {student.completion}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-white/40 dark:bg-slate-900/20 rounded-full overflow-hidden border border-secondary-200 dark:border-secondary-200/20">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${student.completion}%` }}
                        transition={{
                          delay: 0.8 + index * 0.1,
                          duration: 1.5,
                          ease: "easeOut",
                        }}
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-600 rounded-full"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500 relative z-10">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="font-medium text-lg">Aucune donnée</p>
                <p className="text-sm mt-1">
                  Les progressions s'afficheront ici
                </p>
              </div>
            )}

            {/* Info sécurisée */}
            <div className="mt-8 p-3 bg-secondary-50/50 dark:bg-primary-900/10 rounded-2xl border border-secondary-200/30 dark:border-primary-800/20 relative z-10">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-primary-500" />
                Mise à jour des données en temps réel
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
