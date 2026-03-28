# 🎓 Smiris Learn

> **The Premium Multi-tenant SaaS Platform for Corporate Training**

Smiris Learn is a next-generation Learning Management System (LMS) designed for modern businesses. It combines a **premium glassmorphism aesthetic** with powerful multi-tenant capabilities, allowing organizations to host internal videos, create interactive assessments, and manage their learning pillars with unparalleled ease.

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![React](https://img.shields.io/badge/React-18.2-61DAFB)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4)
![Supabase](https://img.shields.io/badge/Supabase-2.39-3ECF8E)
![Design](https://img.shields.io/badge/Design-Premium--Glassmorphism-purple)

---

## 💎 Design Philosophy: Modern & Premium

Smiris Learn isn't just another LMS. It's built with a **visual-first approach**:
*   **Glassmorphism Engine**: Semi-transparent containers with nested `backdrop-blur` and subtle border glows.
*   **Dynamic Motion**: Fluid transitions and micro-interactions powered by `Framer Motion`.
*   **Responsive Excellence**: A seamless experience across mobile, tablet, and desktop.
*   **Dark Mode Native**: Deeply integrated dark theme for reduced eye strain during long learning sessions.

---

## ✨ Key Features

### 👑 Super Administration
*   **Global Command Center**: Real-time overview of organization health and platform revenue.
*   **Tenant Management**: Full lifecycle control over client organizations (onboarding, suspension, plan upgrades).
*   **Dynamic Subscription Tiers**: Automated Stripe integration for Free, Starter, and Business plans.

### 🏢 Organization Portal (Admin)
*   **Customizable Pillars**: Define your own learning categories (e.g., *Product Knowledge*, *Security Compliance*, *Customer Success*).
*   **Unified Action Toolbar**: Standardized action buttons and filters for a consistent management experience.
*   **Advanced Video Library**: Rich video hosting with custom thumbnails and deep pillar integration.
*   **Interactive Quiz Builder**: Intuitive interface to create assessments with passing scores and timer controls.
*   **Member & Group Management**: Organize learners into logical groups with targeted pillar access.

### 🎓 Learner Experience (Student)
*   **Netflix-style Discovery**: Browse learning content through an immersive, card-based interface.
*   **Immersive Video Player**: Distraction-free playback with automatic progress tracking.
*   **Challenge & Growth**: Interactive quizzes at the end of modules to validate knowledge.
*   **Progress Dashboard**: Personal dashboard showing completion rates and academic achievements.

---

## 🏗️ Technical Architecture

### Multi-Tenancy Design
Smiris Learn uses a **Shared Database with Row-Level Security (RLS)**:
*   **Isolation**: Every row is pinned to an `organization_id`. Supabase RLS policies ensure strict data segregation.
*   **Scalability**: Grow from 1 to 10,000 tenants without infrastructure changes.
*   **Performance**: Optimized PostgreSQL queries ensures fast loading even with deep nested data structures.

### Tech Stack
| Tier | Technology | Rationale |
|---|---|---|
| **Frontend** | React 18 & Vite | Lightning-fast development and optimized production bundles. |
| **Styling** | Tailwind CSS | Utility-first styling for consistent design tokens. |
| **Animations** | Framer Motion | High-performance declarative animations. |
| **Backend** | Supabase | Real-time database, Auth, and binary Storage. |
| **Payments** | Stripe | Industry-standard subscription handling. |
| **Icons** | Lucide React | Minimalist and consistent iconography. |

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   NPM or Yarn
*   A Supabase project
*   A Stripe account (optional for local testing)

### Installation
1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-repo/smiris-learn.git
    cd smiris-learn
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_STRIPE_STARTER_PRICE_ID=your_stripe_price_id
    ```

4.  **Start the development server**
    ```bash
    npm run dev
    ```

---

## 🛡️ Security
*   **Data Sanitization**: All user-provided content is sanitized using custom `untrusted` and `escapeText` utilities.
*   **Auth Gates**: Secure routing using `useAuth` and `useUserRole` hooks.
*   **Database Security**: 100% policy-covered tables with strict PostgreSQL Row-Level Security.

---

## 🛣️ Roadmap
- [ ] Mobile App (React Native/Expo)
- [ ] Gamification Engine (Badges & XP)
- [ ] Peer-to-peer Learning Community
- [ ] AI-powered Learning Recommendations (Generative AI)

---

## 📜 License
Distribué sous la licence MIT. Voir `LICENSE` pour plus d'informations.

---
*Built with ❤️ by the Smiris Learn [ Yassir kezzi (100%) ] Team.*
