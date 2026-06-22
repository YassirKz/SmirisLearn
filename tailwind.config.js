/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ═══ Smiris Learn Custom Palette ═══
        // Built from: deep_twilight → bright_teal_blue → turquoise_surf → frosted_blue → light_cyan
        primary: {
          50:  '#e6f4fa',   // lightest tint of bright_teal_blue
          100: '#b3dff0',   // lighter
          200: '#80cae6',   // light
          300: '#4db5dc',   // medium-light
          400: '#26a5d5',   // slightly lighter than base
          500: '#0077b6',   // bright_teal_blue — Action, confiance
          600: '#006aa3',   // darker
          700: '#005a8c',   // deep
          800: '#004a75',   // deeper
          900: '#03045e',   // deep_twilight — Autorité, structure
          950: '#020340',   // darkest
        },
        secondary: {
          50:  '#caf0f8',   // light_cyan — Toile, aération
          100: '#b8ecf6',   // slightly deeper
          200: '#90e0ef',   // frosted_blue — Espace, profondeur
          300: '#6dd5e8',   // between frosted & turquoise
          400: '#33c6e0',   // approaching turquoise
          500: '#00b4d8',   // turquoise_surf — Énergie, progression
          600: '#009dbe',   // darker turquoise
          700: '#0086a3',   // deep turquoise
          800: '#006f88',   // deeper
          900: '#04364d',   // very dark teal
          950: '#022535',   // darkest
        },
        accent: {
          50:  '#e0f7fa',
          100: '#b2ebf2',
          200: '#80deea',
          300: '#4dd0e1',
          400: '#26c6da',
          500: '#00b4d8',   // turquoise_surf — for accent highlights
          600: '#00a0c2',
          700: '#008dad',
          800: '#007a97',
          900: '#005a6e',
        },
        surface: {
          50:  '#ffffff',
          100: '#f8fbfd',
          200: '#f0f7fa',
          800: '#0a1929',   // dark surface based on deep_twilight
          900: '#061224',   // darker
          950: '#03091a',   // darkest
        },
        glass: {
          light:  'rgba(202, 240, 248, 0.3)',  // light_cyan tinted
          medium: 'rgba(144, 224, 239, 0.2)',  // frosted_blue tinted
          dark:   'rgba(0, 119, 182, 0.1)',    // bright_teal_blue tinted
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
      },
      animation: {
        // Animations de base
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',
        'fade-in-left': 'fadeInLeft 0.6s ease-out',
        'fade-in-right': 'fadeInRight 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'slide-left': 'slideLeft 0.5s ease-out',
        'slide-right': 'slideRight 0.5s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'scale-out': 'scaleOut 0.4s ease-in',
        'bounce-soft': 'bounceSoft 2s infinite',
        'pulse-soft': 'pulseSoft 3s infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'gradient': 'gradient 8s ease infinite',
        'blur-in': 'blurIn 0.4s ease-out',
        'blur-out': 'blurOut 0.4s ease-in',
        'glitch': 'glitch 0.5s ease-in-out',
        'shimmer': 'shimmer 2s infinite',
        'wave': 'wave 2.5s ease-in-out infinite',
        
        // Animations pour les cartes
        'card-hover': 'cardHover 0.3s ease-out forwards',
        'card-enter': 'cardEnter 0.5s ease-out',
        
        // Animations pour les modales
        'modal-enter': 'modalEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'modal-exit': 'modalExit 0.3s ease-in',
        
        // Animations pour les boutons
        'button-pulse': 'buttonPulse 2s infinite',
        'button-shake': 'buttonShake 0.5s ease-in-out',
        
        // Animations pour les notifications
        'notification-enter': 'notificationEnter 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'notification-exit': 'notificationExit 0.3s ease-in',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.9)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        blurIn: {
          '0%': { opacity: '0', filter: 'blur(10px)' },
          '100%': { opacity: '1', filter: 'blur(0)' },
        },
        blurOut: {
          '0%': { opacity: '1', filter: 'blur(0)' },
          '100%': { opacity: '0', filter: 'blur(10px)' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '25%': { transform: 'translate(5px, -2px)' },
          '50%': { transform: 'translate(-3px, 1px)' },
          '75%': { transform: 'translate(2px, 4px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        wave: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(20deg)' },
          '75%': { transform: 'rotate(-15deg)' },
        },
        cardHover: {
          '0%': { transform: 'scale(1)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' },
          '100%': { transform: 'scale(1.05)', boxShadow: '0 20px 40px -10px rgba(0, 119, 182, 0.3)' },
        },
        cardEnter: {
          '0%': { opacity: '0', transform: 'scale(0.8) translateY(20px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        modalEnter: {
          '0%': { opacity: '0', transform: 'scale(0.7) translateY(30px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        modalExit: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.7)' },
        },
        buttonPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 119, 182, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(0, 119, 182, 0)' },
        },
        buttonShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-5px)' },
          '40%': { transform: 'translateX(5px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(3px)' },
        },
        notificationEnter: {
          '0%': { opacity: '0', transform: 'translateX(100%) scale(0.6)' },
          '100%': { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        notificationExit: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(100%)' },
        },
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
    },
  },
  plugins: [],
}