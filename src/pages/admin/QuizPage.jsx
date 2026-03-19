import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Award, Sparkles, Shield, Plus, X } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import QuizList from '../../components/admin/quizzes/QuizList';
import QuizCreator from '../../components/admin/quizzes/QuizCreator';
import { useUserRole } from '../../hooks/useUserRole';
import { useAuth } from '../../hooks/useAuth';
import { useSearchParams, Navigate } from 'react-router-dom';
import { untrusted, escapeText } from '../../utils/security';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';

export default function QuizPage() {
    const { user } = useAuth();
    const { role, isAdminAccess, loading: roleLoading } = useUserRole();
    const [searchParams] = useSearchParams();
    const orgIdFromUrl = searchParams.get('orgId');
    const isImpersonating = role === 'super_admin' && orgIdFromUrl;
    const { t } = useTranslation('admin');
    const { success, error: showError } = useToast();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingQuiz, setEditingQuiz] = useState(null);
    const [selectedVideoId, setSelectedVideoId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefreshList = useCallback(() => {
        setRefreshKey(k => k + 1);
    }, []);

    if (!roleLoading && !isAdminAccess && !isImpersonating) {
        return <Navigate to="/unauthorized" replace />;
    }

    const handleEdit = (quiz) => {
        setEditingQuiz(quiz);
        setShowCreateModal(true);
    };

    const handleCreate = (videoId) => {
        setSelectedVideoId(videoId || null);
        setEditingQuiz(null);
        setShowCreateModal(true);
    };

    const handleDelete = async (quiz) => {
        if (!window.confirm(t('quizzes.confirm_delete', { title: quiz.video?.title }))) return;
        try {
            const { error } = await supabase
                .from('quizzes')
                .delete()
                .eq('id', quiz.id);
            if (error) throw error;
            success(t('quizzes.success.deleted'));
            handleRefreshList();
        } catch (err) {
            console.error(err);
            showError(t('quizzes.errors.delete_failed'));
        }
    };

    const handleDuplicate = async (quiz) => {
        setEditingQuiz({ ...quiz, id: undefined, video_id: '' });
        setShowCreateModal(true);
    };

    return (
        <AdminLayout>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
            >
                {/* En-tête */}
                <div className="relative">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-4 -right-4"
                    >
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-bl-2xl rounded-tr-2xl text-xs font-bold shadow-lg flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {t('quizzes.management_badge')}
                        </div>
                    </motion.div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <Award className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                                {t('quizzes.title')}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                {t('quizzes.subtitle')}
                                {isImpersonating && (
                                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full">
                                        {t('videos.read_only_mode', { org: escapeText(untrusted(orgIdFromUrl)) })}
                                    </span>
                                )}
                            </p>
                        </div>

                        {!isImpersonating && (
                            <button
                                onClick={() => handleCreate()}
                                className="mt-4 md:mt-0 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                {t('quizzes.btn_new')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Liste des quiz */}
                <QuizList
                    refreshTrigger={refreshKey}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onViewStats={(quiz) => {
                        alert(t('quizzes.stats_placeholder'));
                    }}
                />

                {/* Modal de création/édition */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold dark:text-white">
                                    {editingQuiz ? t('videos.modals.form.title_edit') : t('videos.modals.form.title_new')}
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setEditingQuiz(null);
                                        setSelectedVideoId(null);
                                    }}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    <X className="w-5 h-5 dark:text-gray-300" />
                                </button>
                            </div>
                            <QuizCreator
                                quiz={editingQuiz}
                                videoId={selectedVideoId}
                                onSuccess={() => {
                                    setShowCreateModal(false);
                                    setEditingQuiz(null);
                                    setSelectedVideoId(null);
                                    handleRefreshList();
                                }}
                                onCancel={() => {
                                    setShowCreateModal(false);
                                    setEditingQuiz(null);
                                    setSelectedVideoId(null);
                                }}
                            />
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </AdminLayout>
    );
}