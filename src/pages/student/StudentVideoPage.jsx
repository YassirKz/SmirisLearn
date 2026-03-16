import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Clock, Info, Lock, Award, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import StudentVideoPlayer from '../../components/student/StudentVideoPlayer';
import { untrusted, escapeText } from '../../utils/security';
import { useToast } from '../../components/ui/Toast';

export default function StudentVideoPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { error: showError } = useToast();
    const [video, setVideo] = useState(null);
    const [nextVideoId, setNextVideoId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCompleted, setIsCompleted] = useState(false);
    const [quizId, setQuizId] = useState(null);

    useEffect(() => {
        const fetchVideoAndNext = async () => {
            if (!user) return;
            try {
                // 0. Vérifier l'accès (Navigation Séquentielle Stricte)
                const { data: canAccess, error: accessError } = await supabase
                    .rpc('can_access_video', {
                        p_student_id: user.id,
                        p_video_id: id
                    });
                
                if (accessError || !canAccess) {
                    showError("Accès refusé. Terminez la vidéo précédente et son quiz.");
                    navigate('/student/learning');
                    return;
                }

                // 1. Récupérer la vidéo actuelle avec le pilier
                const { data: videoData, error: videoError } = await supabase
                    .from('videos')
                    .select('*, pillars(id, name, icon)')
                    .eq('id', id)
                    .single();

                if (videoError) throw videoError;
                setVideo(videoData);

                // 2. Vérifier si l'utilisateur a déjà terminé cette vidéo
                const { data: progress } = await supabase
                    .from('user_progress')
                    .select('watched')
                    .eq('user_id', user.id)
                    .eq('video_id', id)
                    .maybeSingle();
                
                setIsCompleted(progress?.watched || false);

                // 3. Récupérer la vidéo suivante dans le même pilier
                const { data: nextVideo, error: nextError } = await supabase
                    .from('videos')
                    .select('id')
                    .eq('pillar_id', videoData.pillar_id)
                    .gt('sequence_order', videoData.sequence_order)
                    .order('sequence_order', { ascending: true })
                    .limit(1)
                    .maybeSingle();

                if (nextError) throw nextError;
                setNextVideoId(nextVideo?.id || null);

                // 4. Récupérer le quiz associé s'il existe
                const { data: quizData } = await supabase
                    .from('quizzes')
                    .select('id')
                    .eq('video_id', id)
                    .maybeSingle();
                setQuizId(quizData?.id || null);
            } catch (err) {
                console.error('Erreur chargement vidéo:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchVideoAndNext();
    }, [id, user]);

    const formatDuration = (seconds) => {
        if (!seconds) return '--:--';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500/20 rounded-full border-t-indigo-500 animate-spin" />
            </div>
        );
    }
    
    if (!video) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white text-xl">Vidéo introuvable</div>;

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <div className="max-w-6xl mx-auto p-4 md:p-8">
                <button
                    onClick={() => navigate('/student/learning')}
                    className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>Retour vers mes formations</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Information sur le visionnage linéaire */}
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-start gap-4"
                        >
                            <Info className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-indigo-200 leading-relaxed">
                                <span className="font-bold text-indigo-300">Note :</span> Pour garantir un apprentissage progressif, le visionnage est linéaire. Vous ne pouvez pas naviguer librement entre les différentes parties de la vidéo.
                            </p>
                        </motion.div>

                        <StudentVideoPlayer
                            video={video}
                            nextVideoId={nextVideoId}
                            onComplete={() => setIsCompleted(true)}
                        />
                        
                        <div className="space-y-4">
                            <h1 className="text-2xl md:text-3xl font-bold">
                                {escapeText(untrusted(video.title))}
                            </h1>
                            <div className="flex flex-wrap items-center gap-6 text-gray-400 text-sm">
                                <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                                    <BookOpen className="w-4 h-4 text-indigo-400" />
                                    {video.pillars?.name}
                                </span>
                                <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                                    <Clock className="w-4 h-4 text-purple-400" />
                                    {formatDuration(video.duration)}
                                </span>
                            </div>
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                <h3 className="text-gray-300 font-semibold mb-2">Description</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    {escapeText(untrusted(video.description)) || "Aucune description disponible."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Sidebar can contain course progress or related videos */}
                        <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <span className="text-xl">{video.pillars?.icon || '📚'}</span>
                                {video.pillars?.name}
                            </h3>
                            <p className="text-sm text-gray-400 mb-6 font-medium">
                                Suivez l'ordre des vidéos pour une meilleure progression.
                                {!isCompleted && (
                                    <span className="block mt-2 text-indigo-400 text-xs italic">
                                        Terminez le visionnage actuel pour débloquer la suite.
                                    </span>
                                )}
                            </p>
                            
                            {isCompleted && (
                                nextVideoId || quizId ? (
                                    <button
                                        onClick={() => {
                                            if (quizId) {
                                                navigate(`/student/quiz/${quizId}`, { state: { nextVideoId } });
                                            } else {
                                                navigate(`/student/video/${nextVideoId}`);
                                            }
                                        }}
                                        className="w-full py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/30 hover:scale-[1.02] active:scale-95"
                                    >
                                        <span>Suivant</span>
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                ) : (
                                    <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-3xl text-center shadow-inner">
                                        <p className="text-green-400 font-bold text-lg">✨ Parcours terminé !</p>
                                        <button 
                                            onClick={() => navigate('/student/learning')}
                                            className="mt-4 text-sm text-green-500 hover:underline font-semibold"
                                        >
                                            Retour aux formations
                                        </button>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}