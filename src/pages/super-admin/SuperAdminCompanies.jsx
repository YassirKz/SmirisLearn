import { motion } from 'framer-motion';
import { Building2, Sparkles, Shield } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import CompaniesTable from '../../components/super-admin/CompaniesTable';

export default function SuperAdminCompanies() {
    return (
        <MainLayout>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
            >
                {/* En-tête premium glassmorphism */}
                <div className="relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-white/50 dark:border-white/5 overflow-hidden">
                    {/* Background Glows */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 dark:bg-primary-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-500/10 dark:bg-accent-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                                    className="p-3 bg-gradient-to-br from-primary-500 to-accent-600 rounded-2xl shadow-lg shadow-primary-500/30"
                                >
                                    <Building2 className="w-8 h-8 text-white" />
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="px-4 py-1.5 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800/50 rounded-full text-sm font-bold text-primary-700 dark:text-primary-300 shadow-sm flex items-center gap-2 w-fit"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Gestion des Entreprises
                                </motion.div>
                            </div>
                            
                            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 tracking-tight mb-4">
                                Organisations
                            </h1>
                            
                            <p className="text-lg text-gray-500 dark:text-gray-400 font-medium max-w-2xl flex flex-wrap items-center gap-2">
                                <Shield className="w-5 h-5 text-gray-400" />
                                Gérez toutes les entreprises clientes de la plateforme
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tableau des entreprises */}
                <CompaniesTable />

                {/* Note de bas de page */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center py-4"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm rounded-full border border-gray-200 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500">
                        <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                        <span>Propulsé par Smiris Learn Admin Engine</span>
                    </div>
                </motion.div>
            </motion.div>
        </MainLayout>
    );
}