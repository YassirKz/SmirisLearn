// src/pages/student/StudentLearningPage.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Lock, PlayCircle, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';
import { untrusted, escapeText } from '../../utils/security';

export default function StudentLearningPage() {
    const { user } = useAuth();
    const { error: showError } = useToast();
    const [loading, setLoading] = useState(true);
    const [pillars, setPillars] = useState([]);
    const [hoveredVideo, setHoveredVideo] = useState(null);

    useEffect(() => {
        if (!user) return;
        fetchAccessibleContent();
    }, [user]);

    const fetchAccessibleContent = async () => {
        try {
            // 1. Récupérer les groupes de l'étudiant
            const { data: memberships, error: membersError } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', user.id);
            if (membersError) throw membersError;
            const groupIds = memberships.map(m => m.group_id);
            if (groupIds.length === 0) {
                setPillars([]);
                return;
            }

            // 2. Récupérer les piliers accessibles via ces groupes
            const { data: pillarAccess, error: accessError } = await supabase
                .from('group_pillar_access')
                .select('pillar_id')
                .in('group_id', groupIds);
            if (accessError) throw accessError;
            const pillarIds = [...new Set(pillarAccess.map(p => p.pillar_id))];
            if (pillarIds.length === 0) {
                setPillars([]);
                return;
            }

            // 3. Récupérer les piliers avec leurs vidéos
            const { data: pillarsData, error: pillarsError } = await supabase
                .from('pillars')
                .select(`
                    id,
                    name,
                    description,
                    icon,
                    color,
                    videos (
                        id,
                        title,
                        duration,
                        sequence_order,
                        thumbnail_url,
                        description
                    )
                `)
                .in('id', pillarIds)
                .order('name');

            if (pillarsError) throw pillarsError;

            // 4. Vérifier l'accès séquentiel pour chaque vidéo
            const pillarsWithAccess = await Promise.all(
                (pillarsData || []).map(async (pillar) => {
                    const videosWithAccess = await Promise.all(
                        (pillar.videos || []).map(async (video) => {
                            const { data: accessResult } = await supabase
                                .rpc('can_access_video', {
                                    p_student_id: user.id,
                                    p_video_id: video.id
                                });
                            
                            // can_access_video returns true/false, but we might want more context
                            // In a real scenario, the RPC could return { can_access: boolean, reason: string }
                            // For now, let's assume it returns boolean and we infer the reason
                            return { ...video, canAccess: accessResult || false };
                        })
                    );
                    videosWithAccess.sort((a, b) => a.sequence_order - b.sequence_order);
                    return { ...pillar, videos: videosWithAccess };
                })
            );

            setPillars(pillarsWithAccess);
        } catch (err) {
            console.error('Erreur chargement contenu:', err);
            showError('Impossible de charger vos formations');
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '--:--';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

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
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Mes formations</h1>
                    <p className="text-gray-500 mt-2">Continuez votre apprentissage et validez vos compétences.</p>
                </div>

                {pillars.length === 0 ? (
                    <div className="bg-white/70 backdrop-blur-md rounded-[2rem] p-16 text-center border border-indigo-100 shadow-xl">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BookOpen className="w-10 h-10 text-indigo-300" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Aucune formation disponible</h2>
                        <p className="text-gray-500 mt-2">Vous n'avez pas encore accès à des piliers de formation.</p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {pillars.map((pillar) => (
                            <motion.div
                                key={pillar.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-8 shadow-2xl border border-white/50 relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600/10" />
                                
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="text-4xl p-4 bg-indigo-50 rounded-2xl shadow-inner">
                                        {pillar.icon || '📚'}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900">
                                            {escapeText(untrusted(pillar.name))}
                                        </h2>
                                        <p className="text-gray-500 text-sm">
                                            {escapeText(untrusted(pillar.description))}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {pillar.videos.map((video) => (
                                        <div
                                            key={video.id}
                                            className={`relative group flex items-center justify-between p-5 rounded-3xl transition-all duration-300 border-2 ${
                                                video.canAccess 
                                                    ? 'bg-gray-50 border-transparent hover:border-indigo-200 hover:bg-white hover:shadow-xl' 
                                                    : 'bg-gray-100/50 border-transparent opacity-75'
                                            }`}
                                            onMouseEnter={() => setHoveredVideo(video.id)}
                                            onMouseLeave={() => setHoveredVideo(null)}
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${video.canAccess ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                                    {video.canAccess ? <PlayCircle className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`font-bold truncate ${video.canAccess ? 'text-gray-800' : 'text-gray-500'}`}>
                                                        {escapeText(untrusted(video.title))}
                                                    </p>
                                                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>{formatDuration(video.duration)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {video.canAccess ? (
                                                <Link
                                                    to={`/student/video/${video.id}`}
                                                    className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-sm font-bold shadow-lg hover:bg-black hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    Voir
                                                </Link>
                                            ) : (
                                                <div className="relative">
                                                    <div className="p-3 bg-gray-200 rounded-2xl text-gray-400 cursor-not-allowed">
                                                        <Lock className="w-5 h-5" />
                                                    </div>
                                                    
                                                    <AnimatePresence>
                                                        {hoveredVideo === video.id && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                className="absolute bottom-full right-0 mb-3 z-10 w-48 p-4 bg-gray-900 text-white text-xs rounded-2xl shadow-2xl"
                                                            >
                                                                <div className="flex items-start gap-2">
                                                                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                                                    <p>Terminez la vidéo précédente et réussissez le quiz pour débloquer.</p>
                                                                </div>
                                                                <div className="absolute top-full right-6 w-3 h-3 bg-gray-900 rotate-45 -translate-y-1.5" />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}