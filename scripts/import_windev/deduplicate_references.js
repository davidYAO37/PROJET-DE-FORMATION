const mongoose = require('mongoose');
const uri = process.argv[2] || process.env.MONGODB_URI;

const normalize = value => String(value || '').trim().toLocaleLowerCase('fr');

async function deduplicate(db, config) {
  const docs = await db.collection(config.collection).find({}).toArray();
  const groups = new Map();
  for (const doc of docs) {
    const fields = Array.isArray(config.key) ? config.key : [config.key];
    const key = fields.map(field => normalize(doc[field])).join('|');
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(doc);
  }

  let removed = 0;
  let updated = 0;
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const canonical = group.find(doc => doc.legacyId) || group[0];
    const duplicates = group.filter(doc => !doc._id.equals(canonical._id));
    const duplicateIds = duplicates.map(doc => doc._id);

    for (const ref of config.references) {
      const result = await db.collection(ref.collection).updateMany(
        { [ref.field]: { $in: duplicateIds } },
        { $set: { [ref.field]: canonical._id } },
      );
      updated += result.modifiedCount;
    }

    const result = await db.collection(config.collection).deleteMany({ _id: { $in: duplicateIds } });
    removed += result.deletedCount;
  }
  console.log(`${config.collection}: ${removed} doublon(s) supprimé(s), ${updated} référence(s) mise(s) à jour`);
}

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  await deduplicate(db, {
    collection: 'pharmacies', key: 'Designation',
    references: [{ collection: 'patientprescriptions', field: 'medicament' }],
  });
  await deduplicate(db, {
    collection: 'typeactes', key: 'Designation',
    references: [
      { collection: 'actecliniques', field: 'IDTYPE_ACTE' },
      { collection: 'ligneprestations', field: 'idTypeActe' },
    ],
  });
  await deduplicate(db, {
    collection: 'familleactes', key: 'Description',
    references: [
      { collection: 'actecliniques', field: 'IDFAMILLE_ACTE_BIOLOGIE' },
      { collection: 'ligneprestations', field: 'idFamilleActeBiologie' },
    ],
  });
  await deduplicate(db, {
    collection: 'societeassurances', key: 'Designation',
    references: [
      { collection: 'facturations', field: 'IDSOCIETEASSURANCE' },
      { collection: 'examenhospitalisations', field: 'IDSOCIETEASSURANCE' },
    ],
  });
  await deduplicate(db, {
    collection: 'societepartenaires', key: 'Designation',
    references: [{ collection: 'ligneprestations', field: 'IDSOCIETEPARTENAIRE' }],
  });
  await deduplicate(db, {
    collection: 'paramlabos', key: ['ParamAbrege', 'Param_designation'],
    references: [
      { collection: 'resultatligneprestations', field: 'IDPARAM_LABO' },
      { collection: 'acteparamlabos', field: 'IDPARAM_LABO' },
    ],
  });
  await deduplicate(db, {
    collection: 'parambiochimies', key: ['CodeB', 'LibelleB'],
    references: [{ collection: 'acteparambiochimies', field: 'IDPARAM_BIOCHIME' }],
  });
  await deduplicate(db, {
    collection: 'parametrenfs', key: ['PARAMETRE', 'DESCRIPTION'], references: [],
  });
  await deduplicate(db, {
    collection: 'modedepaiements', key: 'Modepaiement', references: [],
  });
  await deduplicate(db, {
    collection: 'operations', key: ['Libeleo', 'TYPEOP'], references: [],
  });
  await deduplicate(db, {
    collection: 'parametrecrendus', key: ['LettreCle', 'Date'], references: [],
  });

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
