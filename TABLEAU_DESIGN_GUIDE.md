# 📊 Guide de Design des Tableaux - Easy Medical

## 🎨 Design Standard

Tous les tableaux du projet doivent suivre ce design pour une cohérence visuelle.

### Structure de base

```tsx
<div className="table-responsive">
  <Table bordered hover className="text-center">
    <thead className="table-primary">
      <tr>
        <th>#</th>
        <th>Colonne 1</th>
        <th>Colonne 2</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {data.length === 0 ? (
        <tr>
          <td colSpan={4} className="text-center">
            Aucune donnée trouvée.
          </td>
        </tr>
      ) : (
        data.map((item, index) => (
          <tr key={item._id}>
            <td>{index + 1}</td>
            <td>{item.field1}</td>
            <td>{item.field2}</td>
            <td className="bg-primary bg-opacity-10">
              {/* Boutons d'action */}
            </td>
          </tr>
        ))
      )}
    </tbody>
  </Table>
</div>
```

## 🎯 Classes CSS à utiliser

### Conteneur
- `table-responsive` - Rend le tableau scrollable sur mobile

### Table
- `bordered` - Ajoute des bordures
- `hover` - Effet hover sur les lignes
- `text-center` - Centre le contenu

### En-tête (thead)
- `table-primary` - Fond bleu primaire Bootstrap

### Colonnes d'action (td)
- `bg-secondary bg-opacity-10` - Fond gris clair (10% opacité)
- `bg-primary bg-opacity-10` - Fond bleu clair (10% opacité)
- `bg-success bg-opacity-10` - Fond vert clair (10% opacité)
- `bg-warning bg-opacity-10` - Fond jaune clair (10% opacité)

### Boutons
- `variant="outline-primary"` - Bouton bleu outline
- `variant="outline-success"` - Bouton vert outline
- `variant="outline-danger"` - Bouton rouge outline
- `variant="outline-warning"` - Bouton jaune outline
- `size="sm"` - Taille small
- `className="me-2"` ou `className="me-4"` - Espacement entre boutons

## 📝 Exemple complet avec actions

```tsx
<div className="table-responsive">
  <Table bordered hover className="text-center">
    <thead className="table-primary">
      <tr>
        <th>#</th>
        <th>Nom</th>
        <th>Prénoms</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {patients.length === 0 ? (
        <tr>
          <td colSpan={4} className="text-center">
            Aucun patient trouvé.
          </td>
        </tr>
      ) : (
        patients.map((patient, index) => (
          <tr key={patient._id}>
            <td>{index + 1}</td>
            <td>{patient.Nom}</td>
            <td>{patient.Prenoms}</td>
            <td className="bg-primary bg-opacity-10">
              <Button
                variant="outline-primary"
                size="sm"
                className="me-2"
                title="Modifier"
                onClick={() => handleEdit(patient._id)}
              >
                <FaEdit />
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                title="Supprimer"
                onClick={() => handleDelete(patient._id)}
              >
                <FaTrash />
              </Button>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </Table>
</div>
```

## 🔄 Migration des tableaux existants

### Fichiers à mettre à jour:

1. ✅ `/app/pages/serviceaccueil/patient/page.tsx` - **DÉJÀ FAIT** (référence)
2. ⏳ `/app/dashboard/parametres/tarifacteassurance/tarifassurances.tsx`
3. ⏳ `/app/examenhospitalisation/components/ListeAutreActeModal.tsx`
4. ⏳ `/app/dashboard/parametres/Typeacte/ListeTypeActe.tsx`
5. ⏳ `/app/dashboard/parametres/actes/ListeActe.tsx`
6. ⏳ `/app/dashboard/parametres/assurances/ListeAssurance.tsx`
7. ⏳ `/app/dashboard/parametres/assurances/SocieteAssuranceModal.tsx`
8. ⏳ `/app/dashboard/parametres/medecin/page.tsx`
9. ⏳ `/app/examenhospitalisation/components/ActesTable.tsx` - **DESIGN SPÉCIAL**
10. ⏳ `/app/pages/serviceaccueil/componant/ListeConsultationsModal.tsx`
11. ⏳ `/app/pages/servicemedecin/tmedecin/composants/ListePatientsMedecin.tsx`

### Étapes de migration:

1. **Remplacer** `<Table>` par `<Table bordered hover className="text-center">`
2. **Remplacer** `<thead>` par `<thead className="table-primary">`
3. **Ajouter** `<div className="table-responsive">` autour du tableau
4. **Ajouter** `className="bg-primary bg-opacity-10"` aux colonnes d'action
5. **Standardiser** les boutons avec `variant="outline-*"` et `size="sm"`
6. **Ajouter** message "Aucune donnée trouvée" si tableau vide

## 🎨 Variantes de couleurs pour colonnes d'action

Utilisez différentes couleurs selon le type d'actions:

- **Bleu primaire** (`bg-primary bg-opacity-10`) - Actions principales (consultation, modification)
- **Gris secondaire** (`bg-secondary bg-opacity-10`) - Actions secondaires (liste, détails)
- **Vert** (`bg-success bg-opacity-10`) - Actions de validation
- **Jaune** (`bg-warning bg-opacity-10`) - Actions d'alerte
- **Rouge** (`bg-danger bg-opacity-10`) - Actions de suppression

## 📱 Responsive

Le design est automatiquement responsive grâce à:
- `table-responsive` - Scroll horizontal sur petits écrans
- Bootstrap grid system pour les filtres et boutons au-dessus du tableau

## ✨ Bonnes pratiques

1. ✅ Toujours utiliser `key={item._id}` sur les lignes
2. ✅ Afficher un message si tableau vide
3. ✅ Utiliser des icônes pour les boutons d'action
4. ✅ Ajouter des `title` sur les boutons pour l'accessibilité
5. ✅ Centrer le contenu avec `text-center`
6. ✅ Utiliser `colSpan` pour le message de tableau vide
