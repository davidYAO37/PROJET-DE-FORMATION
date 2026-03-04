const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function fixLogoPaths() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/medical');
  
  try {
    await client.connect();
    const db = client.db();
    const entreprises = db.collection('entreprises');
    
    // Récupérer toutes les entreprises
    const allEntreprises = await entreprises.find({}).toArray();
    
    console.log(`Trouvé ${allEntreprises.length} entreprises à vérifier`);
    
    // Lister les fichiers de logos disponibles
    const logosDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
    let availableFiles = [];
    
    if (fs.existsSync(logosDir)) {
      availableFiles = fs.readdirSync(logosDir);
      console.log('Fichiers disponibles:', availableFiles);
    }
    
    for (const entreprise of allEntreprises) {
      if (entreprise.LogoE && !entreprise.LogoE.startsWith('/uploads/') && !entreprise.LogoE.startsWith('data:')) {
        // Chercher un fichier correspondant
        const matchingFile = availableFiles.find(file => 
          file.includes(entreprise.LogoE.split('.')[0]) || 
          file.includes(entreprise.LogoE.replace(/\s+/g, '_').split('.')[0])
        );
        
        if (matchingFile) {
          // Mettre à jour avec le bon chemin
          await entreprises.updateOne(
            { _id: entreprise._id },
            { $set: { LogoE: `/uploads/logos/${matchingFile}` } }
          );
          console.log(`Mis à jour ${entreprise.NomSociete}: ${entreprise.LogoE} -> /uploads/logos/${matchingFile}`);
        } else {
          console.log(`Aucun fichier trouvé pour ${entreprise.NomSociete}: ${entreprise.LogoE}`);
        }
      }
    }
    
    console.log('Correction terminée');
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await client.close();
  }
}

fixLogoPaths();
