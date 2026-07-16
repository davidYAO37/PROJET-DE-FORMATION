# Fiche Technique Client — Easy Medical

## 1. Présentation de la solution

**Easy Medical** est une application web de gestion complète destinée aux établissements de santé : cliniques, cabinets médicaux, centres de santé et structures hospitalières de petite/moyenne taille.

Elle centralise l'ensemble des activités quotidiennes : réception des patients, consultations, examens médicaux, facturation, caisse, pharmacie, laboratoire, imagerie médicale et comptabilité.

---

## 2. Objectifs métier

- **Numériser le dossier patient** pour un accès rapide, sécurisé et fiable.
- **Fluidifier le parcours de soins** de l'accueil jusqu'à la sortie du patient.
- **Automatiser la facturation et la caisse** pour réduire les erreurs et les pertes financières.
- **Tracer l'ensemble des mouvements** : soins, examens, encaissements, stocks.
- **Fournir des indicateurs de performance** pour piloter l'activité de l'établissement.

---

## 3. Fonctionnalités principales

### 3.1 Gestion des patients

- Création et recherche de dossiers patients.
- Identité, contacts, antécédents médicaux/chirurgicaux/familiaux, allergies.
- Liaison assurance / société partenaire / tarif applicable.
- Code dossier unique et codes-barres.

### 3.2 Parcours de soins

- Consultations médicales et prescriptions.
- Ordonnances, arrêts de travail, comptes-rendus opératoires.
- Examens biologiques et imagerie.
- Hospitalisation : observations, examens, rapports.
- Prise de rendez-vous et planning des médecins.

### 3.3 Facturation & caisse

- Facturation automatique des consultations, examens, actes et honoraires.
- Gestion des assurances, sociétés partenaires et tiers payant.
- Encaissements, annulations, comptes patients et provisions.
- Reçus, factures et états de caisse imprimables.

### 3.4 Pharmacie & stock

- Gestion des produits pharmaceutiques et matériels.
- Entrées/sorties de stock, inventaires, commandes fournisseurs.
- Suivi des mouvements et alertes de disponibilité.

### 3.5 Laboratoire & radio

- Réception des échantillons et demandes d'examens.
- Saisie et validation des résultats biologiques.
- Comptes-rendus radiologiques.
- Impression des résultats et reçus.

### 3.6 Comptabilité & statistiques

- Journaux de caisse et états financiers.
- Statistiques d'activité par service, par médecin, par acte.
- Tableaux de bord : évolution des consultations, classement des actes, répartition par sexe, etc.

---

## 4. Modules par service

| Service | Rôle | Bénéfice principal |
|--------|------|-------------------|
| **Accueil** | Enregistrement patient, orientation | Réduction des temps d'attente et des erreurs de saisie |
| **Médecin** | Consultations, prescriptions, examens | Dossier patient accessible en un clic |
| **Infirmier** | Soins, constantes, observations | Suivi clinique structuré |
| **Caisse** | Encaissements, comptes patients, reçus | Maîtrise des flux financiers |
| **Facturation** | Factures, règlements, relances | Réduction des impayés |
| **Comptabilité** | Bilan, états, statistiques | Vision claire de l'activité |
| **Laboratoire** | Résultats biologiques, validation | Fiabilisation des examens |
| **Pharmacie** | Dispensation, gestion des stocks | Évite les ruptures et les surstocks |
| **Radio** | Imagerie et comptes-rendus | Centralisation des résultats |
| **Paramétrage** | Configuration des actes, tarifs, utilisateurs | Adaptation aux besoins de la structure |

---

## 5. Avantages clés

- **Tout-en-un** : un seul outil couvre l'accueil, le soin, la facturation et le pilotage.
- **Accessible depuis un navigateur** : pas d'installation lourde sur chaque poste.
- **Sécurisé** : authentification par mot de passe, verrouillage anti-intrusion, hachage des mots de passe.
- **Impression et documents officiels** : ordonnances, arrêts de travail, factures, reçus, résultats d'examens.
- **Multi-établissement** : possibilité de gérer plusieurs structures depuis le même système.
- **Évolutif** : architecture moderne facilitant l'ajout de nouveaux modules.

---

## 6. Technologies utilisées

| Domaine | Technologie retenue | Pourquoi ? |
|---------|---------------------|------------|
| Framework web | Next.js + React | Performance, évolutivité, communauté large |
| Langage | TypeScript | Fiabilité et maintenance facilitée |
| Base de données | MongoDB | Souplesse pour les données médicales complexes |
| Interface utilisateur | Bootstrap + React | Moderne, responsive, facile à prendre en main |
| Rapports & impressions | pdfkit, pdfmake, puppeteer | Documents professionnels et personnalisables |
| Sécurité | bcryptjs, JWT | Authentification robuste |

---

## 7. Sécurité et confidentialité

- Hachage sécurisé des mots de passe.
- Verrouillage automatique des comptes après plusieurs tentatives échouées.
- Authentification par token sécurisé.
- Association des actions aux utilisateurs pour la traçabilité.
- Architecture prête à intégrer des rôles et permissions plus fins.

> **Note** : le déploiement final devra s'accompagner de mesures complémentaires selon le cadre local (sauvegardes, chiffrement, politique de mots de passe, etc.).

---

## 8. Prérequis techniques

- Serveur ou hébergement cloud supportant Node.js.
- Base de données MongoDB.
- Navigateurs web modernes (Chrome, Firefox, Edge).
- Connexion internet ou réseau local selon le mode d'hébergement choisi.

---

## 9. Étapes d'installation et de mise en place

1. **Configuration** : renseigner l'identité de l'établissement (nom, logo, entête, pied de page, NCC).
2. **Paramétrage** : actes, tarifs, assurances, sociétés partenaires, modes de paiement.
3. **Création des utilisateurs** : médecins, infirmiers, caissiers, comptables, etc.
4. **Formation** : prise en main des modules par service.
5. **Import éventuel** : migration des patients et stocks existants.
6. **Mise en production** : déploiement sur un serveur sécurisé.

---

## 10. Maintenance et évolution

- Mises à jour du framework et des dépendances.
- Sauvegardes régulières de la base de données.
- Journal des actions sensibles (encaissements, annulations, modifications).
- Ajout de modules sur demande (téléconsultation, SMS de rappel, interfaçage équipement, etc.).

---

## 11. Livrables possibles

| Livrable | Description |
|----------|-------------|
| Application déployée | Accès web complet aux modules |
| Documentation utilisateur | Guides par service |
| Formation | Sessions de prise en main |
| Support technique | Assistance et corrections |
| Évolutions | Développements sur mesure |

---

## 12. Limites et points à discuter

L'application est actuellement en version initiale (**v0.1.0**). Il est important de prévoir :

- Une phase de recette et de tests avant mise en production.
- La création d'un fichier de variables d'environnement (`MONGODB_URI`, `JWT_SECRET`, etc.).
- La mise en place d'une stratégie de sauvegarde.
- La définition précise des rôles et permissions si l'établissement a des besoins spécifiques.

---

*Document destiné à un public non technique — présentation commerciale et orientée valeur métier.*
