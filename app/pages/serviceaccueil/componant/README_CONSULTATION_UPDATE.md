# Modification de Consultation - Documentation

## 📋 Vue d'ensemble

Le composant `FicheConsultationUpdate.tsx` permet de modifier une consultation existante en chargeant ses données via un **N° Prestation**.

## 🆕 Nouveautés implémentées

### 1. Champ N°Prestation dans BlocActe
- **Nouveau composant**: `BlocActeUpdate.tsx`
- **Emplacement**: En haut du bloc Acte
- **Fonctionnalités**:
  - Champ de saisie pour le code prestation
  - Bouton "Charger" avec icône de recherche
  - Validation avant chargement
  - Texte d'aide contextuel

### 2. Chargement automatique de la consultation
Au clic sur le bouton "Charger":
1. ✅ Récupération des données via `/api/consultation/code?Code_Prestation=XXX`
2. ✅ Pré-remplissage automatique de tous les champs:
   - Type patient (Non Assuré / Mutualiste / Préférentiel)
   - Acte sélectionné
   - Médecin prescripteur
   - Montants (Clinique et Assurance)
   - Informations d'assurance (Assurance, Matricule, Taux, N°Bon)
   - Souscripteur et Société Patient
3. ✅ Affichage d'un message de succès
4. ✅ Gestion des erreurs (consultation introuvable, etc.)

### 3. Réutilisation des blocs existants
Le composant `FicheConsultationUpdate.tsx` réutilise:
- ✅ `InfosPatient.tsx` - Sélection du type patient
- ✅ `BlocActeUpdate.tsx` - **NOUVEAU** avec champ N°Prestation
- ✅ `BlocAssurance.tsx` - Gestion de l'assurance
- ✅ `ResumeMontants.tsx` - Calculs financiers

## 🔄 Différences avec FicheConsultation.tsx

| Aspect | FicheConsultation | FicheConsultationUpdate |
|--------|-------------------|-------------------------|
| **Titre** | "NOUVELLE FICHE" (bleu) | "MODIFICATION FICHE" (orange) |
| **Bloc Acte** | `BlocActe.tsx` | `BlocActeUpdate.tsx` (avec N°Prestation) |
| **Action** | POST (création) | PUT (modification) |
| **Bouton** | "Va à la caisse" | "Enregistrer les modifications" |
| **Chargement** | Données patient uniquement | Consultation complète |

## 🎯 Utilisation

```tsx
import FicheConsultationUpdate from './FicheConsultationUpdate';

// Avec patient seulement (saisie manuelle du code)
<FicheConsultationUpdate 
    patient={selectedPatient}
    onClose={() => setShowModal(false)}
/>

// Avec consultation pré-chargée (via ID)
<FicheConsultationUpdate 
    patient={selectedPatient}
    consultationId="consultation-id-here"
    onClose={() => setShowModal(false)}
/>
```

## 🔐 Sécurité et Validation

- ✅ Vérification que la consultation est chargée avant modification
- ✅ Validation du code prestation avant recherche
- ✅ Gestion des états de chargement (spinner)
- ✅ Messages d'erreur explicites
- ✅ Désactivation du bouton après sauvegarde

## 📡 API Endpoints utilisés

1. **GET** `/api/consultation/code?Code_Prestation=XXX`
   - Recherche une consultation par son code
   - Retourne un tableau de consultations

2. **GET** `/api/consultation/[id]`
   - Récupère une consultation par son ID
   - Utilisé si `consultationId` est fourni

3. **PUT** `/api/consultation/[id]`
   - Met à jour la consultation
   - Envoie les données modifiées

## 🎨 Interface utilisateur

### Champ N°Prestation
```
┌─────────────────────────────────────────────────┐
│ N° Prestation                                   │
│ ┌────────────────────────────┬────────────────┐ │
│ │ Entrez le code...          │ 🔍 Charger     │ │
│ └────────────────────────────┴────────────────┘ │
│ Entrez le N° de prestation et cliquez sur      │
│ "Charger" pour modifier la consultation         │
└─────────────────────────────────────────────────┘
```

### États visuels
- 🔵 **Chargement**: Spinner + message "Chargement de la consultation..."
- ✅ **Succès**: Alert verte "Consultation XXX chargée avec succès"
- ❌ **Erreur**: Alert rouge avec message d'erreur
- 💾 **Sauvegarde**: Bouton désactivé après modification

## 🧪 Test du composant

Voir le fichier de prévisualisation: `app/page.ficheconsultationupdate.tsx`

## 📝 Notes techniques

1. **TypeScript**: Tous les types sont importés avec le modificateur `type`
2. **Bootstrap**: Utilisation des composants React-Bootstrap
3. **Icons**: react-icons/fa pour l'icône de recherche
4. **État**: Gestion avec useState pour tous les champs
5. **Effets**: useEffect pour le chargement initial et les calculs automatiques

## 🐛 Gestion des erreurs

- Code prestation vide → Message d'erreur
- Consultation introuvable → Message d'erreur
- Erreur API → Message d'erreur avec détails
- Pas de consultation chargée → Bouton désactivé

## 🚀 Améliorations futures possibles

- [ ] Historique des modifications
- [ ] Validation des champs avant sauvegarde
- [ ] Confirmation avant modification
- [ ] Annulation des modifications
- [ ] Comparaison avant/après