// src/pages/student/StudentDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  PlayCircle,
  Award,
  Clock,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Shield,
  Video,
  RefreshCw,
  Flame,
  Hourglass,
  Zap,
  Target,
  CheckCircle2,
  Star,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { untrusted, escapeText } from "../../utils/security";
import MainLayout from "../../components/layout/MainLayout";
import ProgressChart from "../../components/ui/ProgressChart";


/* ─── Carte stat ─── */
function StatCard({ icon: Icon, label, value, color, delay, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 180, damping: 20 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative bg-white dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden group cursor-default"
    >
      <div className={`absolute -right-5 -bottom-5 w-24 h-24 ${color.blob} rounded-full blur-2xl opacity-60 group-hover:opacity-90 transition-opacity`} />
      <div className={`inline-flex p-3 rounded-xl ${color.bg} mb-3 relative z-10`}>
        <Icon className={`w-5 h-5 ${color.icon}`} />
      </div>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold relative z-10">{label}</p>
      <p className="text-2xl font-black text-gray-800 dark:text-white mt-0.5 relative z-10">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 relative z-10">{sub}</p>}
    </motion.div>
  );
}

/* ─── Barre de progression pilier ─── */
function PillarBar({ name, value, watched, total, index }) {
  const colors = [
    "from-blue-500 to-cyan-400",
    "from-violet-500 to-purple-400",
    "from-emerald-500 to-teal-400",
    "from-orange-500 to-amber-400",
    "from-pink-500 to-rose-400",
    "from-indigo-500 to-blue-400",
  ];
  const bg = colors[index % colors.length];
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
      className="space-y-1.5"
    >
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[70%]">{name}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">{watched}/{total}</span>
          <span className="text-sm font-black text-gray-800 dark:text-white">{value}%</span>
        </div>
      </div>
      <div className="h-2.5 bg-gray-100 dark:bg-gray-700/60 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay: 0.15 * index, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${bg}`}
        />
      </div>
    </motion.div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orgName, setOrgName] = useState("");
  const [fullName, setFullName] = useState("");   
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pillarsCount: 0, completedVideos: 0, passedQuizzes: 0, overallProgress: 0, totalVideos: 0, totalQuizzes: 0, pendingQuizzes: 0 });
  const [recentVideos, setRecentVideos] = useState([]);
  const [upcomingQuizzes, setUpcomingQuizzes] = useState([]);
  const [progressByPillar, setProgressByPillar] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [streak, setStreak] = useState(0);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        // 1. Récupérer le profil avec full_name
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, organization_id, full_name")   // ← ajout
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          setFullName(profile.full_name || "");      // ← stocker le nom
          if (profile?.organization_id) {
            const { data: org } = await supabase.from("organizations").select("name").eq("id", profile.organization_id).maybeSingle();
            if (org) setOrgName(escapeText(untrusted(org.name)));
          }
        }

        const { data: memberships } = await supabase.from("group_members").select("group_id").eq("user_id", user.id);
        const groupIds = memberships?.map((m) => m.group_id) || [];
        let pillarIds = [];
        if (groupIds.length > 0) {
          const { data: pillarAccess } = await supabase.from("group_pillar_access").select("pillar_id").in("group_id", groupIds);
          pillarIds = [...new Set(pillarAccess?.map((p) => p.pillar_id) || [])];
        }
        let totalVideos = 0;
        let videosByPillar = [];
        let allVideos = [];
        if (pillarIds.length > 0) {
          const { data: pillarsWithVideos } = await supabase.from("pillars").select(`id, name, videos ( id, duration, sequence_order )`).in("id", pillarIds);
          const { data: videos } = await supabase.from("videos").select("id, duration, pillar_id, sequence_order").in("pillar_id", pillarIds);
          allVideos = videos || [];
          if (pillarsWithVideos) {
            videosByPillar = pillarsWithVideos.map((p) => ({ id: p.id, name: p.name, total: p.videos?.length || 0, videos: p.videos || [] }));
          }
          const { count } = await supabase.from("videos").select("*", { count: "exact", head: true }).in("pillar_id", pillarIds);
          totalVideos = count || 0;
        }
        const { data: progress } = await supabase.from("user_progress").select("*").eq("user_id", user.id);
        const progressData = progress || [];
        const watchedVideos = progressData.filter((p) => p.watched === true || p.watched === 1);
        const watchedVideoIds = watchedVideos.map((p) => p.video_id);
        const completedVideos = watchedVideoIds.length;
        const passedQuizzes = progressData.filter((p) => p.quiz_passed === true || p.quiz_passed === 1).length;
        let totalQuizzes = 0;
        if (pillarIds.length > 0) {
          const { data: allAccessibleVideos } = await supabase.from("videos").select("id").in("pillar_id", pillarIds);
          const videoIds = allAccessibleVideos?.map((v) => v.id) || [];
          if (videoIds.length > 0) {
            const { count } = await supabase.from("quizzes").select("*", { count: "exact", head: true }).in("video_id", videoIds);
            totalQuizzes = count || 0;
          }
        }
        const pendingQuizVideoIds = progressData.filter((p) => (p.watched === true || p.watched === 1) && !(p.quiz_passed === true || p.quiz_passed === 1)).map((p) => p.video_id);
        let pendingQuizzes = 0;
        if (pendingQuizVideoIds.length > 0) {
          const { count } = await supabase.from("quizzes").select("*", { count: "exact", head: true }).in("video_id", pendingQuizVideoIds);
          pendingQuizzes = count || 0;
        }
        const pillarProgress = videosByPillar.map((pillar) => {
          const pillarVideoIds = pillar.videos.map((v) => v.id);
          const watchedInPillar = watchedVideos.filter((p) => pillarVideoIds.includes(p.video_id)).length;
          return { id: pillar.id, name: pillar.name, value: pillar.total > 0 ? Math.round((watchedInPillar / pillar.total) * 100) : 0, total: pillar.total, watched: watchedInPillar };
        });
        setProgressByPillar(pillarProgress);
        if (watchedVideoIds.length > 0) {
          const recent = watchedVideos.sort((a, b) => new Date(b.completed_at || 0) - new Date(a.completed_at || 0)).slice(0, 3).map((p) => p.video_id);
          if (recent.length > 0) {
            const { data: videosData } = await supabase.from("videos").select(`id, title, duration, thumbnail_url, pillar:pillars(name)`).in("id", recent);
            setRecentVideos(videosData || []);
          }
        }
        if (pendingQuizVideoIds.length > 0) {
          const { data: quizzesData } = await supabase.from("quizzes").select(`id, video_id, video:videos(title)`).in("video_id", pendingQuizVideoIds).limit(3);
          setUpcomingQuizzes(quizzesData || []);
        }
        const recs = [];
        for (const pillar of videosByPillar) {
          const nextVideo = pillar.videos.sort((a, b) => a.sequence_order - b.sequence_order).find((v) => !watchedVideoIds.includes(v.id));
          if (nextVideo) {
            const videoInfo = allVideos.find((v) => v.id === nextVideo.id);
            recs.push({ pillarId: pillar.id, pillarName: pillar.name, videoId: nextVideo.id, title: videoInfo?.title || "Sans titre", duration: videoInfo?.duration });
          }
        }
        setRecommendations(recs);
        let totalTime = 0;
        for (const vid of watchedVideos) {
          const videoInfo = allVideos.find((v) => v.id === vid.video_id);
          if (videoInfo?.duration) totalTime += videoInfo.duration;
        }
        setTotalTimeSpent(totalTime);
        const dates = watchedVideos.map((p) => p.completed_at ? new Date(p.completed_at).toDateString() : null).filter(Boolean);
        const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));
        let currentStreak = 0;
        const today = new Date().toDateString();
        if (uniqueDates.includes(today)) {
          currentStreak = 1;
          let prev = new Date(today);
          for (let i = 1; i < uniqueDates.length; i++) {
            const d = new Date(prev); d.setDate(d.getDate() - 1);
            if (uniqueDates[i] === d.toDateString()) { currentStreak++; prev = d; } else break;
          }
        }
        setStreak(currentStreak);
        const overallProgressVal = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
        setStats({ pillarsCount: pillarIds.length, completedVideos, passedQuizzes, overallProgress: overallProgressVal, totalVideos, totalQuizzes, pendingQuizzes });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
    const channel = supabase.channel("dashboard-updates").on("postgres_changes", { event: "*", schema: "public", table: "user_progress", filter: `user_id=eq.${user?.id}` }, fetchDashboardData).subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  const formatDuration = (s) => { if (!s) return "--:--"; return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`; };
  const formatTimeSpent = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h ${m}min` : `${m} min`; };

  // ← Nouveau calcul du nom affiché
  const displayName = escapeText(
    untrusted(fullName || user?.email?.split("@")[0] || "étudiant")
  );

  /* ──────────── LOADING ──────────── */
  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full" />
          <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Chargement de votre espace...</p>
        </div>
      </MainLayout>
    );
  }

  /* ──────────── RENDER ──────────── */
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-7 px-1 sm:px-2 pb-10">

        {/* ═══════════════════════════════════════
            HERO — greeting + progress ring
        ═══════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-blue-800 p-6 sm:p-8 shadow-xl shadow-primary-500/20"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white/90 text-xs font-bold uppercase tracking-widest backdrop-blur-sm border border-white/10">
                  <Sparkles className="w-3 h-3" /> Espace Étudiant
                </span>
                {orgName && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-semibold">
                    <Shield className="w-3 h-3" />{orgName}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {getGreeting()}, {displayName}    
              </h1>
              <p className="text-white/60 text-sm mt-1">
                {stats.overallProgress === 0
                  ? "Commencez votre apprentissage dès maintenant !"
                  : `Vous avez complété ${stats.completedVideos} vidéo${stats.completedVideos > 1 ? "s" : ""} sur ${stats.totalVideos}.`}
              </p>

              {streak > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-400/20 border border-amber-300/30 text-amber-200 text-sm font-bold"
                >
                  <Flame className="w-4 h-4 text-amber-400" />
                  {streak} jour{streak > 1 ? "s" : ""} de série !
                </motion.div>
              )}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 text-white/80 hover:text-white text-sm font-semibold rounded-xl backdrop-blur-sm transition-all shrink-0"
            >
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════
            STATS CARDS — 4 colonnes
        ═══════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={BookOpen} label="Modules" value={stats.pillarsCount} sub="piliers accessibles"
            color={{ bg: "bg-blue-50 dark:bg-blue-900/30", icon: "text-blue-600 dark:text-blue-400", blob: "bg-blue-100 dark:bg-blue-900/20" }} delay={0.05} />
          <StatCard icon={Hourglass} label="Temps d'étude" value={formatTimeSpent(totalTimeSpent)} sub="temps total"
            color={{ bg: "bg-violet-50 dark:bg-violet-900/30", icon: "text-violet-600 dark:text-violet-400", blob: "bg-violet-100 dark:bg-violet-900/20" }} delay={0.1} />
          <StatCard icon={Zap} label="Quiz réussis" value={`${stats.passedQuizzes} / ${stats.totalQuizzes}`} sub={`${stats.pendingQuizzes} en attente`}
            color={{ bg: "bg-amber-50 dark:bg-amber-900/30", icon: "text-amber-600 dark:text-amber-400", blob: "bg-amber-100 dark:bg-amber-900/20" }} delay={0.15} />
          <StatCard icon={PlayCircle} label="Vidéos vues" value={`${stats.completedVideos} / ${stats.totalVideos}`} sub="vidéos terminées"
            color={{ bg: "bg-emerald-50 dark:bg-emerald-900/30", icon: "text-emerald-600 dark:text-emerald-400", blob: "bg-emerald-100 dark:bg-emerald-900/20" }} delay={0.2} />
        </div>

        {/* ═══════════════════════════════════════
            PROGRESSION PAR PILIER
        ═══════════════════════════════════════ */}
        {progressByPillar.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-white/5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-primary-500 to-blue-600 text-white rounded-xl shadow-md">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-800 dark:text-white">Progression par module</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{progressByPillar.length} module{progressByPillar.length > 1 ? "s" : ""} accessible{progressByPillar.length > 1 ? "s" : ""}</p>
                </div>
              </div>
              {progressByPillar.length > 1 && (
                <div className="hidden md:block h-24 w-48">
                  <ProgressChart data={progressByPillar} />
                </div>
              )}
            </div>
            <div className="space-y-4">
              {progressByPillar.map((pillar, i) => (
                <PillarBar key={pillar.id} {...pillar} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════
            RECOMMANDATIONS — reprendre l'apprentissage
        ═══════════════════════════════════════ */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-white/5 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-xl shadow-md">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-800 dark:text-white">Continuer l'apprentissage</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">Là où vous vous êtes arrêté</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec, i) => (
                <motion.div
                  key={rec.videoId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  onClick={() => navigate(`/student/video/${rec.videoId}`)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary-50 to-blue-50/60 dark:from-primary-900/20 dark:to-blue-900/10 border border-primary-100 dark:border-primary-800/30 cursor-pointer group transition-all hover:shadow-md hover:shadow-primary-500/10"
                >
                  <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/30 group-hover:scale-110 transition-transform shrink-0">
                    <PlayCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 dark:text-white truncate text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {escapeText(untrusted(rec.title))}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{rec.pillarName} • {formatDuration(rec.duration)}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-primary-200 dark:border-primary-700 flex items-center justify-center group-hover:bg-primary-600 group-hover:border-primary-600 transition-all shrink-0">
                    <ArrowRight className="w-3.5 h-3.5 text-primary-500 group-hover:text-white transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════
            2 COLONNES — Vidéos récentes + Quiz
        ═══════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Vidéos récentes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm flex flex-col"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  <Video className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
                <h3 className="font-black text-gray-800 dark:text-white">Vidéos récentes</h3>
              </div>
              <button
                onClick={() => navigate("/student/learning")}
                className="text-xs text-primary-600 dark:text-primary-400 font-bold hover:text-primary-700 flex items-center gap-1 group"
              >
                Tout voir <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {recentVideos.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <Video className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">Aucune vidéo vue récemment.</p>
                <button onClick={() => navigate("/student/learning")} className="mt-3 text-xs text-primary-600 dark:text-primary-400 font-bold hover:underline">Démarrer une formation →</button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentVideos.map((video, i) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    whileHover={{ x: 4 }}
                    onClick={() => navigate(`/student/video/${video.id}`)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-transparent hover:border-primary-100 dark:hover:border-primary-800/30 cursor-pointer transition-all group"
                  >
                    <div className="w-20 h-14 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0 flex items-center justify-center">
                      {video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                      ) : (
                        <PlayCircle className="w-7 h-7 text-gray-400 dark:text-gray-500 group-hover:text-primary-500 transition-colors" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 dark:text-white text-sm truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {escapeText(untrusted(video.title))}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                        {video.pillar?.name} • {formatDuration(video.duration)}
                      </p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quiz en attente */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm flex flex-col"
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-black text-gray-800 dark:text-white">Quiz en attente</h3>
                {stats.pendingQuizzes > 0 && (
                  <p className="text-xs text-amber-500 dark:text-amber-400 font-semibold">{stats.pendingQuizzes} à passer</p>
                )}
              </div>
            </div>

            {upcomingQuizzes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-3">
                  <Star className="w-7 h-7 text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Super ! Vous êtes à jour 🎉</p>
                <p className="text-xs text-emerald-500/70 dark:text-emerald-500/60 mt-1">Aucun quiz en attente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingQuizzes.map((quiz, i) => (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    whileHover={{ x: -4 }}
                    onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/15 border border-emerald-100 dark:border-emerald-800/30 hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer transition-all group"
                  >
                    <div className="w-11 h-11 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center border border-emerald-100 dark:border-emerald-800/40 shadow-sm group-hover:scale-110 transition-transform shrink-0">
                      <Award className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">
                        {escapeText(untrusted(quiz.video?.title || "Quiz"))}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Prêt à être passé
                      </p>
                    </div>
                    <button className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors shrink-0 shadow-sm">
                      Go !
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════
            FOOTER — sécurité
        ═══════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-600"
        >
          <Shield className="w-3 h-3" />
          <span>Votre progression est enregistrée et chiffrée.</span>
        </motion.div>
      </div>
    </MainLayout>
  );
}
