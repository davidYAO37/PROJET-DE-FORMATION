/**
 * Utilitaire temporaire pour convertir un export CSV WinDev en .xlsx
 * afin de tester l'import Excel.
 *
 * Usage :
 *   node scripts/import_windev/csv_to_xlsx.js <input.csv> <output.xlsx>
 */

const fs = require('fs');
const iconv = require('iconv-lite');
const { parse } = require('csv-parse/sync');
const xlsx = require('xlsx');

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: node csv_to_xlsx.js <input.csv> <output.xlsx>');
  process.exit(1);
}

const buffer = fs.readFileSync(input);
const decoded = iconv.decode(buffer, 'windows-1252');
const records = parse(decoded, {
  delimiter: ';',
  quote: '"',
  relax_quotes: true,
  relax_column_count: true,
  skip_empty_lines: true,
});

const worksheet = xlsx.utils.aoa_to_sheet(records);
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, 'Données');
xlsx.writeFile(workbook, output);
console.log(`Converti : ${input} -> ${output} (${records.length} lignes)`);
