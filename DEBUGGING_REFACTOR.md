# Plan de débogage Smiris Learn - Implémentation

## ✅ Actions complétées (Phase 1)

### 1. **Logger centralisé** ✓
- **Fichier** : [src/lib/logger.js](src/lib/logger.js)
- **Fonctionnalités** :
  - `logger.debug()`, `logger.info()`, `logger.warn()`, `logger.error()`
  - Activation via `VITE_DEBUG=true` en `.env.debug`
  - Pas de logs en mode `false` (produit silencieux)
- **Bénéfice** : Logs centralisés, traçables et contrôlables

### 2. **Formateur d'erreurs unifié** ✓
- **Fichier** : [src/lib/errorFormatter.js](src/lib/errorFormatter.js)
- **Normalise** : Tous les types d'erreurs (Supabase, API, JS) en objet `{ message, code, details, original }`
- **Bénéfice** : Erreurs uniformes dans l'UI et les services

### 3. **Wrapper API Supabase** ✓
- **Fichier** : [src/lib/api/supabaseApi.js](src/lib/api/supabaseApi.js)
- **Fonctionnalités** :
  - `executeSupabase(statement, label)` : capture les erreurs, logs, durée d'exécution
  - Retourne toujours `{ data, error, duration }`
- **Bénéfice** : Centralise tous les appels DB, traçabilité complète

### 4. **Context d'erreur global** ✓
- **Fichier** : [src/contexts/ErrorContext.jsx](src/contexts/ErrorContext.jsx)
- **Export** : `useError()` avec `reportError(err, options)`, `clearError()`
- **Intégration** : Toast automatique si `options.toast !== false`
- **Bénéfice** : Erreurs affichées de manière cohérente, stockage centralisé

### 5. **ErrorBoundary global** ✓
- **Fichier** : [src/components/ui/ErrorBoundary.jsx](src/components/ui/ErrorBoundary.jsx)
- **Comportement** : Capture les crashes React, affiche fallback avec bouton "Recharger"
- **Utilisé dans** : [src/App.jsx](src/App.jsx) autour de `<Routes>`
- **Bénéfice** : Page n'est plus blanche sur erreur de rendu

### 6. **Sourcemaps en développement** ✓
- **Fichier** : [vite.config.js](vite.config.js)
- **Changement** : `sourcemap: mode === 'development' ? true : 'hidden'`
- **Bénéfice** : Stack traces lisibles en dev, sourcemaps masquées en prod

### 7. **Service de gestion d'invitations refactorisé** ✓
- **Fichier** : [src/services/invitationsService.js](src/services/invitationsService.js)
- **Fonctions** : `createMemberInvitation`, `getInvitationByToken`, `acceptMemberInvitation`
- **Intégration** : Utilise `executeSupabase` pour tous les appels DB
- **Bénéfice** : Logique métier isolée, réutilisable, testable

### 8. **Hook useMemberInvitation allégé** ✓
- **Fichier** : [src/hooks/useMemberInvitation.js](src/hooks/useMemberInvitation.js)
- **Simplifié** : Ne garde que l'état UI, appelle le service
- **Erreurs** : Retourne toujours `{ result, error }` structuré
- **Bénéfice** : Couplage réduit, tests unitaires possibles

### 9. **Client Supabase avec factory** ✓
- **Fichier** : [src/lib/supabase.js](src/lib/supabase.js)
- **Export** : `createSupabaseClient()` pour tests, et `supabase` pour utilisation
- **Bénéfice** : Mockable pour les tests unitaires

### 10. **verify-api-key amélioré** ✓
- **Fichier** : [supabase/functions/_shared/verify-api-key.ts](supabase/functions/_shared/verify-api-key.ts)
- **Améliorations** :
  - `createApiError(message, status, requestId)` : codes HTTP explicites (401, 403, 429, 503)
  - Ajout du `requestId` pour traçabilité
  - Logs structurés avec code d'erreur
- **Bénéfice** : Erreurs API claires, traçabilité cross-request

### 11. **AuthContext avec logger** ✓
- **Fichier** : [src/contexts/AuthContext.jsx](src/contexts/AuthContext.jsx)
- **Changement** : `console.error` → `logger.error`
- **Bénéfice** : Cohérence des logs globales

### 12. **ErrorProvider dans App** ✓
- **Fichier** : [src/main.jsx](src/main.jsx)
- **Ajout** : `<ErrorProvider>` enveloppe `<App />`
- **Bénéfice** : `useError()` disponible partout dans l'app

### 13. **.env.debug ajouté** ✓
- **Fichier** : [.env.debug](.env.debug)
- **Contenu** : Variables pour activer debug mode localement
- **Utilisation** : `npm run dev -- --env.file .env.debug` si besoin

### 14. **Validation du build** ✓
- **Résultat** : ✓ Build réussi en 50 secondes
- **Aucune erreur de compilation**

---

## 📋 Actions prioritaires suivantes (Phase 2)

### Priorité haute

1. **Ajouter un appel Sentry au main.jsx**
   - Dépendance : `npm install @sentry/react @sentry/tracing`
   - Code :
     ```jsx
     if (import.meta.env.VITE_SENTRY_DSN) {
       Sentry.init({
         dsn: import.meta.env.VITE_SENTRY_DSN,
         integrations: [new BrowserTracing()],
         tracesSampleRate: 0.1,
         environment: import.meta.env.MODE,
       });
     }
     ```
   - Bénéfice : Erreurs frontales remontées en production

2. **Refactoriser SuperAdminSettings.jsx**
   - Créer `src/services/superAdminSettingsService.js`
   - Extraire `fetchProfile`, `fetchPlatformConfig`, `fetchPlatformStats`, `fetchApiKeys`
   - Créer hook `useSuperAdminSettings(userId)` qui appelle le service
   - Réduction du composant de ~400 lignes à ~150 lignes
   - Bénéfice : Composant lisible, logique métier testable

3. **Activer error logging dans AdminStats.jsx**
   - Remplacer `console.error('Erreur chargement stats:', error);` par :
     ```jsx
     const { error: statsError } = useError();
     ...
     catch (err) {
       statsError('Impossible de charger les statistiques. Veuillez réessayer.', { 
         toastOptions: { duration: 5000 } 
       });
     }
     ```
   - Afficher message utilisateur au lieu d'afficher un tableau vide
   - Bénéfice : UX immédiate sur erreur

4. **Structurer les logs Deno dans les Edge Functions**
   - Créer `supabase/functions/_shared/logging.ts`
   - Fonction `logError(context, err, metadata)` avec `requestId`, `function`, `error`, `stack`
   - Appliquer à toutes les fonctions Edge (create-org-and-checkout, stripe-webhook, etc.)
   - Bénéfice : Logs backend structurés pour analyser + alertes

### Priorité moyenne

5. **Créer un intercepteur d'erreurs Supabase global**
   - Dans `src/lib/api/supabaseApi.js`
   - Mapper les erreurs RLS → message utilisateur clair
   - Ex : `PGRST116` → "Vous n'avez pas accès à ces données"
   - Bénéfice : Messages d'erreur explicites en production

6. **Ajouter `useQuery`-like hook pour les chargements**
   - Créer `src/hooks/useSupabaseQuery.js`
   - Signature : `useSupabaseQuery(supabaseCall, dependencies)`
   - Gère : loading, data, error automatiquement
   - Exemple : `useSupabaseQuery(() => supabase.from('profiles').select(...), [userId])`
   - Bénéfice : Moins de code répétitif, pattern cohérent

7. **Intégrer Logflare pour les logs Edge**
   - Configurer Supabase pour envoyer logs vers Logflare
   - Ajouter filtres et alertes sur erreurs `5xx` ou rate-limit
   - Bénéfice : Visibilité sur backend en temps réel

### Priorité faible

8. **Documentation des patterns d'erreur**
   - Créer `docs/ERROR_HANDLING.md`
   - Exemples de code : comment utiliser `executeSupabase`, `useError`, `logger`
   - Bénéfice : Onboarding + respect des patterns

9. **Tests unitaires pour les services**
   - `src/services/__tests__/invitationsService.test.js`
   - Mock Supabase avec `@testing-library/react`, `vitest`
   - Bénéfice : Confiance sur la logique métier

10. **Health check endpoint** (Edge Function)
    - Créer `supabase/functions/health-check/index.ts`
    - Répond avec status, version, DB online ?
    - Utilisé par monitoring pour déterminer la disponibilité
    - Bénéfice : Alertes automatiques si API en bas

---

## 🎯 Prochaines étapes immédiates

1. Tester localement que le dev server démarre sans erreurs
   ```bash
   npm run dev
   ```

2. Vérifier que `VITE_DEBUG=true` affiche bien les logs
   ```bash
   # Terminal :
   cp .env.debug .env.local
   npm run dev
   # Vérifier console du navigateur pour "[Smiris Learn] info|debug|warn|error"
   ```

3. Tester l'ErrorBoundary en jetant une erreur intentionnelle (en dev)
   ```jsx
   // In a lazy component temporarily
   throw new Error("Test ErrorBoundary");
   ```

4. Déployer vers staging et activer Sentry pour capturer les erreurs réelles

---

## 📊 Récapitulatif

**Fichiers créés** : 7
- logger.js, errorFormatter.js, supabaseApi.js, ErrorContext.jsx, ErrorBoundary.jsx, invitationsService.js, .env.debug

**Fichiers modifiés** : 5
- main.jsx (+ ErrorProvider)
- App.jsx (+ ErrorBoundary)
- vite.config.js (sourcemaps)
- supabase/functions/_shared/verify-api-key.ts (codes HTTP, requestId)
- AuthContext.jsx (logger au lieu de console)
- useMemberInvitation.js (refactor vers service)
- supabase.js (factory export)

**Tests de compilation** : ✓ Build réussi

**Prochaines validations** : 
- [ ] npm run dev (local)
- [ ] npm run lint (linter)
- [ ] E2E tests si existants
- [ ] Déploiement staging + Sentry

