const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const net = require('node:net');
const { spawn } = require('node:child_process');
const Module = require('node:module');
const ts = require('typescript');
const mongoose = require('mongoose');
const { NextResponse } = require('next/server');
const root = path.resolve(__dirname, '..');
const compile = filename => ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
require.extensions['.ts'] = (mod, filename) => mod._compile(compile(filename), filename);
const listen = server => new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

async function main() {
  const probe = net.createServer();
  await listen(probe);
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const dbpath = fs.mkdtempSync(path.join(os.tmpdir(), 'easy-medical-nfs-test-'));
  const mongod = spawn(process.env.NFS_TEST_MONGOD || 'mongod', ['--dbpath', dbpath, '--port', String(port), '--bind_ip', '127.0.0.1'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let startupError;
  mongod.on('error', error => { startupError = error; });
  mongod.stdout.resume();
  mongod.stderr.resume();
  const connections = [];
  const payloads = new Map();
  const requests = [];
  const server = http.createServer((req, res) => {
    requests.push(req.url);
    const fixture = payloads.get(req.url) || { status: 200, data: [] };
    res.writeHead(fixture.status || 200, { 'Content-Type': 'application/json' });
    res.end(fixture.raw ?? JSON.stringify(fixture.data));
  });
  try {
    let primary;
    for (let i = 0; i < 50; i++) {
      if (startupError) throw startupError;
      const conn = mongoose.createConnection(`mongodb://127.0.0.1:${port}/nfs_test_shared`, { serverSelectionTimeoutMS: 200 });
      try { primary = await conn.asPromise(); break; }
      catch { await conn.close().catch(() => {}); await new Promise(r => setTimeout(r, 100)); }
    }
    assert.ok(primary, 'MongoDB local de test indisponible');
    connections.push(primary);
    for (const name of ['a', 'b']) connections.push(await mongoose.createConnection(`mongodb://127.0.0.1:${port}/nfs_test_${name}`).asPromise());
    const sources = { NfsTraitement: 'nfsTraitement', ParametreNfs: 'parametreNfs', ActeClinique: 'acteclinique', LienAutomate: 'lienAutomate', HormoneTraitement: 'HormoneTraitement', VitesseTraitement: 'VitesseTraitement', BiochimieTraitement: 'BiochimieTraitement', ParamBiochimie: 'paramBiochimie', FamilleActe: 'familleActe', ActeParamBiochimie: 'acteParamBiochimie', ActeParamLabo: 'acteParamLabo' };
    for (const [name, source] of Object.entries(sources)) {
      require(path.join(root, 'models', `${source}.ts`));
      for (const conn of connections) await conn.model(name, mongoose.models[name].schema.clone()).init();
    }
    const tenants = new Map();
    const filter = context => context.isSharedConnection ? { entrepriseId: context.entrepriseId } : {};
    const load = relative => {
      const filename = path.join(root, relative);
      const mod = new Module(filename, module);
      mod.filename = filename;
      mod.paths = module.paths;
      mod.require = id => {
        if (id === '@/lib/tenantModels') return { getTenantModel: (conn, name) => conn.models[name] };
        if (id === '@/lib/withTenant') return { getTenantFilter: filter, withTenant: async req => req.context ? { context: req.context } : { context: null, response: NextResponse.json({}, { status: 401 }) } };
        if (id === '@/lib/tenantDb') return { getPrimaryConnection: async () => primary, getTenantConnection: async id => tenants.get(String(id)).connection };
        if (id === '@/db/mongoConnect') return { db: async () => {} };
        if (id === '@/models/entreprise') return { Entreprise: { findById: id => ({ lean: async () => tenants.has(String(id)) ? { _id: String(id), cleConnect: `test-key-${id}` } : null }) } };
        if (id === '@/lib/nfsImportService') return service;
        if (id === '@/lib/automateImportService') return automateService;
        if (id === '@/lib/automatePull') return automatePull;
        return require(id);
      };
      mod._compile(compile(filename), filename);
      return mod.exports;
    };
    const service = load('lib/nfsImportService.ts');
    const automateService = load('lib/automateImportService.ts');
    const automatePull = load('lib/automatePull.ts');
    const pull = load('app/api/automates/nfs/import/route.ts');
    const push = load('app/api/automates/connect/route.ts');
    const links = load('app/api/automates/lienAutomate/route.ts');
    const history = load('app/api/automates/historique/route.ts');
    await listen(server);
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const [id, connection] of [['shared-a', primary], ['shared-b', primary], ['dedicated-a', connections[1]], ['dedicated-b', connections[2]]]) {
      const context = { entrepriseId: id, connection, isSharedConnection: connection === primary };
      tenants.set(id, context);
      if (await connection.models.ParametreNfs.countDocuments() === 0) await connection.models.ParametreNfs.create({ PARAMETRE: 'WBC', DESCRIPTION: 'LEUCOCYTES' });
      const response = await links.POST({ context, json: async () => ({ nLienNFS: `${base}/${id}` }) });
      assert.equal(response.status, 201);
    }
    const row = (id, extra = {}) => ({ id, parametres: 'WBC', resultat: '5.2', idNfs: `NFS-${id}`, idEchantillon: `ECH-${id}`, dateAnalyse: '2026-11-26T10:00:00Z', nom: 'TEST', prenom: 'NFS', ...extra });
    const receive = (tenant, data) => { payloads.set(`/${tenant}`, { data }); return pull.POST({ context: tenants.get(tenant) }); };
    const send = (tenant, lignes, key = `test-key-${tenant}`) => push.POST({ headers: new Headers({ 'x-connect-key': key }), json: async () => ({ entrepriseId: tenant, famille: 'nfs', lignes }) });
    let passed = 0;
    const check = async (label, run) => { await run(); passed++; console.log(`OK ${label}`); };
    const count = tenant => { const c = tenants.get(tenant); return c.connection.models.NfsTraitement.countDocuments({ entrepriseId: tenant }); };
    await check('liens Easy Connect distincts sur base partagee', async () => {
      for (const tenant of ['shared-a', 'shared-b']) {
        const body = await (await links.GET({ context: tenants.get(tenant) })).json();
        assert.equal(body.data.nLienNFS, `${base}/${tenant}`);
      }
    });
    await check('reception pull puis reimport sans doublon', async () => {
      assert.equal((await (await receive('shared-a', [row(1)])).json()).importes, 1);
      const body = await (await receive('shared-a', [row(1)])).json();
      assert.equal(body.importes, 0); assert.equal(body.dejaImportes, 1); assert.equal(await count('shared-a'), 1);
    });
    await check('push apres pull : meme cle de reception', async () => {
      const body = await (await send('shared-a', [row(1)])).json();
      assert.equal(body.importes, 0); assert.equal(body.dejaImportes, 1);
    });
    await check('pull apres push : meme cle de reception', async () => {
      assert.equal((await (await send('shared-a', [row(2)])).json()).importes, 1);
      assert.equal((await (await receive('shared-a', [row(2)])).json()).dejaImportes, 1);
    });
    await check('meme identifiant chez deux tenants partages : deux resultats isoles', async () => {
      assert.equal((await (await send('shared-b', [row(1, { resultat: '9' })])).json()).importes, 1);
      assert.equal(await count('shared-b'), 1);
      const body = await (await history.GET({ context: tenants.get('shared-b') })).json();
      assert.equal(body.nfs.total, 1); assert.equal(body.nfs.data[0].NFS_resultat, '9');
    });
    await check('connexions dediees : chaque tenant interroge son Easy Connect', async () => {
      for (const tenant of ['dedicated-a', 'dedicated-b']) {
        assert.equal((await (await receive(tenant, [row(1)])).json()).importes, 1);
        assert.equal(await count(tenant), 1); assert.equal(requests.at(-1), `/${tenant}`);
      }
    });
    await check('20 pushes concurrents : une seule insertion', async () => {
      const responses = await Promise.all(Array.from({ length: 20 }, () => send('shared-a', [row(100)])));
      const bodies = await Promise.all(responses.map(async res => { assert.equal(res.status, 200); return res.json(); }));
      assert.equal(bodies.reduce((n, b) => n + b.importes, 0), 1);
      assert.equal(bodies.reduce((n, b) => n + b.dejaImportes, 0), 19);
    });
    await check('doublons dans un meme lot', async () => {
      const body = await (await send('shared-a', [row(101), row(101)])).json();
      assert.equal(body.importes, 1); assert.equal(body.dejaImportes, 1);
    });
    await check('resultat utilise non ecrase par une retransmission', async () => {
      await primary.models.NfsTraitement.updateOne({ entrepriseId: 'shared-a', NFS_id: 1 }, { $set: { DejaUtilise: true } });
      await send('shared-a', [row(1, { resultat: '99' })]);
      const doc = await primary.models.NfsTraitement.findOne({ entrepriseId: 'shared-a', NFS_id: 1 });
      assert.equal(doc.NFS_resultat, '5.2'); assert.equal(doc.DejaUtilise, true);
    });
    await check('ancien resultat avec ObjectId aleatoire reconnu', async () => {
      await primary.models.NfsTraitement.create({ entrepriseId: 'shared-a', NFS_id: 200, NFS_parametres: 'LEUCOCYTES', NFS_resultat: '4' });
      assert.equal((await (await send('shared-a', [row(200)])).json()).dejaImportes, 1);
    });
    await check('normalisation code et identifiant numerique', async () => {
      assert.equal((await (await send('shared-a', [row('1', { parametres: ' wbc ' })])).json()).dejaImportes, 1);
    });
    await check('description modifiee : pas de reimport', async () => {
      await primary.models.ParametreNfs.updateOne({ PARAMETRE: 'WBC' }, { $set: { DESCRIPTION: 'LEUCOCYTES RENOMMES' } });
      assert.equal((await (await send('shared-a', [row(1)])).json()).dejaImportes, 1);
      await primary.models.ParametreNfs.updateOne({ PARAMETRE: 'WBC' }, { $set: { DESCRIPTION: 'LEUCOCYTES' } });
    });
    for (const [label, data, status] of [
      ['parametre inconnu', [row(300), row(301, { parametres: 'UNKNOWN' })], 422],
      ['identifiant absent', [row(300), row(undefined)], 422],
      ['identifiant objet', [row({ $ne: null })], 422],
      ['date invalide', [row(300), row(301, { dateAnalyse: 'bad' })], 422],
      ['champ trop long', [row(300, { nom: 'X'.repeat(100) })], 422],
      ['element null', [null], 502],
      ['tableau absent', { data: [] }, 502],
    ]) await check(`refus ${label}, aucune ecriture`, async () => {
      const before = await count('shared-a');
      assert.equal((await send('shared-a', data)).status, label === 'tableau absent' ? 400 : status);
      assert.equal(await count('shared-a'), before);
    });
    await check('lot vide : 0%, historique conserve', async () => {
      const before = await count('shared-a'); const body = await (await receive('shared-a', [])).json();
      assert.equal(body.progression, 0); assert.equal(await count('shared-a'), before);
    });
    await check('JSON et HTTP invalides conservant historique', async () => {
      const before = await count('shared-a');
      for (const fixture of [{ raw: 'bad' }, { status: 500, data: [] }]) {
        payloads.set('/shared-a', fixture);
        assert.equal((await pull.POST({ context: tenants.get('shared-a') })).status, 502);
      }
      assert.equal(await count('shared-a'), before);
    });
    await check('cle du tenant A refusee pour B', async () => {
      assert.equal((await send('shared-b', [row(999)], 'test-key-shared-a')).status, 401);
      assert.equal(await primary.models.NfsTraitement.countDocuments({ NFS_id: 999 }), 0);
    });
    await check('panne au milieu du lot puis reprise sans doublon', async () => {
      const Nfs = primary.models.NfsTraitement;
      const original = Nfs.updateOne;
      Nfs.updateOne = function (query, update, options) {
        if (update.$setOnInsert.NFS_id === 402) throw new Error('Injected database failure');
        return original.call(this, query, update, options);
      };
      try {
        await assert.rejects(service.importerNfs(primary, 'shared-a', { entrepriseId: 'shared-a' }, [row(401), row(402)]), /Injected database failure/);
      } finally { Nfs.updateOne = original; }
      const body = await (await send('shared-a', [row(401), row(402)])).json();
      assert.equal(body.importes, 1); assert.equal(body.dejaImportes, 1);
    });
    await check('pull et push simultanes : une seule reception', async () => {
      const responses = await Promise.all([receive('shared-a', [row(500)]), send('shared-a', [row(500)])]);
      const bodies = await Promise.all(responses.map(res => res.json()));
      assert.equal(bodies.reduce((n, b) => n + b.importes, 0), 1);
      assert.equal(bodies.reduce((n, b) => n + b.dejaImportes, 0), 1);
    });
    await check('mise a jour du lien A sans modifier B', async () => {
      const context = tenants.get('shared-a');
      assert.equal((await links.POST({ context, json: async () => ({ nLienNFS: `${base}/shared-a-updated` }) })).status, 200);
      const body = await (await links.GET({ context: tenants.get('shared-b') })).json();
      assert.equal(body.data.nLienNFS, `${base}/shared-b`);
    });
    await check('sans authentification : pull et historique refuses', async () => {
      assert.equal((await pull.POST({})).status, 401); assert.equal((await history.GET({})).status, 401);
    });
    const families = [
      { famille: 'hormones', route: 'hormones', model: 'HormoneTraitement', link: 'LienHormone', id: 'id', code: 'article', mapped: 'TSH', result: 'resultathor', sourceId: 'Id', sourceCode: 'Article', sourceResult: 'Resultat', date: 'DateHormone', row: id => ({ Id: id, Article: 'TSH', Resultat: '2.3', DateHormone: '2026-11-26T10:00:00Z', NumPatient: 'DOS-TEST', Echantillon: 'ECH-TEST', Plage: '0.4-4', Unite: 'mIU/L' }) },
      { famille: 'vs', route: 'vs', model: 'VitesseTraitement', link: 'LienVS', id: 'id', code: 'parametres', mapped: '1ERE HEURE', result: 'resultat', sourceId: 'id', sourceCode: 'parametres', sourceResult: 'resultat', date: 'dateVitesse', row: id => ({ id, parametres: 'Vs(18°)', resultat: '12\\flag', dateVitesse: '2026-11-26T10:00:00Z', numDossier: 'DOS-TEST', unite: 'mm' }) },
      { famille: 'biochimie', route: 'biochimies', model: 'BiochimieTraitement', link: 'LienBiochimie', id: 'id_biochimie', code: 'chim', mapped: 'GLYCEMIE', result: 'resultat', sourceId: 'id', sourceCode: 'chim', sourceResult: 'resultat', date: 'date_analyse', row: id => ({ id, chim: 'GLU', resultat: '0.9', date_analyse: '2026-11-26T10:00:00Z', idPatient: 'DOS-TEST', idEchantillon: 'ECH-TEST', plage: '0.7-1.1', unite: 'g/L' }) },
    ];
    for (const conn of connections) await conn.models.ParamBiochimie.create({ CodeB: 'GLU', LibelleB: 'GLYCEMIE' });
    for (const f of families) {
      const route = load(`app/api/automates/${f.route}/import/route.ts`);
      const model = primary.models[f.model];
      const run = (label, fn) => check(`${f.famille} : ${label}`, fn);
      const sendFamily = (tenant, lignes, key = `test-key-${tenant}`) => push.POST({ headers: new Headers({ 'x-connect-key': key }), json: async () => ({ entrepriseId: tenant, famille: f.famille, lignes }) });
      const receiveFamily = (tenant, data) => { payloads.set(`/${tenant}/${f.famille}`, { data }); return route.POST({ context: tenants.get(tenant) }); };
      const familyCount = tenant => tenants.get(tenant).connection.models[f.model].countDocuments({ entrepriseId: tenant });
      for (const [tenant, context] of tenants) await context.connection.models.LienAutomate.updateOne(filter(context), { $set: { [f.link]: `${base}/${tenant}/${f.famille}` } });
      await run('pull et reimport sans doublon', async () => {
        assert.equal((await (await receiveFamily('shared-a', [f.row(1)])).json()).importes, 1);
        const body = await (await receiveFamily('shared-a', [f.row(1)])).json();
        assert.equal(body.importes, 0); assert.equal(body.dejaImportes, 1); assert.equal(await familyCount('shared-a'), 1);
      });
      await run('push apres pull et pull apres push', async () => {
        assert.equal((await (await sendFamily('shared-a', [f.row(1)])).json()).dejaImportes, 1);
        assert.equal((await (await sendFamily('shared-a', [f.row(2)])).json()).importes, 1);
        assert.equal((await (await receiveFamily('shared-a', [f.row(2)])).json()).dejaImportes, 1);
      });
      await run('tenants partages et historiques isoles', async () => {
        const response = await sendFamily('shared-b', [{ ...f.row(1), [f.sourceResult]: '99' }]);
        assert.equal(response.status, 200);
        assert.equal((await response.json()).importes, 1);
        const body = await (await history.GET({ context: tenants.get('shared-b') })).json();
        assert.equal(body[f.famille].total, 1); assert.equal(body[f.famille].data[0][f.result], '99');
      });
      await run('tenants dedies avec leur propre Easy Connect', async () => {
        for (const tenant of ['dedicated-a', 'dedicated-b']) {
          assert.equal((await (await receiveFamily(tenant, [f.row(1)])).json()).importes, 1);
          assert.equal(await familyCount(tenant), 1); assert.equal(requests.at(-1), `/${tenant}/${f.famille}`);
        }
      });
      await run('20 receptions concurrentes, une insertion', async () => {
        const responses = await Promise.all(Array.from({ length: 20 }, () => sendFamily('shared-a', [f.row(100)])));
        const bodies = await Promise.all(responses.map(async res => { assert.equal(res.status, 200); return res.json(); }));
        assert.equal(bodies.reduce((n, b) => n + b.importes, 0), 1); assert.equal(bodies.reduce((n, b) => n + b.dejaImportes, 0), 19);
      });
      await run('reception pull et push simultanee', async () => {
        const responses = await Promise.all([receiveFamily('shared-a', [f.row(101)]), sendFamily('shared-a', [f.row(101)])]);
        const bodies = await Promise.all(responses.map(res => res.json()));
        assert.equal(bodies.reduce((n, b) => n + b.importes, 0), 1); assert.equal(bodies.reduce((n, b) => n + b.dejaImportes, 0), 1);
      });
      await run('doublon dans le meme lot', async () => {
        const body = await (await sendFamily('shared-a', [f.row(102), f.row(102)])).json();
        assert.equal(body.importes, 1); assert.equal(body.dejaImportes, 1);
      });
      await run('resultat existant non ecrase', async () => {
        const before = await model.findOne({ entrepriseId: 'shared-a', [f.id]: '1' }).lean();
        if (f.famille !== 'biochimie') await model.updateOne({ _id: before._id }, { $set: { DejaUtilise: true } });
        await sendFamily('shared-a', [{ ...f.row(1), [f.sourceResult]: '999' }]);
        const after = await model.findById(before._id).lean();
        assert.equal(after[f.result], before[f.result]);
        if (f.famille !== 'biochimie') assert.equal(after.DejaUtilise, true);
      });
      await run('compatibilite anciens resultats', async () => {
        await model.create({ entrepriseId: 'shared-a', [f.id]: '200', [f.code]: f.mapped, [f.result]: '8' });
        assert.equal((await (await sendFamily('shared-a', [f.row(200)])).json()).dejaImportes, 1);
      });
      await run('normalisation du code', async () => {
        const body = await (await sendFamily('shared-a', [{ ...f.row('1'), [f.sourceCode]: ` ${f.row(1)[f.sourceCode].toLowerCase()} ` }])).json();
        assert.equal(body.dejaImportes, 1);
      });
      for (const [label, invalid, status] of [
        ['identifiant absent', { ...f.row(301), [f.sourceId]: undefined }, 422],
        ['identifiant objet', { ...f.row(301), [f.sourceId]: { $ne: null } }, 422],
        ['parametre absent', { ...f.row(301), [f.sourceCode]: '' }, 422],
        ['date invalide', { ...f.row(301), [f.date]: 'bad' }, 422],
        ['resultat absent', { ...f.row(301), [f.sourceResult]: undefined }, 422],
        ['ligne null', null, 502],
      ]) await run(`refus ${label} avant toute ecriture`, async () => {
        const before = await familyCount('shared-a');
        assert.equal((await sendFamily('shared-a', [f.row(300), invalid])).status, status);
        assert.equal(await familyCount('shared-a'), before);
      });
      await run('lot vide et erreurs HTTP/JSON sans effacer historique', async () => {
        const before = await familyCount('shared-a');
        assert.equal((await (await receiveFamily('shared-a', [])).json()).progression, 0);
        for (const fixture of [{ raw: '' }, { raw: 'bad' }, { status: 500, data: [] }, { data: {} }]) {
          payloads.set(`/shared-a/${f.famille}`, fixture);
          assert.equal((await route.POST({ context: tenants.get('shared-a') })).status, fixture.raw === '' ? 200 : 502);
        }
        assert.equal(await familyCount('shared-a'), before);
      });
      await run('cle tenant A refusee pour B', async () => {
        assert.equal((await sendFamily('shared-b', [f.row(999)], 'test-key-shared-a')).status, 401);
        assert.equal(await model.countDocuments({ [f.id]: '999' }), 0);
      });
      await run('valeur zero conservee', async () => {
        const response = await sendFamily('shared-a', [{ ...f.row(400), [f.sourceResult]: 0 }]);
        assert.equal(response.status, 200);
        assert.equal((await model.findOne({ entrepriseId: 'shared-a', [f.id]: '400' }))[f.result], '0');
      });
      await run('panne au milieu du lot puis reprise sans doublon', async () => {
        const original = model.updateOne;
        model.updateOne = function (query, update, options) {
          if (update.$setOnInsert[f.id] === '402') throw new Error('Injected database failure');
          return original.call(this, query, update, options);
        };
        try {
          await assert.rejects(automateService.importerAutomate(primary, 'shared-a', { entrepriseId: 'shared-a' }, f.famille, [f.row(401), f.row(402)]), /Injected database failure/);
        } finally { model.updateOne = original; }
        const body = await (await sendFamily('shared-a', [f.row(401), f.row(402)])).json();
        assert.equal(body.importes, 1); assert.equal(body.dejaImportes, 1);
      });
      await run('deux parametres pour un meme identifiant restent distincts', async () => {
        const otherCode = f.famille === 'hormones' ? 'PSA' : f.famille === 'vs' ? 'KATZ' : 'CREA';
        const body = await (await sendFamily('shared-a', [f.row(450), { ...f.row(450), [f.sourceCode]: otherCode }])).json();
        assert.equal(body.importes, 2); assert.equal(await model.countDocuments({ entrepriseId: 'shared-a', [f.id]: '450' }), 2);
      });
      if (f.famille === 'vs') await run('parametre inconnu refuse sans ignorer silencieusement', async () => {
        const before = await familyCount('shared-a');
        assert.equal((await sendFamily('shared-a', [f.row(460), { ...f.row(461), parametres: 'UNKNOWN' }])).status, 422);
        assert.equal(await familyCount('shared-a'), before);
      });
      if (f.famille === 'biochimie') {
        await run('idBiochimie pull et id push identifient le meme resultat', async () => {
          const legacyFormat = { ...f.row(470), idBiochimie: 470 }; delete legacyFormat.id;
          assert.equal((await (await receiveFamily('shared-a', [legacyFormat])).json()).importes, 1);
          assert.equal((await (await sendFamily('shared-a', [f.row(470)])).json()).dejaImportes, 1);
        });
        await run('identifiants contradictoires refuses', async () => {
          assert.equal((await sendFamily('shared-a', [{ ...f.row(471), idBiochimie: 472 }])).status, 422);
          assert.equal(await model.countDocuments({ entrepriseId: 'shared-a', id_biochimie: { $in: ['471', '472'] } }), 0);
        });
        await run('changement de libelle sans reimport', async () => {
          await primary.models.ParamBiochimie.updateOne({ CodeB: 'GLU' }, { $set: { LibelleB: 'GLYCEMIE RENOMMEE' } });
          assert.equal((await (await sendFamily('shared-a', [f.row(1)])).json()).dejaImportes, 1);
          await primary.models.ParamBiochimie.updateOne({ CodeB: 'GLU' }, { $set: { LibelleB: 'GLYCEMIE' } });
        });
      }
      await run('sans authentification ou sans tenant', async () => {
        assert.equal((await route.POST({})).status, 401);
        assert.equal((await route.POST({ context: { connection: primary, isSharedConnection: true } })).status, 403);
      });
    }
    const labo = load('app/api/laboratoire/automate/resultats/route.ts');
    for (const f of [
      { model: 'NfsTraitement', code: 'NFS_parametres', parametre: 'LEUCOCYTES', result: 'NFS_resultat', prestation: 'NUMERATION FORMULE SANGUINE (NFS)' },
      { model: 'VitesseTraitement', code: 'parametres', parametre: '1ERE HEURE', result: 'resultat', prestation: 'VITESSE DE SEDIMENTATION' },
      { model: 'HormoneTraitement', code: 'article', parametre: 'TSH', result: 'resultathor', prestation: 'TSH' },
      { model: 'BiochimieTraitement', code: 'chim', parametre: 'GLYCEMIE', result: 'resultat', prestation: 'GLYCEMIE' },
    ]) await check(`lecture laboratoire ${f.model} isolee entre tenants`, async () => {
      const code = `ISO-${f.model}`;
      const idActe = new mongoose.Types.ObjectId();
      if (f.model === 'BiochimieTraitement') await primary.models.ActeParamBiochimie.create({ IDACTEP: idActe, IDPARAM_BIOCHIME: new mongoose.Types.ObjectId(), param_designb: 'GLYCEMIE' });
      for (const [tenant, value] of [['shared-a', '11'], ['shared-b', '99']]) await primary.models[f.model].create({ entrepriseId: tenant, CodePrestation: code, id_patient: code, [f.code]: f.parametre, [f.result]: value });
      const response = await labo.POST({ context: tenants.get('shared-a'), json: async () => ({ prestation: f.prestation, idHospitalisation: code, idActe: String(idActe), lignePrestationId: String(new mongoose.Types.ObjectId()) }) });
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.success, true); assert.equal(body.parametres.length, 1); assert.equal(body.parametres[0].ChampResultat, '11');
    });
    await check('actualiser tout : bilan global fiable en succes et echec partiel', async () => {
      const actualiser = load('app/api/automates/actualiser-tout/route.ts');
      const routes = new Map([['/api/automates/nfs/import', pull], ...families.map(f => [`/api/automates/${f.route}/import`, load(`app/api/automates/${f.route}/import/route.ts`)])]);
      for (const endpoint of ['/shared-a-updated', ...families.map(f => `/shared-a/${f.famille}`)]) payloads.set(endpoint, { data: [] });
      const originalFetch = global.fetch;
      let failVs = false;
      global.fetch = async (url, options) => {
        const pathname = new URL(url).pathname;
        if (!routes.has(pathname)) return originalFetch(url, options);
        assert.equal(options.headers.cookie, 'test-session=only-test');
        if (failVs && pathname === '/api/automates/vs/import') return NextResponse.json({ success: false, message: 'VS indisponible' }, { status: 503 });
        return routes.get(pathname).POST({ context: tenants.get('shared-a') });
      };
      try {
        const request = { headers: new Headers({ cookie: 'test-session=only-test' }), nextUrl: { origin: base } };
        let body = await (await actualiser.POST(request)).json();
        assert.equal(body.success, true);
        assert.equal(Object.keys(body.resultat).length, 4);
        failVs = true;
        body = await (await actualiser.POST(request)).json();
        assert.equal(body.success, false); assert.match(body.message, /incomplète/);
        assert.equal(body.resultat.vs.success, false); assert.equal(body.resultat.hormones.success, true);
      } finally { global.fetch = originalFetch; }
    });
    console.log(`${passed} tests reussis avec MongoDB et HTTP locaux isoles. Donnees de test conservees : ${dbpath}`);
  } finally {
    await Promise.all(connections.map(conn => conn.close()));
    await new Promise(resolve => server.listening ? server.close(resolve) : resolve());
    mongod.kill();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
