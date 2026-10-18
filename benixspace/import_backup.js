import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlPath = path.join(__dirname, '..', 'sql', 'backup_tv.sql');

if (!fs.existsSync(sqlPath)) {
  console.error('SQL file not found at:', sqlPath);
  process.exit(1);
}

const content = fs.readFileSync(sqlPath, 'utf8');
const lines = content.split('\n');

const stations = [];

for (const line of lines) {
  if (!line.includes('INSERT INTO "public"."stations"')) continue;

  const valIndex = line.indexOf('VALUES (');
  if (valIndex === -1) continue;

  const rawValues = line.substring(valIndex + 8, line.lastIndexOf(');'));
  
  // Custom SQL values parser
  const tokens = [];
  let current = '';
  let inQuote = false;

  for (let i = 0; i < rawValues.length; i++) {
    const char = rawValues[i];
    if (char === "'" && (i === 0 || rawValues[i - 1] !== '\\')) {
      if (inQuote && rawValues[i + 1] === "'") {
        current += "'";
        i++; // skip escaped quote
      } else {
        inQuote = !inQuote;
      }
    } else if (char === ',' && !inQuote) {
      tokens.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) tokens.push(current.trim());

  const clean = tokens.map(t => {
    if (t === 'NULL') return null;
    if (t === 'TRUE') return true;
    if (t === 'FALSE') return false;
    if (t.startsWith("'") && t.endsWith("'")) {
      return t.substring(1, t.length - 1);
    }
    const num = Number(t);
    return isNaN(num) ? t : num;
  });

  if (clean.length >= 15) {
    stations.push({
      id: clean[0],
      name: clean[1],
      slug: clean[2],
      description: clean[3] || '',
      logo_url: clean[4] || '/logo.png',
      stream_url: clean[5],
      stream_type: clean[6],
      station_type: clean[7],
      location: clean[8] || '',
      frequency: clean[9] || '',
      accent_color: clean[10] || '#0284c7',
      status: clean[11] || 'ONLINE',
      is_active: clean[12] !== false,
      is_featured: clean[13] === true,
      display_order: Number(clean[14]) || 0
    });
  }
}

console.log('Extracted stations count:', stations.length);
console.log('TV stations count:', stations.filter(s => s.station_type === 'TV').length);
console.log('Radio stations count:', stations.filter(s => s.station_type === 'RADIO').length);

const outputPath = path.join(__dirname, 'src', 'client', 'services', 'real_stations.json');
fs.writeFileSync(outputPath, JSON.stringify(stations, null, 2));
console.log('Wrote real stations to:', outputPath);
