// src/pages/student/StudentDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, PlayCircle, Award, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { untrusted, escapeText } from '../../utils/security';

export default function StudentDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orgName, setOrgName] = useState('');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pillarsCount: 0,
        completedVideos: 0,
        passedQuizzes: 0,
        overallProgress: 0
    });
    const [recentVideos, setRecentVideos] = useState([]);
    const [upcomingQuizzes, setUpcomingQuizzes] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;
            try {
                // 1. Fetch Organization Name
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('organization_id')
                    .eq('id', user.id)
                    .single();
                
                if (profile?.organization_id) {
                    const { data: org } = await supabase
                        .from('organizations')
                        .select('name')
                        .eq('id', profile.organization_id)
                        .single();
                    if (org) setOrgName(escapeText(untrusted(org.name)));
                }

                // 2. Fetch Accessible Pillars Count
                const { data: memberships } = await supabase
                    .from('group_members')
                    .select('group_id')
                    .eq('user_id', user.id);
                
                const groupIds = memberships?.map(m => m.group_id) || [];
                
                let pillarIds = [];
                if (groupIds.length > 0) {
                    const { data: pillarAccess } = await supabase
                        .from('group_pillar_access')
                        .select('pillar_id')
                        .in('group_id', groupIds);
                    pillarIds = [...new Set(pillarAccess?.map(p => p.pillar_id) || [])];
                }

                // 3. Fetch Progress Stats
                const { data: progress } = await supabase
                    .from('user_progress')
                    .select('*')
                    .eq('user_id', user.id);

                const completedVideos = progress?.filter(p => p.watched).length || 0;
                const passedQuizzes = progress?.filter(p => p.quiz_passed).length || 0;

                // Total videos available
                let totalVideos = 0;
                if (pillarIds.length > 0) {
                    const { count } = await supabase
                        .from('videos')
                        .select('*', { count: 'exact', head: true })
                        .in('pillar_id', pillarIds);
                    totalVideos = count || 0;
                }

                setStats({
                    pillarsCount: pillarIds.length,
                    completedVideos,
                    passedQuizzes,
                    overallProgress: totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0
                });

                /* 
                // 4. Fetch Recent Videos (watched or in progress)
                if (progress && progress.length > 0) {
                    const recentProgress = progress
                        .sort((a, b) => new Date(b.updated_at || b.completed_at) - new Date(a.updated_at || a.completed_at))
                        .slice(0, 3);
                    
                    const videoIds = recentProgress.map(p => p.video_id);
                    if (videoIds.length > 0) {
                        const { data: videosData, error: videosError } = await supabase
                            .from('videos')
                            .select('id, title, duration, thumbnail_url, pillar:pillars(name)')
                            .in('id', videoIds);
                        
                        if (videosError) console.error('Error fetching recent videos:', videosError);
                        setRecentVideos(videosData || []);
                    }
                }

                // 5. Fetch Upcoming Quizzes (video watched but quiz not passed)
                const watchedVideoIds = progress?.filter(p => p.watched && !p.quiz_passed).map(p => p.video_id) || [];
                if (watchedVideoIds.length > 0) {
                    const { data: quizzesData, error: qErr } = await supabase
                        .from('quizzes')
                        .select('id, video_id, video:videos(title)')
                        .in('id', watchedVideoIds)
                        .limit(3);
                    
                    if (qErr) console.error('Error fetching upcoming quizzes:', qErr);
                    setUpcomingQuizzes(quizzesData || []);
                }
                */

            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-200 rounded-full border-t-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto space-y-8"
            >
                {/* En‑tête */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            Bonjour, {escapeText(untrusted(user?.email?.split('@')[0] || 'étudiant'))} 👋
                        </h1>
                        {orgName && (
                            <p className="text-gray-600 mt-1">
                                Organisation : <span className="font-medium text-indigo-600">{orgName}</span>
                            </p>
                        )}
                    </div>
                    {/* Global Progress - Hidden per request */}
                    {/* 
                    <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-indigo-100 flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Progression Totale</p>
                            <p className="text-xl font-bold text-indigo-600">{stats.overallProgress}%</p>
                        </div>
                        <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-indigo-600">{stats.overallProgress}%</span>
                        </div>
                    </div>
                    */}
                </div>

                {/* Cartes de statistiques */}
                {/* Cartes d'accès rapide (Placeholders) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div
                        className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100 cursor-pointer hover:shadow-xl transition group bg-gradient-to-br from-white to-indigo-50/30"
                        onClick={() => navigate('/student/learning')}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <BookOpen className="w-8 h-8 text-indigo-600 group-hover:scale-110 transition-transform" />
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800">Mes piliers</h2>
                        <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.pillarsCount}</p>
                        <p className="text-xs text-gray-500 mt-1">Accédez à vos formations</p>
                    </div>
                    
                    <div className="bg-white/60 rounded-2xl p-6 shadow-md border border-gray-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 bg-purple-50 rounded-bl-xl text-[10px] font-black text-purple-600 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                            Bientôt
                        </div>
                        <PlayCircle className="w-8 h-8 text-purple-300 mb-3" />
                        <h2 className="text-lg font-semibold text-gray-400">Ma Progression</h2>
                        <p className="text-2xl font-bold text-purple-200 mt-1">--</p>
                        <p className="text-xs text-gray-400 mt-1 italic">Fonctionnalité à venir</p>
                    </div>

                    <div className="bg-white/60 rounded-2xl p-6 shadow-md border border-gray-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 bg-green-50 rounded-bl-xl text-[10px] font-black text-green-600 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                            Bientôt
                        </div>
                        <Award className="w-8 h-8 text-green-300 mb-3" />
                        <h2 className="text-lg font-semibold text-gray-400">Mes Badges</h2>
                        <p className="text-2xl font-bold text-green-200 mt-1">--</p>
                        <p className="text-xs text-gray-400 mt-1 italic">Certifications et succès</p>
                    </div>

                    <div className="bg-white/60 rounded-2xl p-6 shadow-md border border-gray-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 bg-amber-50 rounded-bl-xl text-[10px] font-black text-amber-600 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                            Bientôt
                        </div>
                        <Clock className="w-8 h-8 text-amber-300 mb-3" />
                        <h2 className="text-lg font-semibold text-gray-400">Agenda</h2>
                        <p className="text-2xl font-bold text-amber-200 mt-1">--</p>
                        <p className="text-xs text-gray-400 mt-1 italic">Planifiez vos sessions</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Vidéos Récentes */}
                    {/* Vidéos Récentes - Hidden per request */}
                    {/* 
                    <div className="bg-white rounded-3xl p-8 shadow-xl border border-indigo-50">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <PlayCircle className="w-6 h-6 text-indigo-600" />
                                Continuer à apprendre
                            </h3>
                            <button 
                                onClick={() => navigate('/student/learning')}
                                className="text-sm text-indigo-600 font-semibold hover:underline"
                            >
                                Tout voir
                            </button>
                        </div>
                        
                        {recentVideos.length > 0 ? (
                            <div className="space-y-4">
                                {recentVideos.map(video => (
                                    <div 
                                        key={video.id}
                                        className="flex items-center gap-4 p-3 rounded-2xl hover:bg-indigo-50 transition-colors cursor-pointer border border-transparent hover:border-indigo-100"
                                        onClick={() => navigate(`/student/video/${video.id}`)}
                                    >
                                        <div className="w-24 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                                            {video.thumbnail_url ? (
                                                <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-indigo-300">
                                                    <PlayCircle className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-800 truncate">{escapeText(untrusted(video.title))}</h4>
                                            <p className="text-xs text-gray-500">{video.pillar?.name}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-400 italic">Aucune vidéo visionnée récemment</p>
                            </div>
                        )}
                    </div>
                    */}

                    {/* Quiz à venir - Hidden per request */}
                    {/* 
                    <div className="bg-white rounded-3xl p-8 shadow-xl border border-indigo-50">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Award className="w-6 h-6 text-green-600" />
                                Quiz à passer
                            </h3>
                        </div>

                        {upcomingQuizzes.length > 0 ? (
                            <div className="space-y-4">
                                {upcomingQuizzes.map(quiz => (
                                    <div 
                                        key={quiz.id}
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                                    >
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-green-600 shadow-sm">
                                            <Award className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-800">{escapeText(untrusted(quiz.video?.title || 'Quiz'))}</h4>
                                            <p className="text-xs text-green-600">Prêt à être passé</p>
                                        </div>
                                        <button className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-green-700 transition-colors">
                                            Démarrer
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-400 italic">Tous vos quiz sont à jour ! ✨</p>
                            </div>
                        )}
                    </div>
                    */}
                </div>
            </motion.div>
        </div>
    );
}