const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const mongoose = require('mongoose');
const { NextResponse } = require('next/server');

const root = path.resolve(__dirname, '..');
const uri = 'mongodb://127.0.0.1:27129/?replicaSet=admissionTest';
const sources = {
  Patient: 'patient', Consultation: 'consultation', Medecin: 'medecin',
  Assurance: 'assurance', SocieteAssurance: 'SocieteAssurance',
  Chambre: 'chambre', Lit: 'lit', AvisHospit: 'AvisHospit', TypeActe: 'TypeActe',
  ExamenHospitalisation: 'examenHospit', LignePrestation: 'lignePrestation',
  ActeClinique: 'acteclinique', TarifAssurance: 'tarifassurance',
  TarifSocieteAssurance: 'tarifsocieteassurance', PatientPrescription: 'PatientPrescription',
  MouvementHospitalisation: 'hospitalisation/MouvementHospitalisation',
  RapportHospitalisation: 'rapportHospitalisation',
};
const compile = filename => ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
require.extensions['.ts'] = (module, filename) => module._compile(compile(filename), filename);

async function main() {
  const admin = await mongoose.createConnection('mongodb://127.0.0.1:27129/?directConnection=true', { serverSelectionTimeoutMS: 5000 }).asPromise();
  try {
    await admin.db.admin().command({ replSetInitiate: { _id: 'admissionTest', members: [{ _id: 0, host: '127.0.0.1:27129' }] } });
  } catch (error) {
    if (error.codeName !== 'AlreadyInitialized') throw error;
  } finally {
    await admin.close();
  }
  const connection = await mongoose.createConnection(uri, {
    dbName: `admission_test_${new mongoose.Types.ObjectId()}`, serverSelectionTimeoutMS: 20000,
  }).asPromise();
  let failModel;
  let context = { connection, userObjectId: new mongoose.Types.ObjectId(), isSharedConnection: false };
  const models = {};
  try {
    for (const [name, source] of Object.entries(sources)) {
      require(path.join(root, 'models', `${source}.ts`));
      const schema = mongoose.models[name].schema.clone();
      schema.pre('save', function () {
        if (failModel === name) throw new Error(`Injected failure: ${name}`);
      });
      models[name] = connection.model(name, schema);
      await models[name].init();
    }
    const filename = path.join(root, 'app/api/hospitalisations/route.ts');
    const route = new Module(filename, module);
    route.filename = filename;
    route.paths = module.paths;
    route.require = id => {
      if (id === '@/lib/withTenant') return { withTenant: async () => context ? { context } : { context: null, response: NextResponse.json({}, { status: 401 }) } };
      if (id === '@/lib/tenantModels') return { getTenantModel: (conn, name) => conn.models[name] };
      return require(id);
    };
    route._compile(compile(filename), filename);
    const post = body => route.exports.POST({ json: async () => body });
    const fixture = async (patientFields = {}) => {
      const patient = await models.Patient.create({
        Nom: 'TEST', Prenoms: 'Admission', sexe: 'F', Age_partient: 30,
        Date_naisse: new Date('1996-01-01'), Code_dossier: `TEST-${new mongoose.Types.ObjectId()}`,
        ...patientFields,
      });
      const room = await models.Chambre.create({ numero: `TEST-${new mongoose.Types.ObjectId()}`, tarifJournalier: 10000, prixClinique: 10000 });
      const bed = await models.Lit.create({ numero: '1', chambreId: room._id });
      return { patient, room, bed, body: { patientId: String(patient._id), chambreId: String(room._id), litId: String(bed._id), typeVisiteur: 'non_assure' } };
    };
    const unchanged = async f => {
      assert.equal(await models.ExamenHospitalisation.countDocuments({ IdPatient: f.patient._id }), 0);
      assert.equal((await models.Lit.findById(f.bed._id)).etat, 'libre');
      assert.equal((await models.Chambre.findById(f.room._id)).etat, 'libre');
      assert.equal((await models.Patient.findById(f.patient._id)).admissionVersion, 0);
      assert.equal(await models.MouvementHospitalisation.countDocuments({ patientId: f.patient._id }), 0);
      assert.equal(await models.RapportHospitalisation.countDocuments({ patientId: String(f.patient._id) }), 0);
    };
    let passed = 0;
    const check = async (label, run) => { await run(); passed++; console.log(`OK ${label}`); };

    await check('admission directe, code autonome, auteur serveur et montants', async () => {
      const f = await fixture();
      const res = await post({ ...f.body, saisiPar: 'FORGED', montantChambre: 1 });
      assert.equal(res.status, 201);
      const stay = await res.json();
      assert.equal(stay.CodePrestation, `HOSP-${stay._id}`);
      assert.equal(stay.SaisiPar, String(context.userObjectId));
      assert.equal(stay.Montanttotal, 10000);
      assert.equal(stay.Restapayer, 10000);
      assert.equal((await models.Lit.findById(f.bed._id)).etat, 'occupe');
      const line = await models.LignePrestation.findOne({ idHospitalisation: stay._id });
      assert.equal(line.CodePrestation, stay.CodePrestation);
      assert.equal(await models.MouvementHospitalisation.countDocuments({ hospitalisationId: stay._id }), 1);
      assert.equal(await models.RapportHospitalisation.countDocuments({ hospitalisationId: stay._id }), 1);
    });
    for (const [field, value] of [
      ['patientId', 'bad'], ['litId', { $ne: null }], ['quantite', -1], ['quantite', 0],
      ['dureeHospit', 1.5], ['prixChambre', -10], ['prixChambre', 'Infinity'],
      ['taux', 101], ['taux', -1], ['dateEntree', 'invalid'], ['dateEntree', 12],
      ['dateSortie', '2026-11-12'], ['heureEntree', '25:12'], ['typeVisiteur', 'unknown'],
    ]) {
      await check(`validation ${field}=${JSON.stringify(value)}`, async () => {
        const f = await fixture();
        assert.equal((await post({ ...f.body, [field]: value })).status, 400);
        await unchanged(f);
      });
    }
    await check('lit et chambre incompatibles', async () => {
      const f = await fixture();
      const other = await fixture();
      assert.equal((await post({ ...f.body, chambreId: String(other.room._id) })).status, 409);
      await unchanged(f);
    });
    await check('chambre fermée', async () => {
      const f = await fixture();
      await models.Chambre.findByIdAndUpdate(f.room._id, { etat: 'fermee' });
      assert.equal((await post(f.body)).status, 409);
      assert.equal((await models.Lit.findById(f.bed._id)).etat, 'libre');
    });
    await check('consultation appartenant à un autre patient', async () => {
      const f = await fixture();
      const consultationId = new mongoose.Types.ObjectId();
      await models.Consultation.collection.insertOne({ _id: consultationId, IdPatient: new mongoose.Types.ObjectId(), CodePrestation: 'OTHER' });
      assert.equal((await post({ ...f.body, consultationId: String(consultationId) })).status, 400);
      await unchanged(f);
    });
    await check('avis annulé refusé', async () => {
      const f = await fixture();
      const avisId = new mongoose.Types.ObjectId();
      await models.AvisHospit.collection.insertOne({ _id: avisId, IDPARTIENT: f.patient._id, statut: 'annule' });
      assert.equal((await post({ ...f.body, avisHospitId: String(avisId) })).status, 409);
      await unchanged(f);
    });
    await check('admission depuis avis et consultation, identifiant de séjour distinct', async () => {
      const f = await fixture();
      const consultationId = new mongoose.Types.ObjectId();
      const avisId = new mongoose.Types.ObjectId();
      await models.Consultation.collection.insertOne({ _id: consultationId, IdPatient: f.patient._id, CodePrestation: `CONS-${consultationId}` });
      await models.AvisHospit.collection.insertOne({ _id: avisId, IDPARTIENT: f.patient._id, IDCONSULTATION: consultationId, statut: 'en_attente', DureHospit: '2' });
      const response = await post({ ...f.body, avisHospitId: String(avisId) });
      assert.equal(response.status, 201);
      const stay = await response.json();
      assert.equal(stay.consultationId, String(consultationId));
      assert.notEqual(stay.CodePrestation, `CONS-${consultationId}`);
      assert.equal(stay.Montanttotal, 20000);
      assert.equal((await models.AvisHospit.findById(avisId)).statut, 'admis');
    });
    for (const name of ['LignePrestation', 'MouvementHospitalisation', 'RapportHospitalisation']) {
      await check(`rollback complet après erreur ${name}`, async () => {
        const f = await fixture();
        failModel = name;
        let res;
        try { res = await post(f.body); } finally { failModel = undefined; }
        assert.equal(res.status, 500);
        await unchanged(f);
        assert.equal(await models.ActeClinique.countDocuments({ designationacte: `Chambre ${f.room.numero}` }), 0);
        assert.equal(await models.LignePrestation.countDocuments({ IdPatient: f.patient._id }), 0);
      });
    }
    await check('concurrence : deux patients sur le même lit', async () => {
      const f = await fixture();
      const other = await fixture();
      const responses = await Promise.all([post(f.body), post({ ...f.body, patientId: String(other.patient._id) })]);
      assert.deepEqual(responses.map(r => r.status).sort(), [201, 409]);
      assert.equal(await models.ExamenHospitalisation.countDocuments({ litId: f.bed._id, statutHospitalisation: 'en_cours' }), 1);
    });
    await check('concurrence : un patient dans deux lits', async () => {
      const f = await fixture();
      const other = await fixture();
      const responses = await Promise.all([post(f.body), post({ ...other.body, patientId: String(f.patient._id) })]);
      assert.deepEqual(responses.map(r => r.status).sort(), [201, 409]);
      assert.equal(await models.ExamenHospitalisation.countDocuments({ IdPatient: f.patient._id, statutHospitalisation: 'en_cours' }), 1);
      assert.equal(await models.Lit.countDocuments({ patientId: f.patient._id, etat: 'occupe' }), 1);
    });
    for (const surplus of [true, false]) {
      await check(`tarif société prioritaire, surplus=${surplus}`, async () => {
        const insurance = await models.Assurance.create({ designationassurance: `TEST-${new mongoose.Types.ObjectId()}`, codeassurance: String(new mongoose.Types.ObjectId()), telephone: '0', email: 'test@example.invalid', accepteSurplus: true });
        const company = await models.SocieteAssurance.create({ Assurance: insurance._id, accepteSurplus: surplus });
        const f = await fixture({ IDASSURANCE: insurance._id, IDSOCIETEASSURANCE: company._id, Taux: 80, TarifPatient: 'Mutualiste' });
        const act = await models.ActeClinique.create({ designationacte: `TEST-${new mongoose.Types.ObjectId()}`, lettreCle: 'CH', coefficient: 1, prixClinique: 10000, prixMutuel: 10000 });
        await models.Chambre.findByIdAndUpdate(f.room._id, { acteCliniqueId: act._id });
        await models.TarifAssurance.create({ acte: act.designationacte, acteId: act._id, lettreCle: 'CH', coefficient: 1, prixmutuel: 9000, assurance: insurance._id });
        await models.TarifSocieteAssurance.create({ acte: act.designationacte, acteId: act._id, lettreCle: 'CH', coefficient: 1, prixmutuel: 8000, assurance: insurance._id, societeAssurance: company._id });
        const response = await post({ ...f.body, typeVisiteur: 'assure', assuranceId: String(insurance._id) });
        assert.equal(response.status, 201);
        const stay = await response.json();
        assert.equal(stay.PartAssuranceP, 6400);
        assert.equal(stay.Montanttotal, surplus ? 10000 : 8000);
        assert.equal(stay.TotalReliquatPatient, surplus ? 2000 : 0);
        assert.equal(stay.Restapayer, surplus ? 3600 : 1600);
        assert.equal(stay.Partassure + stay.TotalReliquatPatient, stay.Restapayer);
        const line = await models.LignePrestation.findOne({ idHospitalisation: stay._id });
        assert.equal(line.montantTotalAPayer, stay.Restapayer);
      });
    }
    await check('assurance explicitement sélectionnée prise en compte', async () => {
      const insurance = await models.Assurance.create({ designationassurance: `TEST-${new mongoose.Types.ObjectId()}`, codeassurance: String(new mongoose.Types.ObjectId()), telephone: '0', email: 'test@example.invalid' });
      const f = await fixture();
      assert.equal((await post({ ...f.body, typeVisiteur: 'assure', assuranceId: String(insurance._id) })).status, 400);
      const response = await post({ ...f.body, typeVisiteur: 'assure', assuranceId: String(insurance._id), taux: 50 });
      assert.equal(response.status, 201);
      const stay = await response.json();
      assert.equal(stay.IDASSURANCE, String(insurance._id));
      assert.equal(stay.PartAssuranceP, 5000);
    });
    await check('authentification et isolation : aucune écriture sans contexte', async () => {
      const f = await fixture();
      const saved = context;
      context = null;
      try { assert.equal((await post(f.body)).status, 401); } finally { context = saved; }
      await unchanged(f);
    });
    await check('société et assurance incompatibles : rollback', async () => {
      const insurance = await models.Assurance.create({ designationassurance: `TEST-${new mongoose.Types.ObjectId()}`, codeassurance: String(new mongoose.Types.ObjectId()), telephone: '0', email: 'test@example.invalid' });
      const company = await models.SocieteAssurance.create({ Assurance: new mongoose.Types.ObjectId() });
      const f = await fixture();
      assert.equal((await post({ ...f.body, typeVisiteur: 'assure', assuranceId: String(insurance._id), societeAssuranceId: String(company._id), taux: 80 })).status, 400);
      await unchanged(f);
    });
    await check('échec des transactions : refus sans écriture', async () => {
      const f = await fixture();
      const startSession = connection.startSession;
      let ended = false;
      connection.startSession = async () => ({
        withTransaction: async () => { throw new Error('Transaction numbers are only allowed on a replica set member or mongos'); },
        endSession: async () => { ended = true; },
      });
      try {
        const response = await post(f.body);
        assert.equal(response.status, 503);
        assert.equal((await response.json()).code, 'TRANSACTIONS_REQUIRED');
        assert.equal(ended, true);
      } finally { connection.startSession = startSession; }
      await unchanged(f);
    });
    await check('base partagée : refus explicite sans écriture', async () => {
      const f = await fixture();
      const saved = context;
      context = { ...context, isSharedConnection: true, entrepriseId: String(new mongoose.Types.ObjectId()) };
      try { assert.equal((await post(f.body)).status, 503); } finally { context = saved; }
      await unchanged(f);
    });
    await check('isolation réelle : patient absent de la base du tenant courant', async () => {
      const f = await fixture();
      const otherConnection = await mongoose.createConnection(uri, { dbName: `admission_test_${new mongoose.Types.ObjectId()}` }).asPromise();
      const saved = context;
      try {
        for (const [name, model] of Object.entries(models)) {
          await otherConnection.model(name, model.schema.clone()).init();
        }
        context = { ...context, connection: otherConnection };
        assert.equal((await post(f.body)).status, 404);
        assert.equal(await otherConnection.models.ExamenHospitalisation.countDocuments(), 0);
      } finally {
        context = saved;
        await otherConnection.close();
      }
      await unchanged(f);
    });
    console.log(`${passed} tests réussis sur replica set local isolé : ${connection.name}`);
  } finally {
    await connection.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
