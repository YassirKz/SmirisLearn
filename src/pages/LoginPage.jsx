import { useMemo } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import LoginForm from "../components/auth/LoginForm";

// Generate particles outside component to avoid impure function during render
const generateParticles = () => {
  return [...Array(15)].map((_, i) => ({
    id: i,
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    color: i % 3 === 0 ? "#0077b6" : i % 3 === 1 ? "#00b4d8" : "#90e0ef",
    duration: Math.random() * 10 + 8,
    offsetX: Math.random() * 80 - 40,
  }));
};

export default function LoginPage() {
  // Memoize particles to calculate only once on mount
  const particles = useMemo(() => generateParticles(), []);

  return (
    <div className="dark">
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary-100 via-white to-secondary-100 dark:from-slate-950 dark:via-gray-900 dark:to-slate-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Particules animées */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: particle.color,
              opacity: 0.1,
            }}
            initial={{
              x: particle.x,
              y: particle.y,
            }}
            animate={{
              y: [null, -80, null],
              x: [null, particle.offsetX, null],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Éléments flous */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-200 dark:bg-primary-900/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-30 dark:opacity-20 animate-float" />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-300 dark:bg-primary-600 dark:bg-primary-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-30 dark:opacity-20 animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Formulaire */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="relative w-full max-w-md z-10"
      >
        <LoginForm />
      </motion.div>
    </div>
    </div>
  );
}
