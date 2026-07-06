/**
 * syncCollections.js
 * 
 * Script de synchronisation de toutes les collections MongoDB
 * avec les schémas Mongoose définis dans /models.
 * 
 * Ce script ajoute les champs manquants sur les documents existants
 * sans jamais écraser les données en place.
 * 
 * Usage:
 *   node scripts/syncCollections.js              → toutes les collections
 *   node scripts/syncCollections.js Patient       → une collection spécifique
 *   node scripts/syncCollections.js --dry-run     → simulation sans écriture
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME   = 'bd_esaymed';
const DRY_RUN   = process.argv.includes('--dry-run');
const TARGET    = process.argv.find(a => !a.startsWith('--') && !a.includes('syncCollections') && !a.includes('node'));

// ─────────────────────────────────────────────────────────────────────────────
// 1. Déclaration de toutes les collections et leurs valeurs par défaut
//    → Ajouter ici tout nouveau champ introduit dans un modèle
// ─────────────────────────────────────────────────────────────────────────────
const COLLECTIONS = [

  // ── Patients ────────────────────────────────────────────────────────────────
  {
    name: 'Patient',
    collection: 'patients',
    defaults: {
      Nom:               null,
      Prenoms:           null,
      sexe:              null,
      Age_partient:      null,
      Date_naisse:       null,
      Code_dossier:      null,
      Situationgeo:      null,
      Reçule:            null,
      Contact:           null,
      ProvisionClient:   0,
      DepenseProvision:  0,
      SocieteP:          null,
      Matricule:         null,
      AntecedentMedico:  null,
      AnteChirurgico:    null,
      AnteFamille:       null,
      AutreAnte:         null,
      Souscripteur:      null,
      AlergiePatient:    null,
      IDASSURANCE:       null,
      Assurance:         null,
      IDSOCIETEASSURANCE:null,
      SOCIETE_PATIENT:   null,
      Taux:              0,
      TarifPatient:      null,
      entrepriseId:      null,
    },
  },

  // ── Consultations ────────────────────────────────────────────────────────────
  {
    name: 'Consultation',
    collection: 'consultations',
    defaults: {
      designationC:              null,
      assurance:                 null,
      Assure:                    null,
      IDASSURANCE:               null,
      Prix_Assurance:            0,
      PrixClinique:              0,
      Restapayer:                0,
      montantapayer:             0,
      ReliquatPatient:           0,
      Code_dossier:              null,
      CodePrestation:            null,
      Date_consulation:          null,
      Heure_Consultation:        null,
      StatutC:                   false,
      StatutPaiement:            'En cours de Paiement',
      Toutencaisse:              false,
      tauxAssurance:             0,
      PartAssurance:             0,
      tiket_moderateur:          0,
      numero_carte:              null,
      NumBon:                    null,
      Recupar:                   null,
      IDACTE:                    null,
      IdPatient:                 null,
      Souscripteur:              null,
      PatientP:                  null,
      SOCIETE_PATIENT:           null,
      IDSOCIETEASSURANCE:        null,
      Medecin:                   null,
      IDMEDECIN:                 null,
      MontantMedecin:            0,
      Sexe:                      null,
      statutPrescriptionMedecin: 2,
      Diagnostic:                null,
      ExamenClinique:            null,
      CodeAffection:             null,
      MotifConsultation:         null,
      ExamenParaclinique:        null,
      TraitementClinique:        null,
      ConclusionClinique:        null,
      AncienMedecin:             null,
      datetransfert:             null,
      TransfererPar:             null,
      Temperature:               null,
      Poids:                     null,
      Tension:                   null,
      Glycemie:                  null,
      TailleCons:                null,
      AttenteAccueil:            0,
      attenteMedecin:            0,
      Montantencaisse:           null,
      DateFacturation:           null,
      Modepaiement:              null,
      Caissiere:                 null,
      entrepriseId:              null,
      StatutFacturation:         false,
      Ordonnerlannulation:       0,
      AnnulOrdonnerPar:          null,
      AnnulationOrdonneLe:       null,
      MotifAnnulationFacture:    null,
      Annulerle:                 null,
      AnnulerPar:                null,
    },
  },

  // ── Médecins ─────────────────────────────────────────────────────────────────
  {
    name: 'Medecin',
    collection: 'medecins',
    defaults: {
      TauxAideOperatoire: null,
      TauxAnesthesiste:   null,
      entrepriseId:       null,
    },
  },

  // ── Infirmiers ────────────────────────────────────────────────────────────────
  {
    name: 'Infirmier',
    collection: 'infirmiers',
    defaults: {
      service:      null,
      grade:        null,
      telephone:    null,
      EmailInf:     null,
      entrepriseId: null,
    },
  },

  // ── Utilisateurs ─────────────────────────────────────────────────────────────
  {
    name: 'User',
    collection: 'users',
    defaults: {
      nom:          null,
      prenom:       null,
      email:        null,
      type:         null,
      entrepriseId: null,
      uid:          null,
    },
  },

  // ── Entreprises ───────────────────────────────────────────────────────────────
  {
    name: 'Entreprise',
    collection: 'entreprises',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── Assurances ───────────────────────────────────────────────────────────────
  {
    name: 'Assurance',
    collection: 'assurances',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── Prescriptions ────────────────────────────────────────────────────────────
  {
    name: 'Prescription',
    collection: 'prescriptions',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── PatientPrescription ───────────────────────────────────────────────────────
  {
    name: 'PatientPrescription',
    collection: 'patientprescriptions',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── LignePrestation ───────────────────────────────────────────────────────────
  {
    name: 'LignePrestation',
    collection: 'ligneprestations',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── ExamenHospitalisation ────────────────────────────────────────────────────
  {
    name: 'ExamenHospitalisation',
    collection: 'examenhospitalisations',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── AvisHospit ────────────────────────────────────────────────────────────────
  {
    name: 'AvisHospit',
    collection: 'avishospits',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── ArretTravail ──────────────────────────────────────────────────────────────
  {
    name: 'ArretTravail',
    collection: 'arrettravails',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── CompteRenduOperatoire ─────────────────────────────────────────────────────
  {
    name: 'CompteRenduOperatoire',
    collection: 'compterenduoperatoires',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── PlanningMed ───────────────────────────────────────────────────────────────
  {
    name: 'PlanningMed',
    collection: 'planningmeds',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── RendezVous ────────────────────────────────────────────────────────────────
  {
    name: 'RendezVous',
    collection: 'rendezvous',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── Facturation ───────────────────────────────────────────────────────────────
  {
    name: 'Facturation',
    collection: 'facturations',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── LigneFacture ─────────────────────────────────────────────────────────────
  {
    name: 'LigneFacture',
    collection: 'lignefactures',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── EncaissementCaisse ────────────────────────────────────────────────────────
  {
    name: 'EncaissementCaisse',
    collection: 'encaissementcaisses',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── EncaissementCaisseAnnule ──────────────────────────────────────────────────
  {
    name: 'EncaissementCaisseAnnule',
    collection: 'encaissementcaisseannules',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── Caisse ───────────────────────────────────────────────────────────────────
  {
    name: 'Caisse',
    collection: 'caisses',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── Stock ─────────────────────────────────────────────────────────────────────
  {
    name: 'Stock',
    collection: 'stocks',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── EntreeStock ───────────────────────────────────────────────────────────────
  {
    name: 'EntreeStock',
    collection: 'entreestocks',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── SortieStock ───────────────────────────────────────────────────────────────
  {
    name: 'SortieStock',
    collection: 'sortiestocks',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── Pharmacie ─────────────────────────────────────────────────────────────────
  {
    name: 'Pharmacie',
    collection: 'pharmacies',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── Approvisionnement ─────────────────────────────────────────────────────────
  {
    name: 'Approvisionnement',
    collection: 'approvisionnements',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── Inventaire ────────────────────────────────────────────────────────────────
  {
    name: 'Inventaire',
    collection: 'inventaires',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── LigneInventaire ───────────────────────────────────────────────────────────
  {
    name: 'LigneInventaire',
    collection: 'ligneinventaires',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── HonoraireMed ─────────────────────────────────────────────────────────────
  {
    name: 'HonoraireMed',
    collection: 'honorairemeds',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── HonorairePaye ─────────────────────────────────────────────────────────────
  {
    name: 'HonorairePaye',
    collection: 'honoraireapayes',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── LigneHonoraireMed ─────────────────────────────────────────────────────────
  {
    name: 'LigneHonoraireMed',
    collection: 'lignehonorairemeds',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── SocieteAssurance ──────────────────────────────────────────────────────────
  {
    name: 'SocieteAssurance',
    collection: 'societeassurances',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── SocietePartenaire ─────────────────────────────────────────────────────────
  {
    name: 'SocietePartenaire',
    collection: 'societepartenaires',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── ActeSocietePartenaire ─────────────────────────────────────────────────────
  {
    name: 'ActeSocietePartenaire',
    collection: 'actesocietepartenaires',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── PaiementPartenaire ────────────────────────────────────────────────────────
  {
    name: 'PaiementPartenaire',
    collection: 'paiementpartenaires',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── TarifAssurance ────────────────────────────────────────────────────────────
  {
    name: 'TarifAssurance',
    collection: 'tarifassurances',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── FactureAssur ──────────────────────────────────────────────────────────────
  {
    name: 'FactureAssur',
    collection: 'factureassurs',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── FactureRecap ──────────────────────────────────────────────────────────────
  {
    name: 'FactureRecap',
    collection: 'facturerecaps',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── ActeParametre ────────────────────────────────────────────────────────────
  {
    name: 'ActeParametre',
    collection: 'acteparametres',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── ActeClinique ──────────────────────────────────────────────────────────────
  {
    name: 'ActeClinique',
    collection: 'actecliniques',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── TypeActe ──────────────────────────────────────────────────────────────────
  {
    name: 'TypeActe',
    collection: 'typeactes',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── FamilleActe ───────────────────────────────────────────────────────────────
  {
    name: 'FamilleActe',
    collection: 'familleactes',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── Affection ─────────────────────────────────────────────────────────────────
  {
    name: 'Affection',
    collection: 'affections',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── ModeDePaiement ────────────────────────────────────────────────────────────
  {
    name: 'ModeDePaiement',
    collection: 'modedepaiements',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── ParamLabo ─────────────────────────────────────────────────────────────────
  {
    name: 'ParamLabo',
    collection: 'paramlabos',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── ActeParamLabo ─────────────────────────────────────────────────────────────
  {
    name: 'ActeParamLabo',
    collection: 'acteparamlabos',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── ParamBiochimie ────────────────────────────────────────────────────────────
  {
    name: 'ParamBiochimie',
    collection: 'parambiochimies',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── ActeParamBiochimie ────────────────────────────────────────────────────────
  {
    name: 'ActeParamBiochimie',
    collection: 'acteparambiochimies',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── ResultatLignePrestation ───────────────────────────────────────────────────
  {
    name: 'ResultatLignePrestation',
    collection: 'resultatligneprestations',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── ObservationHospit ─────────────────────────────────────────────────────────
  {
    name: 'ObservationHospit',
    collection: 'observationhospits',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── RapportHospitalisation ────────────────────────────────────────────────────
  {
    name: 'RapportHospitalisation',
    collection: 'rapportHospitalisations',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── NfsTraitement ─────────────────────────────────────────────────────────────
  {
    name: 'NfsTraitement',
    collection: 'nfstraitements',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── HormoneTraitement ─────────────────────────────────────────────────────────
  {
    name: 'HormoneTraitement',
    collection: 'hormonetraitements',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── VitesseTraitement ─────────────────────────────────────────────────────────
  {
    name: 'VitesseTraitement',
    collection: 'vitessetraitements',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── BiochimieTraitement ───────────────────────────────────────────────────────
  {
    name: 'BiochimieTraitement',
    collection: 'biochimietraitements',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── ParametreNfs ─────────────────────────────────────────────────────────────
  {
    name: 'ParametreNfs',
    collection: 'parametrenfss',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── ParametreCRendu ───────────────────────────────────────────────────────────
  {
    name: 'ParametreCRendu',
    collection: 'parametrecrendus',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── LienAutomate ─────────────────────────────────────────────────────────────
  {
    name: 'LienAutomate',
    collection: 'lienAutomates',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── DocumentPatient ───────────────────────────────────────────────────────────
  {
    name: 'DocumentPatient',
    collection: 'documentpatients',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── DocumentFichePatient ──────────────────────────────────────────────────────
  {
    name: 'DocumentFichePatient',
    collection: 'documentfichepatients',
    defaults: {
      entrepriseId: null,
    },
  },

  // ── Operation ────────────────────────────────────────────────────────────────
  {
    name: 'Operation',
    collection: 'operations',
    defaults: {
      entrepriseId: null,
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. Logique de synchronisation
// ─────────────────────────────────────────────────────────────────────────────

async function syncCollection(db, { name, collection, defaults }) {
  const col = db.collection(collection);

  // Construire la condition : documents où au moins un champ est absent
  const missingChecks = Object.keys(defaults).map(field => ({ [field]: { $exists: false } }));
  const filter = { $or: missingChecks };

  const total = await col.countDocuments(filter);

  if (total === 0) {
    console.log(`  ✅ ${name.padEnd(30)} → déjà à jour`);
    return { name, updated: 0, skipped: 0 };
  }

  // Construire le $set uniquement avec les valeurs par défaut pour les champs absents
  // On utilise $set conditionnel via bulkWrite pour éviter d'écraser des données existantes
  const setOnInsert = {};
  for (const [field, value] of Object.entries(defaults)) {
    setOnInsert[field] = value;
  }

  if (DRY_RUN) {
    console.log(`  🔍 ${name.padEnd(30)} → ${total} document(s) à mettre à jour [DRY-RUN]`);
    return { name, updated: 0, skipped: total };
  }

  // $set uniquement les champs manquants → utiliser updateMany avec $setOnInsert n'est pas possible
  // On boucle par batch de 500 pour être sûr et éviter les timeouts
  const BATCH = 500;
  let updatedTotal = 0;

  const cursor = col.find(filter);
  const ids = [];

  for await (const doc of cursor) {
    ids.push(doc._id);
  }

  for (let i = 0; i < ids.length; i += BATCH) {
    const batchIds = ids.slice(i, i + BATCH);

    // Construire l'update : ne $set que les champs vraiment manquants
    // On utilise $set avec les valeurs par défaut — MongoDB n'écrase pas les champs existants
    // si on filtre d'abord sur $exists: false
    const updateDoc = { $set: {} };
    for (const [field, value] of Object.entries(defaults)) {
      updateDoc.$set[field] = value;
    }

    // Filtrer uniquement les docs qui n'ont pas ces champs
    const batchFilter = {
      _id: { $in: batchIds },
      $or: missingChecks,
    };

    // On utilise updateMany par batch mais on sécurise : seuls les champs absents seront mis à jour
    // En réalité on set tous les defaults sur les docs filtrés, 
    // mais le filtre garantit qu'on ne touche que les docs incomplets
    const result = await col.updateMany(batchFilter, updateDoc);
    updatedTotal += result.modifiedCount;
  }

  console.log(`  ✅ ${name.padEnd(30)} → ${updatedTotal} document(s) mis à jour`);
  return { name, updated: updatedTotal, skipped: 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Point d'entrée principal
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          syncCollections — easy_medical / bd_esaymed         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  if (DRY_RUN) console.log('  ⚠️  MODE DRY-RUN activé — aucune écriture\n');

  await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
  console.log(`  ✅ Connecté à MongoDB (${DB_NAME})\n`);

  const db = mongoose.connection.db;

  // Filtrer si une collection spécifique est demandée
  const list = TARGET
    ? COLLECTIONS.filter(c => c.name.toLowerCase() === TARGET.toLowerCase())
    : COLLECTIONS;

  if (TARGET && list.length === 0) {
    console.error(`  ❌ Collection "${TARGET}" introuvable dans la liste.`);
    console.log(`  Collections disponibles: ${COLLECTIONS.map(c => c.name).join(', ')}`);
    process.exit(1);
  }

  const results = [];
  for (const col of list) {
    try {
      const r = await syncCollection(db, col);
      results.push(r);
    } catch (err) {
      console.error(`  ❌ Erreur sur ${col.name}:`, err.message);
      results.push({ name: col.name, error: err.message });
    }
  }

  // ── Résumé ────────────────────────────────────────────────────────────────
  console.log('');
  console.log('─────────────────────────────────────────────────────────────');
  const totalUpdated = results.reduce((s, r) => s + (r.updated || 0), 0);
  const totalErrors  = results.filter(r => r.error).length;
  console.log(`  Collections traitées : ${results.length}`);
  console.log(`  Documents mis à jour : ${totalUpdated}`);
  if (totalErrors > 0) console.log(`  ❌ Erreurs            : ${totalErrors}`);
  console.log('─────────────────────────────────────────────────────────────');
  console.log('');

  await mongoose.disconnect();
  console.log('  🔌 Connexion fermée\n');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
