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

- **Vue Kanban** — Colonnes par statut (Idée, Création, En pause, Recette, Live, Terminé) avec pagination « Voir plus » par colonne
- **Vue Liste** — Tableau des tests avec tri et filtres
- **Vue Timeline** — Barres temporelles par test, filtre par statut AB Tasty, pagination « Voir plus »
- **Filtres** — Recherche, types de test, tri ; préférences sauvegardées en `localStorage`
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

Créer un fichier `.env.local` à la racine :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Pour les appels API côté serveur (si utilisés) :

```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

> Ne pas commiter `.env.local`. Tu peux ajouter un `.env.example` avec les noms de variables sans valeurs.

---

## Scripts

| Commande        | Description              |
|-----------------|--------------------------|
| `npm run dev`   | Serveur de dev (port 3000) |
| `npm run build` | Build de production     |
| `npm run start` | Démarrer le build (après `build`) |
| `npm run lint`  | Linter ESLint           |

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
│   ├── layout/              # Header, thème, etc.
│   ├── tests/               # TestKanban, TestList, TestTimeline, TestFilters, TestCard
│   └── ui/                  # Composants shadcn (Button, Card, Tabs…)
├── hooks/                   # useTests, useUpdateTestDates…
├── lib/                     # supabase, utils, status-mapping
└── types/                   # test.ts
```

---

## Licence

Projet privé. Voir le dépôt pour toute condition d’utilisation.
