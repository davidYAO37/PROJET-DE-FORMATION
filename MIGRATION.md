# Guide de migration multi-tenant Easy Medical

Ce document explique comment configurer la base initiale (`bd_esaymed`) en mode multi-tenant et restaurer les utilisateurs dans cette même base.

## 1. Variables d’environnement

Ajoutez dans `.env.local` / `.env` :

```env
MONGODB_URI=mongodb://localhost:27017/bd_esaymed
JWT_SECRET=votre_cle_tres_secrete
```

## 2. Préparer la base

Tout (utilisateurs, entreprises, données métier) vit désormais dans `bd_esaymed`.
Les collections utilisées pour l’authentification sont :
- `users`
- `entreprises`
- `journalconnexions`

## 3. Initialiser / migrer

Option A – via le script de migration (recommandé) :

```powershell
$env:NODE_OPTIONS="--max-old-space-size=4096"
$env:MONGODB_URI="mongodb://localhost:27017/bd_esaymed"
$env:MONGODB_SOURCE_URI="mongodb://localhost:27017/backup_esaymed" # optionnel, si besoin de restaurer depuis une autre base
$env:ENTREPRISE_NAME="Clinique Principale"
$env:ADMIN_EMAIL="admin@demo.com"
$env:ADMIN_PASSWORD="SuperMotDePasse123"
node scripts/migrateToMultiTenant.js
```

Le script va :
1. Copier toutes les collections de `MONGODB_SOURCE_URI` vers `MONGODB_URI` (si fourni et différent).
2. Créer l’entreprise dans `bd_esaymed` si elle n’existe pas.
3. Créer un utilisateur `admin` lié à cette entreprise s’il n’existe pas.
4. Associer tous les utilisateurs existants sans `entrepriseId` à l’entreprise principale.

Option B – via `/api/register` (si vous avez déjà une entreprise existante) :

```http
POST /api/register
{
  "nom": "Administrateur",
  "prenom": "Clinique",
  "email": "admin@demo.com",
  "type": "admin",
  "uid": "admin-001",
  "password": "SuperMotDePasse123",
  "entrepriseId": "<ObjectId de l'entreprise>"
}
```

## 4. Connexion tenant

Au login, le token JWT reçoit le champ `entrepriseId`. Chaque requête API récupère ensuite la connexion MongoDB dédiée via `lib/tenantDb.ts` grâce à `withTenant`. Pour le tenant par défaut, la connexion reste sur `bd_esaymed`.

## 5. Nouvelles routes principales

- `POST   /api/login`
- `POST   /api/register`
- `POST   /api/logout`
- `GET    /api/me`
- `POST   /api/avishospit`
- `POST   /api/hospitalisations`
- `POST   /api/hospitalisations/:id/sortie`
- `GET    /api/hospitalisations/stats`
- `POST   /api/constantes`
- `POST   /api/prescriptions`
- `POST   /api/prescriptions/:id/administrer`
- `POST   /api/soins`
- `POST   /api/soins/:id/valider`
- `POST   /api/evolutions`
- `POST   /api/documents`
- `POST   /api/mouvements`
- `POST   /api/factureshospitalisation`

## 6. Vérification

```powershell
# Vérification TypeScript ciblée
node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --project tsconfig.check.json --noEmit

# Build complet
$env:NODE_OPTIONS="--max-old-space-size=8192"
node ./node_modules/next/dist/bin/next build
```

## 7. Points d’attention

- Les utilisateurs existants doivent avoir un champ `entrepriseId`.
- Les mots de passe doivent être hashés (`bcryptjs`).
- La licence / date d’expiration est stockée dans la collection `entreprises`.
- Vous pouvez toujours créer d’autres tenants en ajoutant des documents dans `entreprises` avec leur propre `mongoUri`/`dbName`.
