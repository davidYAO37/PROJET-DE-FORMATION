# API Fiche Prescription Médecin

## Structure des endpoints

### Endpoint principal
- **GET /api/fichePrescriptionMedecin** - Récupérer la fiche complète d'une consultation
  - Paramètre: `consultationId` (requis)
  - Retourne: patient, consultation, antécédents, prescriptions

- **POST /api/fichePrescriptionMedecin** - Créer des prescriptions et mettre à jour le diagnostic
  - Corps: `{ consultationId, prescriptions?, diagnostic? }`

### Endpoints secondaires

#### Constantes médicales
- **GET /api/fichePrescriptionMedecin/constantes** - Récupérer les constantes d'une consultation
  - Paramètre: `consultationId` (requis)
  - Retourne: température, poids, tension, glycémie, taille

- **PUT /api/fichePrescriptionMedecin/constantes** - Mettre à jour les constantes
  - Corps: `{ consultationId, constantes: { temperature, poids, tension, glycemie, taille } }`

#### Antécédents patient
- **GET /api/fichePrescriptionMedecin/antecedents** - Récupérer les antécédents d'un patient
  - Paramètres: `patientId` OU `consultationId` (un des deux requis)
  - Retourne: antecedentMedico, anteChirurgico, anteFamille, autreAnte, allergies

- **POST /api/fichePrescriptionMedecin/antecedents** - Mettre à jour les antécédents
  - Corps: `{ patientId?, consultationId?, antecedents, type? }`
  - Options:
    - `patientId`: ID direct du patient (optionnel si consultationId fourni)
    - `consultationId`: ID de la consultation pour retrouver le patient automatiquement
    - `antecedents`: Données d'antécédents (plusieurs formats supportés)
    - `type`: Type spécifique à mettre à jour (optionnel)
      - Types supportés: `"médical"`, `"chirurgical"`, `"familial"`, `"autre"`, `"allergie"`
      - Aussi supportés: `"medical"`, `"chirurgical"`, `"familial"`, `"autre"`, `"allergie"`
      - Noms exacts: `"AntecedentMedico"`, `"AnteChirurgico"`, `"AnteFamille"`, `"AutreAnte"`, `"AlergiePatient"`
  - Formats de données pour `antecedents`:
    - Format 1: `{ description: "CHIRURGIE", date: "2026-04-26" }`
    - Format 2: `{ AntecedentMedico: "valeur" }`
    - Format 3: `"valeur directe"`

- **PUT /api/fichePrescriptionMedecin/antecedents** - Alias pour POST

- **DELETE /api/fichePrescriptionMedecin/antecedents/[type]** - Supprimer un type spécifique d'antécédent
  - Paramètres: `patientId` OU `consultationId` (un des deux requis, en query string)
  - Types: `medical`, `chirurgical`, `familial`, `autre`, `allergie`, `allergies`
  - Exemple: `DELETE /api/fichePrescriptionMedecin/antecedents/medical?patientId=xxx`
  - Exemple: `DELETE /api/fichePrescriptionMedecin/antecedents/chirurgical?consultationId=xxx`
  - Exemple: `DELETE /api/fichePrescriptionMedecin/antecedents/allergies?patientId=xxx`

#### Test
- **GET /api/fichePrescriptionMedecin/test** - Tester la connexion et les modèles
  - Retourne: état de la base de données et des modèles

## Exemples d'utilisation

### Récupérer une fiche complète
```javascript
GET /api/fichePrescriptionMedecin?consultationId=60f7b3b3b3b3b3b3b3b3b3b3
```

### Mettre à jour les constantes
```javascript
PUT /api/fichePrescriptionMedecin/constantes
{
  "consultationId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "constantes": {
    "temperature": 37.5,
    "poids": 70,
    "tension": "120/80",
    "glycemie": 1.2,
    "taille": 175
  }
}
```

### Mettre à jour les antécédents (tous les champs)
```javascript
POST /api/fichePrescriptionMedecin/antecedents
{
  "patientId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "antecedents": {
    "antecedentMedico": "Diabète type 2",
    "anteChirurgico": "Appendicectomie 2010",
    "anteFamille": "Hypertension paternelle",
    "autreAnte": "Fumeur",
    "allergies": "Pénicilline"
  }
}
```

### Mettre à jour un type spécifique d'antécédents
```javascript
POST /api/fichePrescriptionMedecin/antecedents
{
  "consultationId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "type": "AntecedentMedico",
  "antecedents": {
    "AntecedentMedico": "Hypertension artérielle"
  }
}
```

### Mettre à jour les allergies via consultation
```javascript
POST /api/fichePrescriptionMedecin/antecedents
{
  "consultationId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "type": "AlergiePatient",
  "antecedents": {
    "allergies": "Arachides, fruits de mer"
  }
}
```

### Mettre à jour avec description et date (format qui causait l'erreur 400)
```javascript
POST /api/fichePrescriptionMedecin/antecedents
{
  "patientId": "69ca3a320ff8dc5547c68826",
  "type": "chirurgical",
  "antecedents": {
    "description": "CHIRURGIE",
    "date": "2026-04-26"
  }
}
```

### Mettre à jour avec valeur directe
```javascript
POST /api/fichePrescriptionMedecin/antecedents
{
  "patientId": "69ca3a320ff8dc5547c68826",
  "type": "médical",
  "antecedents": "Diabète type 2"
}
```

### Supprimer un antécédent
```javascript
DELETE /api/fichePrescriptionMedecin/antecedents/medical?patientId=69ca3a320ff8dc5547c68826
```

### Supprimer un antécédent via consultation
```javascript
DELETE /api/fichePrescriptionMedecin/antecedents/chirurgical?consultationId=60f7b3b3b3b3b3b3b3b3b3
```

## Erreurs possibles

- **400**: Paramètres manquants ou invalides
- **404**: Consultation ou patient non trouvé
- **500**: Erreur serveur (problème de base de données, modèle manquant, etc.)

## Notes importantes

- Tous les endpoints utilisent des imports dynamiques pour éviter les dépendances circulaires
- Les IDs MongoDB sont automatiquement convertis en string lorsque nécessaire
- La validation des données est effectuée côté serveur
- Les logs sont ajoutés pour faciliter le debugging
