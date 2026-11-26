const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const ts = require('typescript');

async function verifier(page, ui) {
  const initial = await ui.snapshot();
  assert.match(initial, /RESULTAT HORMONES/);
  const titres = { nfs: 'NFS', hormones: 'Hormones', vs: 'VS', biochimie: 'Biochimie' };
  const labels = { nfs: 'RESULTAT NFS', hormones: 'RESULTAT HORMONES', vs: 'RESULTAT VS', biochimie: 'BIOCHIMIE' };
  const records = {
    nfs: { _id: 'n', PatientP: 'TEST NFS', Patient_numDossier: 'DOS-N', NFS_parametres: 'LEUCOCYTES', NFS_resultat: '5.2' },
    hormones: { _id: 'h', numPatient: 'DOS-H', article: 'TSH', resultathor: '2.3', unitehorm: 'mIU/L' },
    vs: { _id: 'v', CodePrestation: 'DOS-V', parametres: '1ERE HEURE', resultat: '12', unite: 'mm' },
    biochimie: { _id: 'b', CodePrestation: 'ECH-B', id_patient: 'DOS-B', chim: 'GLYCEMIE', resultat: '0.9', unite: 'g/L' },
  };
  const historique = Object.fromEntries(Object.keys(titres).map(k => [k, { total: 0, data: [] }]));
  const dialogs = [];
  const calls = [];
  let emptyHormones = false;
  let failVs = false;
  page.on('dialog', async dialog => { dialogs.push({ type: dialog.type(), message: dialog.message() }); await dialog.accept(); });
  const bilan = key => {
    const already = historique[key].total;
    if (key === 'hormones' && emptyHormones) return { success: true, progression: 0, importes: 0, dejaImportes: 0, message: 'Aucun résultat Hormones disponible ; historique conservé' };
    historique[key] = { total: 1, data: [records[key]] };
    return { success: true, progression: 100, importes: already ? 0 : 1, dejaImportes: already ? 1 : 0, message: `${titres[key]} : ${already ? 0 : 1} nouveau(x) résultat(s), ${already ? 1 : 0} déjà reçu(s). Historique conservé.` };
  };
  await page.route('**/api/automates/**', async route => {
    const pathname = new URL(route.request().url()).pathname;
    calls.push(pathname);
    let body;
    if (pathname.endsWith('/historique')) body = { success: true, ...historique };
    else if (pathname.endsWith('/actualiser-tout')) {
      const resultat = Object.fromEntries(Object.keys(titres).map(k => [k, k === 'vs' && failVs ? { success: false, message: 'VS indisponible' } : bilan(k)]));
      body = { success: !failVs, message: failVs ? 'Actualisation incomplète : certains automates ont échoué' : 'Tous les automates ont été actualisés', resultat };
    } else {
      const key = pathname.includes('/biochimies/') ? 'biochimie' : pathname.split('/')[3];
      assert.ok(titres[key], pathname);
      body = bilan(key);
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  const clickAndAlert = async click => {
    const alert = page.waitForEvent('dialog', { predicate: d => d.type() === 'alert' });
    await click();
    await alert;
  };
  for (const key of Object.keys(titres)) {
    await ui.snapshot();
    const before = calls.filter(c => c.endsWith('/historique')).length;
    await clickAndAlert(() => page.getByRole('button', { name: labels[key], exact: true }).click());
    assert.equal(calls.filter(c => c.endsWith('/historique')).length, before + 1);
  }
  await page.getByRole('button', { name: 'Historique téléchargement' }).click();
  for (const key of Object.keys(titres)) {
    await page.getByRole('button', { name: `${titres[key]} (1)`, exact: true }).click();
    const rows = page.getByRole('dialog').locator('tbody tr');
    await rows.first().waitFor();
    assert.equal(await rows.count(), 1);
  }
  await page.getByRole('button', { name: 'Fermer', exact: true }).click();
  await clickAndAlert(() => page.getByRole('button', { name: labels.hormones, exact: true }).click());
  assert.match(dialogs.at(-1).message, /0 nouveau.*1 déjà reçu/);
  emptyHormones = true;
  await clickAndAlert(() => page.getByRole('button', { name: labels.hormones, exact: true }).click());
  await page.waitForFunction(() => document.querySelectorAll('[role="progressbar"]')[1]?.getAttribute('aria-valuenow') === '0');
  assert.equal(historique.hormones.total, 1);
  const before = dialogs.filter(d => d.type === 'confirm').length;
  await clickAndAlert(() => page.getByText('Actualiser tous les résultats ici', { exact: false }).click());
  assert.equal(dialogs.filter(d => d.type === 'confirm').length, before + 1);
  failVs = true;
  await clickAndAlert(() => page.getByText('Actualiser tous les résultats ici', { exact: false }).click());
  assert.match(dialogs.at(-1).message, /Actualisation incomplète/);
  assert.match(dialogs.at(-1).message, /VS indisponible/);
  await page.waitForFunction(() => document.querySelectorAll('[role="progressbar"]')[2]?.getAttribute('aria-valuenow') === '0');
  await page.getByRole('button', { name: 'Historique téléchargement' }).click();
  await page.getByRole('button', { name: 'Biochimie (1)', exact: true }).click();
  await page.getByRole('dialog').locator('tbody tr').first().waitFor();
  return { success: true, verifications: ['4 imports et rafraichissement historique', '4 onglets avec une ligne chacun', 'reimport signale deja recu', 'lot vide a 0% sans effacement', 'actualisation globale avec une seule confirmation', 'echec partiel sans faux succes'], snapshot: await ui.snapshot({ full: true }) };
}

module.exports = (sourceOrPage, ui) => typeof sourceOrPage === 'string'
  ? ts.transpileModule(sourceOrPage, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  : verifier(sourceOrPage, ui);

async function lancer() {
  const webpack = require('webpack');
  const root = path.resolve(__dirname, '..');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'easy-medical-automates-ui-'));
  const entry = path.join(directory, 'entry.tsx');
  fs.writeFileSync(entry, `import React from 'react'; import {createRoot} from 'react-dom/client'; import AutomatExamen from ${JSON.stringify(path.join(root, 'components/AutomatExamen.tsx'))}; createRoot(document.getElementById('root')).render(<AutomatExamen/>);`);
  const compiler = webpack({
    mode: 'development', devtool: false, entry,
    output: { path: directory, filename: 'bundle.js' },
    resolve: { extensions: ['.tsx', '.ts', '.js', '.json'], modules: [path.join(root, 'node_modules'), 'node_modules'], alias: { '@': root } },
    module: { rules: [{ test: /\.tsx?$/, exclude: /node_modules/, use: [{ loader: __filename }] }] },
  });
  await new Promise((resolve, reject) => compiler.run((error, stats) => error || stats.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  await new Promise(resolve => compiler.close(resolve));
  const server = http.createServer((req, res) => {
    if (req.url === '/bundle.js') { res.setHeader('Content-Type', 'application/javascript'); fs.createReadStream(path.join(directory, 'bundle.js')).pipe(res); }
    else if (req.url === '/bootstrap.css') { res.setHeader('Content-Type', 'text/css'); fs.createReadStream(path.join(root, 'node_modules/bootstrap/dist/css/bootstrap.min.css')).pipe(res); }
    else if (req.url === '/') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Test automates isolé</title><link rel="stylesheet" href="/bootstrap.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>'); }
    else if (req.url === '/favicon.ico') { res.statusCode = 204; res.end(); }
    else { res.statusCode = 404; res.end(); }
  });
  server.listen(0, '127.0.0.1', () => console.log(`UI_TEST_READY http://127.0.0.1:${server.address().port} ; composant reel, API simulees ; fichiers temporaires : ${directory}`));
}
if (require.main === module) lancer().catch(error => { console.error(error); process.exitCode = 1; });
