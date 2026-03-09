# Orch-Abtasty

Dashboard de gestion des tests AB (A/B Testing), connecté à **AB Tasty** et **Supabase**. Vue Kanban par cycle de vie, liste, timeline et recherche globale.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Scripts](#scripts)
- [Démarrage](#démarrage)
- [Structure du projet](#structure-du-projet-résumé)
- [Licence](#licence)

---

## Fonctionnalités

- **Authentification** — Inscription email/mot de passe, validation des comptes par un admin, réinitialisation de mot de passe, rôles admin/membre
- **Vue Kanban** — Colonnes par **cycle de vie** (Idée, En pause, Création, Recette, Live, Terminé) avec pagination « Voir plus » par colonne
- **Vue Liste** — Tableau des tests avec tri et filtres (type, statut ABT, groupes)
- **Vue Timeline** — Barres temporelles par test (fenêtre glissante autour d’aujourd’hui), filtre par **statut AB Tasty** et pagination « Voir plus »
- **Backlog d’idées AB Tasty** — Idées du backlog remontées dans la colonne *Idée* (via l’API `/ideas`) en plus des tests Orch-only
- **Groupes** — Système de groupes partagés : création/édition/suppression de groupes + assignation d’un test/une idée à plusieurs groupes et filtre par groupe
- **Filtres** — Recherche texte, filtres par type et par groupes, tri ; préférences sauvegardées en `localStorage`
- **Recherche globale** — Dans le header, recherche sur l’ensemble des tests (hors limite d’affichage des vues)
- **Thème** — Mode clair / sombre

---

## Stack technique

| Techno        | Usage                    |
|---------------|--------------------------|
| **Next.js 16**| App Router, React 19     |
| **TypeScript**| Typage                   |
| **Supabase**  | Données + Auth (optionnel) |
| **TanStack Query** | Données côté client   |
| **Tailwind CSS 4** | Styles + shadcn/ui  |
| **date-fns**  | Dates (timeline)         |
| **@hello-pangea/dnd** | Drag & drop Kanban  |

---

## Prérequis

- **Node.js** 18+ (recommandé 20+)
- **npm**, **yarn**, **pnpm** ou **bun**
- Projet **Supabase** (URL + clé anon ; optionnellement clé service pour le serveur)

---

## Installation

```bash
# Cloner le dépôt (ou télécharger le code)
git clone <url-du-repo>
cd Orch-Abtasty

# Installer les dépendances
npm install
```

### Variables d’environnement

Un fichier d’exemple est fourni : `.env.example`.

Copie-le vers `.env.local` et remplis les valeurs :

```bash
cp .env.example .env.local
```

#### Supabase

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

- Les clés `NEXT_PUBLIC_*` sont lues côté client (browser) et utilisent la clé **anon** avec RLS.
- `SUPABASE_SERVICE_ROLE_KEY` est utilisée uniquement côté serveur (API Next) via `src/lib/supabase-server.ts`.

#### Auth & site

```env
# URL publique du site (utilisée pour les redirections email, ex: reset password)
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # en prod : https://votre-domaine.com
```

#### AB Tasty (Public API)

```env
ABT_CLIENT_ID=...
ABT_CLIENT_SECRET=...
ABT_ACCOUNT_ID=...
ABT_AUTH_BASE_URL=https://auth.flagship.io
ABT_API_BASE_URL=https://api.abtasty.com
```

- `ABT_CLIENT_ID` / `ABT_CLIENT_SECRET` : credentials de l’API OAuth AB Tasty.
- `ABT_ACCOUNT_ID` : ID de compte utilisé dans les URLs (`/api/v1/accounts/{account_id}/...`).
- `ABT_AUTH_BASE_URL` / `ABT_API_BASE_URL` : hosts d’authentification et d’API (par défaut ceux ci‑dessus).

> Ne pas commiter `.env.local`. Seul `.env.example` doit être versionné.

---

## Scripts

| Commande              | Description                                        |
|-----------------------|----------------------------------------------------|
| `npm run dev`         | Serveur de dev (port 3000)                         |
| `npm run build`       | Build de production                                |
| `npm run start`       | Démarrer le build (après `build`)                  |
| `npm run lint`        | Linter ESLint                                      |
| `npm run create-admin`| Créer le premier administrateur (voir ci-dessous) |

---

## Authentification et premier administrateur

L'application utilise **Supabase Auth** (email + mot de passe). Toutes les pages sont protégées : un utilisateur non connecté est redirigé vers `/login`.

### Cycle de vie d'un compte
1. L'utilisateur s'inscrit sur `/signup` → compte créé avec `status = pending`.
2. Un admin approuve (ou refuse) le compte depuis la page **Settings**.
3. Une fois approuvé, l'utilisateur peut se connecter et accéder à l'application.

### Rôles
| Rôle    | Accès                                                          |
|---------|----------------------------------------------------------------|
| `admin` | Accès complet + page Settings + gestion des utilisateurs       |
| `member`| Accès à toutes les pages sauf Settings                        |

### Créer le premier administrateur

```bash
ADMIN_EMAIL=admin@exemple.com ADMIN_PASSWORD=MotDePasse123! ADMIN_NAME="John Admin" npm run create-admin
```

Ce script :
- Crée l'utilisateur dans Supabase Auth (ou utilise le compte existant).
- Insère/met à jour son profil avec `role = admin` et `status = approved`.
- À exécuter une seule fois au premier déploiement.

> **Sécurité** : ne jamais commiter des identifiants dans le code. Passer les variables via l'environnement ou via un `.env` temporaire non versionné.

### Réinitialisation de mot de passe
Un lien « Mot de passe oublié ? » est disponible sur la page de connexion. L'email de réinitialisation redirige vers `/reset-password`. Configurer `NEXT_PUBLIC_SITE_URL` dans `.env.local` pour que l'URL soit correcte en production.

---

## Démarrage

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). L’app redirige vers `/dashboard`.

---

## Structure du projet

```
src/
├── app/                    # Routes Next.js (App Router)
│   ├── dashboard/          # Page principale dashboard
│   ├── layout.tsx
│   └── page.tsx            # Redirection → /dashboard
├── components/
│   ├── layout/              # Header, thème, recherche globale
│   ├── tests/               # TestKanban, TestList, TestTimeline, TestFilters, TestCard
│   ├── groups/              # Gestion des groupes (GroupsManager, GroupAssigner)
│   └── ui/                  # Composants shadcn (Button, Card, Tabs…)
├── hooks/                   # useTests, useUpdateTestDates…
├── lib/                     # supabase, utils, status-mapping, abtasty, sync
└── types/                   # test.ts
```

---

## Fonctionnement AB Tasty / Supabase (vue d’ensemble)

- Les **campagnes AB Tasty** sont lues via l’API publique (`/api/v1/accounts/{account_id}/tests`), puis enrichies avec les métadonnées stockées dans Supabase (hypothèse, tags, assignés, groupes…).
- Les **idées AB Tasty** sont lues via `/api/v1/accounts/{account_id}/ideas` et transformées en objets `Test` de type `kind: "idea"`, affichés dans la colonne *Idée* du Kanban.
- Les **tests Orch-only** sont stockés uniquement dans la table `tests` de Supabase et ont `kind: "orch"` ; ils cohabitent avec les campagnes et les idées dans toutes les vues.
- Les mises à jour (statut, méta, dates) passent par les routes `/api/abt/campaigns/...` qui se chargent de mettre à jour **Supabase** et, si applicable, **AB Tasty**.

Les **Groupes** sont stockés dans les tables Supabase `groups` et `group_tests` et sont exposés via les routes `/api/groups` et `/api/groups/assign`. Ils servent à organiser campagnes, idées et tests Orch dans toutes les vues (Kanban, Liste, Timeline) et sont filtrables via le composant `TestFilters`.

---

## Licence

Projet privé. Voir le dépôt pour toute condition d’utilisation.
