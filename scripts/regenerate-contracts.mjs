import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Entreprise } from '../models/entreprise';
import { LicenceOrder } from '../models/licenceOrder';
import { generateContractPdf } from '../lib/pdfGenerator';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI non défini dans .env');
  process.exit(1);
}

async function db() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  return mongoose.connect(MONGO_URI, { dbName: 'bd_esaymed' });
}

async function regenerateContracts() {
  console.log('Connexion à MongoDB...');
  await db();

  console.log('Récupération de toutes les entreprises...');
  const entreprises = await Entreprise.find({}).lean();
  console.log(`${entreprises.length} entreprises trouvées.`);

  let regenerated = 0;
  let errors = 0;

  for (const entreprise of entreprises) {
    try {
      console.log(`\nEntreprise: ${entreprise.NomSociete || '—'} (${entreprise._id})`);

      // 1. Contrat d'acquisition (si licence achetée)
      if (entreprise.licenceType === 'paid' && entreprise.licensePurchasedAt) {
        console.log('  → Recherche commande d\'acquisition...');
        const purchaseOrder = await LicenceOrder.findOne({
          entrepriseId: entreprise._id,
          action: 'purchase',
          status: { $in: ['validated', 'paid_awaiting_validation'] }
        }).sort({ createdAt: -1 });

        if (purchaseOrder) {
          console.log(`  → Commande trouvée: ${purchaseOrder._id}`);
          const contractUrl = await generateContractPdf(purchaseOrder, 'acquisition');
          await LicenceOrder.findByIdAndUpdate(purchaseOrder._id, { acquisitionContractUrl: contractUrl });
          console.log(`  ✓ Contrat d'acquisition régénéré: ${contractUrl}`);
          regenerated++;
        } else {
          console.log('  ✗ Aucune commande d\'acquisition trouvée');
        }
      }

      // 2. Contrat de maintenance (si maintenance acceptée)
      if (entreprise.maintenanceAccepted && entreprise.maintenanceDueDate) {
        console.log('  → Recherche commande de maintenance...');
        const maintenanceOrder = await LicenceOrder.findOne({
          entrepriseId: entreprise._id,
          action: 'maintenance',
          status: { $in: ['validated', 'paid_awaiting_validation'] }
        }).sort({ createdAt: -1 });

        if (maintenanceOrder) {
          console.log(`  → Commande trouvée: ${maintenanceOrder._id}`);
          const contractUrl = await generateContractPdf(maintenanceOrder, 'maintenance');
          await LicenceOrder.findByIdAndUpdate(maintenanceOrder._id, { maintenanceContractUrl: contractUrl });
          console.log(`  ✓ Contrat de maintenance régénéré: ${contractUrl}`);
          regenerated++;
        } else {
          console.log('  ✗ Aucune commande de maintenance trouvée');
        }
      }

      if (entreprise.licenceType !== 'paid' && !entreprise.maintenanceAccepted) {
        console.log('  → Rien à régénérer (licence non achetée et maintenance non acceptée)');
      }

    } catch (err) {
      console.error(`  ✗ Erreur pour ${entreprise.NomSociete}:`, err);
      errors++;
    }
  }

  console.log(`\n=== Résumé ===`);
  console.log(`Contrats régénérés: ${regenerated}`);
  console.log(`Erreurs: ${errors}`);
  console.log(`Total entreprises traitées: ${entreprises.length}`);

  process.exit(errors > 0 ? 1 : 0);
}

regenerateContracts().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
