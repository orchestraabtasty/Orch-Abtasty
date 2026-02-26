# 🧪 Orch-Abtasty — Fichier de Context IA

> Ce fichier est destiné à l'IA de l'IDE (ex: Cursor, Windsurf, Copilot...).
> Il décrit l'intégralité du projet, les décisions techniques, l'architecture attendue et les conventions à respecter.

---

## 1. Vision du projet

**Orch-Abtasty** est une webapp de suivi du cycle de vie des tests AB Tasty.
Elle permet à une équipe CRO + Product/Dev de piloter et visualiser l'état de chaque test expérimental, depuis l'idée initiale jusqu'à la clôture.

La webapp se connecte à l'**API publique AB Tasty** pour synchroniser les données de campagnes en temps réel (bidirectionnel), et enrichit ces données avec des métadonnées métier stockées dans **Supabase**.

---

## 2. Cycle de vie d'un test

Les tests passent par 5 statuts ordonnés :

```
Idée → En cours de création → En recette → Live → Terminé
```

### Règles de transition :
- **Synchronisation bidirectionnelle** entre Orch-Abtasty et AB Tasty.
- Les statuts qui peuvent être mappés à un état AB Tasty (ex: campagne active = Live, campagne stoppée/archivée = Terminé) doivent se mettre à jour **automatiquement via l'API**.
- Les statuts sans équivalent direct dans ABT (Idée, En cours de création, En recette) sont gérés **manuellement** dans l'app et stockés dans Supabase.
- **Toute modification de statut dans le dashboard doit être immédiatement répercutée vers l'API AB Tasty** (si l'état a un équivalent). Pas de décalage toléré.
- Pattern d'écriture : **Optimistic UI** (mise à jour immédiate côté front) + appel API en parallèle + **rollback automatique** si l'API retourne une erreur.

---

## 3. Stack technique

| Couche | Technologie |
|---|---|
| Framework | **Next.js 14+ (App Router)** |
| Styling | **Tailwind CSS** + **shadcn/ui** |
| Thème | Dark / Light mode (next-themes) |
| Backend / BDD | **Supabase** (PostgreSQL + Auth si besoin future) |
| Déploiement | **Vercel** (avec cron jobs pour sync en arrière-plan) |
| API externe | **AB Tasty Public API** (OAuth2 client_credentials) |
| State management | **TanStack Query (React Query)** — stale-while-revalidate |
| HTTP client | **fetch natif** ou **axios** selon préférence IA |

> ⚠️ Pas d'authentification utilisateur en V1. L'app est accessible librement.
> ⚠️ L'auth AB Tasty (ClientID / ClientSecret) est stockée côté serveur uniquement (variables d'environnement Vercel), jamais exposée au client.

---

## 4. Architecture des données

### 4.1 Données venant de l'API AB Tasty

Ces champs sont récupérés et synchronisés depuis ABT :

- `abt_campaign_id` — identifiant unique de la campagne dans ABT
- `name` — nom de la campagne
- `status` — statut ABT (à mapper vers les 5 statuts internes)
- `type` — type de test (A/B, MVT, personnalisation, patch...)
- `start_date` — date de démarrage réelle (fournie par ABT)
- `end_date` — date de fin réelle (fournie par ABT)
- `assigned_users` — si disponible via l'API ABT, remonter les utilisateurs assignés

### 4.2 Données stockées dans Supabase

Ces champs sont propres à Orch-Abtasty et ne remontent pas de l'API :

- `internal_status` — statut interne (Idée / En cours de création / En recette / Live / Terminé)
- `target_start_date` — date de démarrage souhaitée (planification interne)
- `hypothesis` — hypothèse du test
- `comment` — commentaire libre
- `tags` — tableau de tags libres (non synchronisés avec ABT)
- `assigned_to` — utilisateur(s) assigné(s) (si non récupérable via API ABT)
- `abt_campaign_id` — clé étrangère vers la campagne ABT (peut être null pour les tests en phase Idée/Création)

### 4.3 Schema Supabase suggéré

```sql
-- Table principale des tests
create table tests (
  id uuid primary key default gen_random_uuid(),
  abt_campaign_id text unique,         -- null si pas encore créé dans ABT
  internal_status text not null default 'idea',
  target_start_date date,
  hypothesis text,
  comment text,
  tags text[],
  assigned_to text[],                  -- array d'identifiants ou noms
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table des utilisateurs (si non récupérables via API ABT)
create table team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  role text,
  created_at timestamptz default now()
);
```

> Le MCP Supabase est disponible — l'IA peut créer et migrer les tables directement.

---

## 5. Stratégie de synchronisation avec AB Tasty

### Lecture (ABT → App) — stale-while-revalidate

1. Au chargement du dashboard, les données sont servies **depuis le cache** (TanStack Query) instantanément.
2. En arrière-plan, un **refetch silencieux** met à jour les données.
3. Un **bouton "Rafraîchir"** permet un refresh manuel forcé à tout moment.
4. Un **Vercel Cron Job** (toutes les 5 min en option) peut invalider le cache côté serveur pour les données critiques.

### Écriture (App → ABT) — Optimistic UI

1. L'utilisateur effectue une action (changement de statut, modification d'un champ mappé).
2. L'UI se met à jour **immédiatement** (optimistic update).
3. L'appel API AB Tasty part en parallèle.
4. **Si succès** : on confirme la mise à jour dans Supabase et dans le cache TanStack Query.
5. **Si échec** : on **rollback** l'UI vers l'état précédent et on affiche un toast d'erreur.

---

## 6. Authentification AB Tasty

L'API AB Tasty utilise **OAuth2 Client Credentials**.

### Flow d'authentification :
```
POST https://api.abtasty.com/oauth/v2/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
```

Réponse :
```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Règles :
- Le token est généré côté **serveur uniquement** (Next.js Route Handlers ou Server Actions).
- Il est mis en cache et renouvelé automatiquement avant expiration.
- Variables d'environnement requises :
  ```
  ABT_CLIENT_ID=...
  ABT_CLIENT_SECRET=...
  ABT_API_BASE_URL=https://api.abtasty.com
  NEXT_PUBLIC_SUPABASE_URL=...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  SUPABASE_SERVICE_ROLE_KEY=...
  ```

### Documentation AB Tasty :
- Doc principale : https://docs.abtasty.com/integrations/custom-integrations/ab-tasty-public-api
- Doc développeurs : https://developers.abtasty.com
- **⚠️ Certains endpoints de la doc peuvent être derrière authentification.** Si un endpoint est inconnu, utiliser les endpoints standards REST ABT pour les campagnes : `/v1/accounts/{accountId}/campaigns`, `/v1/accounts/{accountId}/campaigns/{campaignId}`, etc.
- Pas de MCP officiel AB Tasty disponible à ce jour.

---

## 7. Vues du dashboard

Le dashboard propose **4 vues switchables** :

| Vue | Description |
|---|---|
| **Kanban** | Colonnes par statut, cards draggable (avec confirmation avant envoi API) |
| **Liste** | Liste filtrée par statut, dense, avec indicateurs visuels |
| **Tableau** | Table triable/filtrable (toutes colonnes), pensée pour export futur |
| **Timeline/Roadmap** | Vue temporelle basée sur `start_date`, `end_date`, `target_start_date` |

La vue active est persistée dans `localStorage` ou un param URL.

---

## 8. Card d'un test (résumé)

Chaque card affiche :
- Nom du test
- Statut (badge coloré)
- Type (A/B, MVT, perso, patch...)
- Date de démarrage souhaitée + Date réelle début/fin
- Personnes assignées (avatars ou initiales)
- Tags (chips colorées)
- KPIs / métriques clés résumées (uplift, significativité, conversions) — données ABT
- Commentaire (tronqué)

---

## 9. Page détail d'un test

Accessible via clic sur une card. Contient :
- Toutes les infos de la card + champs complets
- Hypothèse complète
- Commentaire complet
- Bloc résultats statistiques complet (uplift par variante, taux de conversion, significativité, nb de visiteurs)
- Historique des changements de statut
- Lien direct vers la campagne dans l'interface AB Tasty

---

## 10. Design System

- **Tailwind CSS** pour tous les styles
- **shadcn/ui** pour les composants UI (Button, Card, Badge, Table, Dialog, Toast, Select, Tabs, etc.)
- **Dark / Light mode** via `next-themes` avec toggle dans le header
- Palette de couleurs des statuts :
  - Idée → `gray`
  - En cours de création → `blue`
  - En recette → `yellow/amber`
  - Live → `green`
  - Terminé → `purple`
- Design sobre, professionnel, orienté données (pas de gradients flashy)
- Responsive desktop-first (l'outil est utilisé sur desktop principalement)

---

## 11. Structure de fichiers recommandée (Next.js App Router)

```
/app
  /dashboard           → vue principale (kanban/liste/tableau/timeline)
  /tests/[id]          → page détail d'un test
  /settings            → gestion des membres d'équipe (si non récupérables via ABT)
  /api
    /abt               → proxy server-side vers l'API AB Tasty (auth + appels)
    /sync              → endpoint de sync manuelle ou webhook
    /cron              → endpoint appelé par Vercel Cron
/components
  /tests               → TestCard, TestTable, TestKanban, TestTimeline, TestDetail
  /ui                  → composants shadcn/ui + overrides
  /layout              → Header, Sidebar, ThemeToggle
/lib
  /abtasty.ts          → client API AB Tasty (token management, fetch helpers)
  /supabase.ts         → client Supabase (server + client)
  /sync.ts             → logique de synchronisation bidirectionnelle
  /status-mapping.ts   → mapping statuts ABT ↔ statuts internes
/hooks
  /useTests.ts         → TanStack Query hooks
  /useSync.ts          → hook de sync optimiste
/types
  /test.ts             → types TypeScript pour les tests
  /abtasty.ts          → types pour les réponses API ABT
```

---

## 12. Conventions de code

- **TypeScript strict** partout
- **Server Components** par défaut, `"use client"` uniquement si nécessaire
- **Server Actions** pour les mutations (écriture vers ABT + Supabase)
- Gestion d'erreur systématique avec try/catch + toast utilisateur
- Pas de secrets dans le code client (toujours dans les env vars côté serveur)
- Commits atomiques et conventionnels (feat:, fix:, chore:...)
- ESLint + Prettier configurés

---

## 13. Roadmap V1 (périmètre à implémenter)

- [x] Auth AB Tasty (OAuth2 server-side)
- [x] Fetch et affichage des campagnes ABT
- [x] Sync statuts ABT ↔ statuts internes (mapping + cron)
- [x] Vues Kanban + Liste (minimum V1)
- [x] Card avec résumé + Page détail
- [x] Champs métier dans Supabase (hypothèse, dates, tags, commentaire, assigné)
- [x] Optimistic UI sur les changements de statut
- [x] Dark/Light mode
- [x] Bouton refresh manuel

### Hors scope V1 :
- Authentification utilisateur (pas de login pour l'instant)
- Actions de pilotage sur les campagnes (pause, schedule) — V2
- Vue Timeline/Roadmap et Vue Tableau — V2 (priorité Kanban + Liste en V1)
- Export des données
- Notifications / alertes

---

## 14. MCP disponibles pour l'IA

L'IA a accès au **MCP Supabase** — elle peut donc :
- Créer et modifier les tables directement
- Gérer les migrations
- Lire le schéma actuel de la base

Pas de MCP AB Tasty disponible — les appels API doivent être implémentés manuellement via les Route Handlers Next.js.

---

*Dernière mise à jour : Février 2026 — Projet Orch-Abtasty V1*