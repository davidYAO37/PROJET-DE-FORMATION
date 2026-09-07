/**
 * Affiche les en-têtes et un aperçu d'un fichier Excel.
 *
 * Usage :
 *   node scripts/import_windev/inspect_xlsx.js <fichier.xlsx> [nombre_de_lignes]
 */

const fs = require('fs');
const xlsx = require('xlsx');

const [filePath, limitArg] = process.argv.slice(2);
const limit = parseInt(limitArg || '5', 10);

if (!filePath || !fs.existsSync(filePath)) {
  console.error('Fichier introuvable :', filePath);
  process.exit(1);
}

const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

console.log(`Feuille : ${sheetName}`);
console.log(`Total lignes : ${rows.length}`);
console.log('--- En-têtes ---');
if (rows.length > 0) {
  rows[0].forEach((h, i) => console.log(`  [${i}] ${h}`));
}

console.log(`--- ${limit} premières lignes ---`);
for (let i = 1; i < Math.min(rows.length, limit + 1); i++) {
  console.log(`Ligne ${i}:`, rows[i]);
}
