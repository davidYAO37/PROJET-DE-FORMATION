const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const dir = process.argv[2];
const results = [];

for (const name of fs.readdirSync(dir).filter(name => name.toLowerCase().endsWith('.xlsx'))) {
  const workbook = xlsx.readFile(path.join(dir, name));
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const headers = rows[0] || [];
  const counts = new Map();
  for (const row of rows.slice(1)) {
    row.forEach((cell, index) => {
      if (/^\s*\{\\rtf/i.test(String(cell || ''))) counts.set(String(headers[index] || `colonne_${index}`), (counts.get(String(headers[index] || `colonne_${index}`)) || 0) + 1);
    });
  }
  if (counts.size) results.push({ file: name, fields: Object.fromEntries(counts) });
}

console.log(JSON.stringify(results, null, 2));
