// src/pages/student/StudentLearningPage.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Lock, PlayCircle, Clock, Sparkles, Shield,
  ArrowLeft, ChevronDown, CheckCircle2, LayoutGrid, List,
  Search, X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';
import { untrusted, escapeText } from '../../utils/security';
import MainLayout from '../../components/layout/MainLayout';

const PILLAR_COLORS = [
  { from: 'from-blue-500', to: 'to-cyan-500', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', badge: 'bg-blue-100 text-blue-700' },
  { from: 'from-violet-500', to: 'to-purple-500', light: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', badge: 'bg-violet-100 text-violet-700' },
  { from: 'from-emerald-500', to: 'to-teal-500', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', badge: 'bg-emerald-100 text-emerald-700' },
  { from: 'from-orange-500', to: 'to-amber-500', light: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', badge: 'bg-orange-100 text-orange-700' },
  { from: 'from-pink-500', to: 'to-rose-500', light: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100', badge: 'bg-pink-100 text-pink-700' },
  { from: 'from-indigo-500', to: 'to-blue-500', light: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', badge: 'bg-indigo-100 text-indigo-700' },
];

function VideoCard({ video, formatDuration, colorScheme }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      whileHover={video.canAccess ? { y: -4, scale: 1.01 } : {}}
      className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 ${
        video.canAccess
          ? 'bg-white dark:bg-gray-800/80 border-gray-100 dark:border-white/5 shadow-sm hover:shadow-lg hover:shadow-primary-500/10 cursor-pointer'
          : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200/60 dark:border-white/5 opacity-70'
      }`}
      onMouseEnter={() => !video.canAccess && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Thumbnail / top bar */}
      <div className={`h-2 w-full bg-gradient-to-r ${colorScheme.from} ${colorScheme.to}`} />

      <div className="p-4 flex-1 flex flex-col">
        {/* Icon + title */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            video.canAccess
              ? `${colorScheme.light} dark:bg-gray-700 ${colorScheme.text}`
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
          }`}>
            {video.canAccess
              ? <PlayCircle className="w-5 h-5" />
              : <Lock className="w-5 h-5" />}
          </div>
          <p className={`font-semibold text-sm leading-snug line-clamp-2 ${
            video.canAccess ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-500'
          }`}>
            {escapeText(untrusted(video.title))}
          </p>
        </div>

        {/* Duration badge */}
        <div className="flex items-center gap-1.5 mt-auto">
          <Clock className={`w-3.5 h-3.5 ${video.canAccess ? colorScheme.text : 'text-gray-400'}`} />
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {formatDuration(video.duration)}
          </span>
        </div>
      </div>

      {/* Action button */}
      <div className="px-4 pb-4">
        {video.canAccess ? (
          <Link
            to={`/student/video/${video.id}`}
            className={`flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${colorScheme.from} ${colorScheme.to} shadow-md hover:shadow-lg transition-all hover:opacity-95`}
          >
            <PlayCircle className="w-4 h-4 mr-1.5" />
            Lancer
          </Link>
        ) : (
          <div className="relative">
            <div className="flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700">
              <Lock className="w-4 h-4 mr-1.5" /> Verrouillé
            </div>
            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 w-52 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-xl shadow-2xl text-center"
                >
                  Terminez la vidéo précédente pour déverrouiller.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 dark:bg-gray-700 rotate-45 -translate-y-1.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function PillarSection({ pillar, index, formatDuration, viewMode }) {
  const [collapsed, setCollapsed] = useState(false);
  const color = PILLAR_COLORS[index % PILLAR_COLORS.length];
  const completed = pillar.videos.filter(v => v.watched).length;
  const total = pillar.videos.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 160, damping: 20 }}
      className="bg-white dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden"
    >
      {/* Pillar header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-4 p-5 sm:p-6 text-left hover:bg-gray-50 dark:hover:bg-white/3 transition-colors"
      >
        {/* Color dot / icon */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br ${color.from} ${color.to} shadow-md shrink-0`}>
          {pillar.icon || '📚'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="font-black text-gray-800 dark:text-white text-base sm:text-lg truncate">
              {escapeText(untrusted(pillar.name))}
            </h2>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${color.badge} dark:bg-opacity-20`}>
              {total} vidéo{total > 1 ? 's' : ''}
            </span>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden max-w-xs">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={`h-full rounded-full bg-gradient-to-r ${color.from} ${color.to}`}
              />
            </div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">
              {completed}/{total} — {pct}%
            </span>
          </div>
        </div>

        <motion.div animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      {/* Videos grid */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {pillar.description && (
              <p className="px-6 pb-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-b border-gray-100 dark:border-white/5">
                {escapeText(untrusted(pillar.description))}
              </p>
            )}
            <div className={`p-5 sm:p-6 ${viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-3'}`}
            >
              {viewMode === 'list'
                ? pillar.videos.map((video, vi) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: vi * 0.04 }}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                      video.canAccess
                        ? `bg-gray-50 dark:bg-gray-700/30 ${color.border} dark:border-white/5 hover:border-primary-200 dark:hover:border-primary-700/40 cursor-pointer hover:shadow-sm`
                        : 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-100 dark:border-white/5 opacity-60 cursor-not-allowed'
                    }`}
                    onClick={() => video.canAccess && (window.location.href = `/student/video/${video.id}`)}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      video.canAccess ? `${color.light} ${color.text}` : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                    }`}>
                      {video.canAccess ? <PlayCircle className="w-4.5 h-4.5" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${video.canAccess ? 'text-gray-800 dark:text-white' : 'text-gray-400'}`}>
                        {escapeText(untrusted(video.title))}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />{formatDuration(video.duration)}
                      </p>
                    </div>
                    {video.watched && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                    {video.canAccess && !video.watched && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color.badge}`}>Nouveau</span>
                    )}
                  </motion.div>
                ))
                : pillar.videos.map((video) => (
                  <VideoCard key={video.id} video={video} formatDuration={formatDuration} colorScheme={color} />
                ))
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function StudentLearningPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [pillars, setPillars] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchAccessibleContent();
  }, [user]);

  const fetchAccessibleContent = async () => {
    try {
      const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', user.id);
      const groupIds = (memberships || []).map(m => m.group_id);
      if (groupIds.length === 0) { setPillars([]); return; }

      const { data: pillarAccess } = await supabase.from('group_pillar_access').select('pillar_id').in('group_id', groupIds);
      const pillarIds = [...new Set((pillarAccess || []).map(p => p.pillar_id))];
      if (pillarIds.length === 0) { setPillars([]); return; }

      const { data: pillarsData } = await supabase
        .from('pillars')
        .select(`id, name, description, icon, color, videos ( id, title, duration, sequence_order, thumbnail_url, description )`)
        .in('id', pillarIds)
        .order('name');

      // Get user progress
      const { data: progress } = await supabase.from('user_progress').select('video_id, watched').eq('user_id', user.id);
      const watchedIds = new Set((progress || []).filter(p => p.watched).map(p => p.video_id));

      const pillarsWithAccess = await Promise.all(
        (pillarsData || []).map(async (pillar) => {
          const videosWithAccess = await Promise.all(
            (pillar.videos || []).map(async (video) => {
              const { data: canAccess } = await supabase.rpc('can_access_video', { p_student_id: user.id, p_video_id: video.id });
              return { ...video, canAccess: canAccess || false, watched: watchedIds.has(video.id) };
            })
          );
          videosWithAccess.sort((a, b) => a.sequence_order - b.sequence_order);
          return { ...pillar, videos: videosWithAccess };
        })
      );
      setPillars(pillarsWithAccess);
    } catch (err) {
      console.error('Erreur chargement contenu:', err);
      showError("Erreur lors du chargement des modules.");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (s) => { if (!s) return '--:--'; return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`; };

  // Filter pillars + videos by search
  const filteredPillars = search.trim()
    ? pillars.map(p => ({
        ...p,
        videos: p.videos.filter(v => v.title.toLowerCase().includes(search.toLowerCase()))
      })).filter(p => p.videos.length > 0 || p.name.toLowerCase().includes(search.toLowerCase()))
    : pillars;

  /* ──── LOADING ──── */
  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full" />
          <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Chargement des modules...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-10">

        {/* ── Back button ── */}
        <motion.button
          onClick={() => navigate('/student')}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Tableau de bord
        </motion.button>

        {/* ── Hero header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-blue-800 p-6 sm:p-8 overflow-hidden shadow-xl shadow-primary-500/20"
        >
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white/90 text-xs font-bold uppercase tracking-widest mb-3 border border-white/10">
                <Sparkles className="w-3 h-3" /> Parcours de formation
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Mes modules d'apprentissage</h1>
              <p className="text-white/60 text-sm mt-1 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" /> Suivez les vidéos dans l'ordre pour débloquer les suivantes.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shrink-0">
              <BookOpen className="w-6 h-6 text-white/70" />
              <div>
                <p className="text-white font-black text-lg leading-none">{pillars.length}</p>
                <p className="text-white/60 text-xs">module{pillars.length > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Toolbar: search + view toggle ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
        >
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une vidéo..."
              className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Grille
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              <List className="w-3.5 h-3.5" /> Liste
            </button>
          </div>
        </motion.div>

        {/* ── Content ── */}
        {filteredPillars.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white dark:bg-gray-800/70 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm"
          >
            <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="font-semibold text-gray-500 dark:text-gray-400">
              {search ? 'Aucune vidéo trouvée pour votre recherche.' : "Vous n'avez pas encore accès à des modules."}
            </p>
            {search && <button onClick={() => setSearch('')} className="mt-3 text-sm text-primary-600 dark:text-primary-400 font-bold hover:underline">Effacer la recherche</button>}
          </motion.div>
        ) : (
          <div className="space-y-5">
            {filteredPillars.map((pillar, index) => (
              <PillarSection key={pillar.id} pillar={pillar} index={index} formatDuration={formatDuration} viewMode={viewMode} />
            ))}
          </div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-600"
        >
          <Shield className="w-3 h-3" />
          <span>Contenu protégé • Lecture linéaire obligatoire</span>
        </motion.div>
      </div>
    </MainLayout>
  );
}