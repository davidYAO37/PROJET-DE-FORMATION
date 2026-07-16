# Fiche Technique — Easy Medical

## 1. Vue d'ensemble

**Nom du projet** : Easy Medical  
**Type d'application** : Application web de gestion médicale multi-services  
**Version** : 0.1.0  
**Architecture** : Monolithique full-stack avec front-end React / Next.js et API Routes internes  
**Langage principal** : TypeScript  
**Base de données** : MongoDB via Mongoose  
**Moteur de rendu** : Next.js App Router (`app/`) + pages historiques (`app/pages/`)  
**Style UI** : Bootstrap 5 + React-Bootstrap + CSS modules personnalisés

---

## 2. Stack technique

### 2.1 Framework & runtime

| Composant          | Technologie         | Version / Détails                  |
|--------------------|---------------------|-------------------------------------|
| Framework web      | Next.js             | 16.2.6 (App Router + API Routes)   |
| Runtime React        | React / React DOM   | 19.2.6                              |
| Langage              | TypeScript          | 5.x                                 |
| Bundler / build      | Webpack (via Next)  | 5.101.0 (dev dependency)            |
| CSS / UI             | Bootstrap, React-Bootstrap, Bootstrap-Icons, Lucide-React, React-Icons, Animate.css | 5.3.7, 2.10.10, 1.13.1, 0.526.0, 5.5.0, 4.1.1 |

### 2.2 Base de données & persistance

| Composant          | Technologie | Rôle                                      |
|--------------------|-------------|-------------------------------------------|
| Base de données    | MongoDB     | Stockage principal NoSQL documentaire       |
| ODM                | Mongoose    | Modélisation, schémas et requêtes          |
| Driver natif       | mongodb     | Accès natif aux collections si nécessaire    |

### 2.3 Authentification & sécurité

| Composant          | Technologie | Usage                                         |
|--------------------|-------------|-----------------------------------------------|
| Hachage mots de passe | bcryptjs   | Hachage sécurisé (12 rounds)                  |
| Tokens JWT         | jsonwebtoken / @types/jsonwebtoken | Authentification par token |
| Anti-bruteforce    | Custom      | Verrouillage après échecs de connexion        |

### 2.4 Impression, PDF & bureautique

| Composant          | Technologie | Usage                                         |
|--------------------|-------------|-----------------------------------------------|
| Génération PDF     | pdfkit, pdfmake, puppeteer | Comptes-rendus, factures, reçus, arrêts de travail |
| Impression front    | react-to-print | Impression directe depuis le navigateur     |
| Codes-barres       | react-barcode | Génération de codes-barres patients / actes   |
| Export tableur     | xlsx          | Export Excel des données (stocks, factures, etc.) |
| Nombre en lettres  | @mandarvl/convertir-nombre-lettre | Montants en lettres sur documents officiels |

### 2.5 Graphiques & visualisation

| Composant | Technologie | Usage |
|-----------|-------------|-------|
| Graphiques | recharts | Tableaux de bord statistiques (consultations, actes, sexe, etc.) |

### 2.6 Date & temps

| Composant | Technologie | Usage |
|-----------|-------------|-------|
| Manipulation dates | dayjs | Parsing, formatage et calculs de dates |

### 2.7 Communication

| Composant | Technologie | Usage |
|-----------|-------------|-------|
| Requêtes HTTP client | axios | Appels API front → back |
| Envoi d'e-mails | nodemailer | Notifications (contexte possible) |

---

## 3. Architecture générale

```
Easy Medical
├── app/
│   ├── api/          → API Routes Next.js (CRUD, métier, auth)
│   ├── dashboard/    → Interfaces de tableau de bord / admin
│   ├── pages/        → Interfaces métiers par service (App Router)
│   ├── layout.tsx    → Layout racine
│   └── connexion/    → Page de connexion
├── components/       → Composants React réutilisables
│   ├── statistiques/ → Widgets de stats
│   └── Sidebar*.tsx  → Sidebars métier par service
├── db/               → Connexion MongoDB
├── hooks/            → Hooks React personnalisés
├── lib/              → Logique métier spécifique (pdf, arrêt travail)
├── models/           → Schémas Mongoose (~63 modèles)
├── public/           → Assets statiques (images, JS bootstrap, uploads)
├── scripts/          → Scripts utilitaires (création super-admin, fix, etc.)
├── services/         → Services front (facturation, stats)
├── types/            → Types TypeScript partagés
└── utils/            → Utilitaires (auth, calculs actes, impressions)
```

---

## 4. Modèle de données

L'application repose sur une base de données MongoDB avec environ **63 collections / schémas** organisés autour des domaines suivants :

### 4.1 Cœur métier

- **Entreprise** : configuration de l'établissement (nom, entête, pied de page, logo, NCC)
- **User / Utilisateur** : comptes utilisateurs avec rôles, UID, verrouillage
- **Patient** : dossier patient, antécédents, assurance/société, provisions, contacts
- **Medecin / Infirmier** : personnels médicaux et paramédicaux

### 4.2 Parcours de soins

- **Consultation** : consultations médicales
- **ExamenHospit / ExamenHospitalisation** : examens en hospitalisation
- **RendezVous / PlanningMed** : prise de rendez-vous et planning des médecins
- **Prescription / PatientPrescription** : ordonnances et prescriptions
- **ObservationHospit / AvisHospit** : suivi hospitalier
- **CompteRenduOperatoire / RapportHospitalisation** : documents cliniques
- **ArretTravail** : arrêts de travail

### 4.3 Facturation & caisse

- **Facturation / LigneFacture / FactureAssur / FactureRecap**
- **EncaissementCaisse / EncaissementCaisseAnnule** : mouvements de caisse et annulations
- **ModeDePaiement** : modes de règlement
- **PaiementPartenaire** : reversements partenaires / assureurs
- **HonoraireMed / HonorairePaye / LigneHonoraireMed** : gestion des honoraires

### 4.4 Actes & tarification

- **ActeParametre / ActeParamLabo / ActeParamBiochimie**
- **ActeSocietePartenaire / ActeClinique / TypeActe / FamilleActe**
- **Affection / Operation / ParamLabo / ParamBiochimie**
- **TarifAssurance / Tarifs** : tarification conventionnée

### 4.5 Pharmacie & stock

- **Pharmacie / Approvisionnement / CommandeFournisseur / Fournisseur**
- **Stock / EntreeStock / SortieStock / Inventaire / HistoriqueInventaire / LigneInventaire**
- **MouvementsStock / GestionStock**

### 4.6 Biologie / laboratoire

- **LignePrestation / ResultatLignePrestation**
- **ParametreNfs / NfsTraitement / BiochimieTraitement / HormoneTraitement / VitesseTraitement**
- **ParametreCRendu / LienAutomate** : paramètres de comptes-rendus et automates

### 4.7 Assurances & partenaires

- **Assurance / SocieteAssurance / SocietePartenaire**
- **DocumentPatient / DocumentFichePatient** : pièces jointes et documents patient

---

## 5. Modules fonctionnels

L'application est organisée par **services / rôles** accessibles via des interfaces dédiées dans `app/pages/` :

| Service | Chemin | Fonctions principales |
|---------|--------|---------------------|
| Accueil | `serviceaccueil/` | Enregistrement patient, dossiers, orientation |
| Médecin | `servicemedecin/` | Consultations, prescriptions, examens, ordonnances |
| Infirmier | `serviceinfirmier/` | Soins, constantes, observations |
| Caisse | `servicecaisse/` | Encaissements, comptes patients, reçus, point de caisse |
| Facturation | `servicefacturation/` | Factures, règlements, relances |
| Comptabilité | `servicecomptabilite/` | Statistiques, journaux, états financiers |
| Laboratoire | `servicelaboratoire/` | Saisie et validation de résultats biologiques |
| Biologiste | `servicebiologiste/` | Validation médicale des résultats |
| Pharmacie | `servicepharmacie/`, `PharmacieAccueil/` | Dispensation, stocks, commandes |
| Radio | `serviceradio/` | Comptes-rendus radio, demandes d'imagerie |
| Paramétrage | `parametrageoperation/`, `dashboard/parametres/` | Configuration des actes, tarifs, utilisateurs, entreprise |

---

## 6. Authentification & autorisation

- **Mécanisme** : authentification par email + mot de passe haché avec bcryptjs.
- **Session / token** : JWT généré côté API Route et utilisé côté client.
- **Rôles** : le champ `type` du modèle `User` détermine le rôle (accès aux services via sidebars spécialisées).
- **Sécurité anti-bruteforce** : compteur `failedAttempts`, verrouillage `isLocked` / `lockedUntil`, `remainingAttempts`.
- **UID** : chaque utilisateur possède un `uid` unique (généré localement) pour traçabilité.
- **Multi-entreprise** : les entités peuvent être liées à une `entrepriseId` pour un fonctionnement multi-sites.

---

## 7. API internes (Next.js API Routes)

Les endpoints REST sont situés dans `app/api/` et couvrent l'ensemble des domaines. Exemples de routes :

| Domaine | Routes représentatives |
|---------|------------------------|
| Authentification | `login/`, `register/`, `update-password/`, `check-users/`, `unlock-user/` |
| Utilisateurs | `users/`, `new-users/`, `utilisateurs/` |
| Patients | `patients/` |
| Consultations | `consultation/`, `consultations/`, `codeconsultation/` |
| Examens | `examens/`, `examenhospitalisation/`, `examenhospitalisationFacture/`, `ExamenHospitUpdate/` |
| Facturation | `facturation/`, `facturations/`, `consultationFacture/`, `facturesListe/`, `facturesPrescriptionListe/`, `facturesnonsoldees/`, `factureassurance/` |
| Caisse | `caisse/`, `encaissementcaisse/`, `pointcaisse/`, `comptePatient/` |
| Pharmacie / Stock | `medicaments/`, `stock/`, `gestionstock/`, `sortiestock/`, `approvisionnement/`, `commande-fournisseur/`, `fournisseur/` |
| Laboratoire | `laboratoire/`, `paramlabo/`, `parambiochimie/`, `parametreCRendu/`, `ligneprestation/`, `ReceptionExamenLabo/` |
| Prescription | `prescription/`, `prescriptionMedecin/`, `fichePrescriptionMedecin/`, `patientprescription/`, `patientprescriptionFacture/`, `printficheprescription/` |
| Rendez-vous | `rendez-vous/`, `planning-medecin/`, `rendezvous/` |
| Partenaires | `assurances/`, `societeassurance/`, `societePartenaire/`, `ajoutsocietepatient/`, `ActeSocietePartenaire/` |
| Actes / Tarifs | `actes/`, `actesclinique/`, `acteclinique/`, `typeacte/`, `familleacte/`, `tarifassurance/`, `tarifs/` |
| Comptabilité | `comptabilite/` (23 endpoints) |
| Statistiques | `statistiques/`, `statistiques-medecin/` |
| Impression | `MesImpressions/`, `recu-examen/`, `recu-pharmacie/`, `compteRenduRadio/` |
| Configuration | `entreprise/`, `entreprises/`, `operations/`, `parametrageoperation/` |

---

## 8. Fonctionnalités clés

- **Dossier patient numérique** : création, recherche, antécédents, documents, assurance.
- **Parcours de soins** : consultations, examens, hospitalisations, prescriptions, rendez-vous.
- **Gestion de la caisse** : encaissements, annulations, comptes patients, provisions, point de caisse.
- **Facturation** : facturation des actes, consultation, examens, honoraires, assurances, reçus.
- **Pharmacie & stock** : inventaire, entrées/sorties, commandes fournisseurs, dispensation.
- **Laboratoire** : réception des examens, saisie de résultats, validation biologiste, comptes-rendus.
- **Radio** : demandes d'imagerie et comptes-rendus radiologiques.
- **Statistiques & tableaux de bord** : indicateurs d'activité, classement des actes, évolution des consultations.
- **Documents officiels** : arrêts de travail, feuilles de soins, ordonnances, factures, reçus.
- **Impression PDF** : génération et impression de documents via pdfkit / pdfmake / puppeteer.
- **Multi-entreprise** : configuration par établissement (logo, entête, pied de page, NCC).

---

## 9. Configuration serveur

Fichier `next.config.ts` :

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit", "fontkit", "linebreak", "unicode-properties", "brotli"],
};

export default nextConfig;
```

**Points notables** :
- `serverExternalPackages` est utilisé pour gérer correctement les bibliothèques PDF côté serveur (Server Components / API Routes).
- Aucune configuration d'export statique n'est présente : l'application nécessite un serveur Node.js.

---

## 10. Sécurité & bonnes pratiques observées

- Mots de passe hachés avec **bcryptjs (12 rounds)**.
- Gestion du verrouillage de compte après tentatives échouées.
- Utilisation de JWT pour l'authentification.
- Séparation des types TypeScript dans `types/`.
- Centralisation de la logique d'impression et des certificats dans `lib/` et `utils/`.

---

## 11. Déploiement & exécution

### Prérequis

- Node.js compatible avec Next.js 16 / React 19
- Base de données MongoDB accessible
- Variables d'environnement (URL MongoDB, secrets JWT, etc.)

### Commandes disponibles

```bash
# Installation
cd "PROJET DE FORMATION/easy_medical"
npm install

# Développement
npm run dev        # http://localhost:3000

# Production
npm run build
npm run start

# Linting
npm run lint
```

### Conseil de déploiement

- L'application nécessite un environnement Node.js avec MongoDB.
- Déployer sur un PaaS supportant Next.js (Vercel, Render, Railway, Node app server).
- S'assurer que Puppeteer dispose des dépendances système si la génération PDF via Chromium est utilisée.

---

## 12. Points de vigilance & recommandations

1. **Variables d'environnement** : aucun `.env.example` visible ; il est recommandé de créer un fichier `.env.local` avec au minimum `MONGODB_URI`, `JWT_SECRET`, `NEXT_PUBLIC_*` si nécessaire.
2. **Gestion des erreurs** : harmoniser les réponses API et la gestion des erreurs côté client.
3. **Validation** : ajouter un middleware de validation centralisé pour les requêtes API (ex. Zod).
4. **RBAC** : formaliser un système de rôles et permissions plus granulaire que le simple `type` utilisateur.
5. **Sauvegardes** : mettre en place des sauvegardes automatiques MongoDB.
6. **Audit** : tracer les actions sensibles (encaissements, annulations, modifications de factures).
7. **Tests** : introduire des tests unitaires et E2E (Jest / Vitest + Playwright) car le projet n'en dispose pas actuellement.

---

*Document généré le 14 juillet 2026 à partir de l'analyse du codebase Easy Medical.*
