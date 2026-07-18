import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, Settings, LogOut,
  Sparkles, BookOpen, Sun, Moon, TrendingUp, Flame,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useUserRole } from "../../hooks/useUserRole";
import { useTheme } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import Logo from "../ui/Logo";

/* ── Mini progress ring pour la sidebar ── */
function MiniRing({ value, size = 36, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size/2} cy={size/2} r={r} strokeWidth={stroke} stroke="currentColor" fill="none" className="text-white/10" />
      <circle cx={size/2} cy={size/2} r={r} strokeWidth={stroke} stroke="white" fill="none" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-1000" />
    </svg>
  );
}

export default function Sidebar({ onClose }) {
  const { user, signOut } = useAuth();
  const { role } = useUserRole();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // For student: fetch progress stats
  const [studentStats, setStudentStats] = useState({ progress: 0, streak: 0 });

  useEffect(() => {
    if (role !== "student" || !user) return;
    const fetchStats = async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile?.organization_id) return;
        const { data: memberships } = await supabase.from("group_members").select("group_id").eq("user_id", user.id);
        const groupIds = (memberships || []).map(m => m.group_id);
        if (!groupIds.length) return;
        const { data: pillarAccess } = await supabase.from("group_pillar_access").select("pillar_id").in("group_id", groupIds);
        const pillarIds = [...new Set((pillarAccess || []).map(p => p.pillar_id))];
        if (!pillarIds.length) return;
        const { count: totalVideos } = await supabase.from("videos").select("*", { count: "exact", head: true }).in("pillar_id", pillarIds);
        const { data: progress } = await supabase.from("user_progress").select("video_id, watched, completed_at").eq("user_id", user.id);
        const watched = (progress || []).filter(p => p.watched);
        const pct = totalVideos > 0 ? Math.round((watched.length / totalVideos) * 100) : 0;
        // Streak
        const dates = watched.map(p => p.completed_at ? new Date(p.completed_at).toDateString() : null).filter(Boolean);
        const unique = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));
        let streak = 0;
        const today = new Date().toDateString();
        if (unique.includes(today)) {
          streak = 1;
          let prev = new Date(today);
          for (let i = 1; i < unique.length; i++) {
            const d = new Date(prev); d.setDate(d.getDate() - 1);
            if (unique[i] === d.toDateString()) { streak++; prev = d; } else break;
          }
        }
        setStudentStats({ progress: pct, streak });
      } catch {}
    };
    fetchStats();
  }, [user, role]);

  const getMenuItems = () => {
    if (role === "super_admin") return [
      { path: "/super-admin", icon: LayoutDashboard, label: "Tableau de bord" },
      { path: "/super-admin/companies", icon: Building2, label: "Organisations" },
      { path: "/super-admin/users", icon: Users, label: "Utilisateurs" },
      { path: "/super-admin/settings", icon: Settings, label: "Paramètres" },
    ];
    if (role === "org_admin") return [
      { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/admin/pillars", icon: Building2, label: "Piliers" },
      { path: "/admin/members", icon: Users, label: "Membres" },
      { path: "/admin/groups", icon: Users, label: "Groupes" },
      { path: "/admin/settings", icon: Settings, label: "Paramètres" },
    ];
    return [
      { path: "/student", icon: LayoutDashboard, label: "Tableau de bord", end: true },
      { path: "/student/learning", icon: BookOpen, label: "Formations" },
    ];
  };

  const menuItems = getMenuItems();
  const isStudent = role === "student";
  const roleLabel = role === "super_admin" ? "Super Admin" : role === "org_admin" ? "Administration" : "Espace Étudiant";

  return (
    <motion.aside
      className="h-full w-64 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-r border-white/50 dark:border-white/5 shadow-[0_0_60px_-15px_rgba(14,165,233,0.15)] flex flex-col relative overflow-hidden"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
    >
      {/* Decorative orbs */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary-400/20 dark:bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-accent-400/15 dark:bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── Logo ── */}
      <div className="p-5 border-b border-white/30 dark:border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <Logo size="md" withText={false} />
          <div>
            <h2 className="font-bold text-gray-800 dark:text-gray-100 tracking-tight leading-none">Smiris Learn</h2>
            <p className="text-[11px] text-primary-600 dark:text-primary-400 font-medium tracking-wide uppercase mt-0.5">{roleLabel}</p>
          </div>
        </div>

        {/* Student progress card inside sidebar */}
        {isStudent && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 bg-gradient-to-br from-primary-600 to-blue-700 rounded-2xl p-3 flex items-center gap-3"
          >
            <div className="relative">
              <MiniRing value={studentStats.progress} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-black text-white">{studentStats.progress}%</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-xs leading-none">Progression</p>
              <p className="text-white/60 text-[10px] mt-0.5">globale</p>
            </div>
            {studentStats.streak > 0 && (
              <div className="flex items-center gap-1 bg-white/10 rounded-xl px-2 py-1">
                <Flame className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-black text-white">{studentStats.streak}j</span>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 p-3 space-y-1 relative z-10 overflow-y-auto">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.07, type: "spring", stiffness: 200, damping: 22 }}
          >
            <NavLink
              to={item.path}
              end={item.end || item.path === "/super-admin" || item.path === "/admin"}
              onClick={() => window.innerWidth < 1024 && onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group relative overflow-hidden ${
                  isActive
                    ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md shadow-primary-500/25"
                    : "text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/5 hover:text-primary-600 dark:hover:text-primary-300"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute inset-0 bg-white/10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />}
                  <div className={`p-1.5 rounded-xl transition-colors ${isActive ? "bg-white/20" : "bg-transparent group-hover:bg-primary-100/50 dark:group-hover:bg-primary-900/30"}`}>
                    <item.icon size={17} />
                  </div>
                  <span className="font-semibold text-[13.5px] flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                  {!isActive && item.label === "Formations" && isStudent && (
                    <TrendingUp className="w-3.5 h-3.5 opacity-30" />
                  )}
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* ── User info ── */}
      {user && (
        <div className="px-4 py-3 border-t border-white/20 dark:border-white/5 relative z-10">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{user.email?.split("@")[0]}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom actions ── */}
      <div className="p-3 border-t border-white/20 dark:border-white/5 space-y-1 relative z-10">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 transition-all group"
        >
          <div className="p-1.5 rounded-xl bg-transparent group-hover:bg-amber-100/50 dark:group-hover:bg-amber-900/30 transition-colors">
            {theme === "light" ? <Moon className="w-[17px] h-[17px]" /> : <Sun className="w-[17px] h-[17px]" />}
          </div>
          <span className="font-medium text-[13.5px]">Mode {theme === "light" ? "sombre" : "clair"}</span>
        </button>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-2xl text-red-500 dark:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-900/20 transition-all group"
        >
          <div className="p-1.5 rounded-xl bg-transparent group-hover:bg-red-100/50 dark:group-hover:bg-red-900/30 transition-colors">
            <LogOut size={17} />
          </div>
          <span className="font-medium text-[13.5px]">Déconnexion</span>
        </motion.button>
      </div>
    </motion.aside>
  );
}
