#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CONFIG_DIR = path.join(ROOT, 'config');
const VENUES_DIR = path.join(CONFIG_DIR, 'venues');
const TEMPLATE = path.join(ROOT, 'src', 'template.html');
const OUTPUT = path.join(ROOT, 'index.html');

// Wczytaj config ogólny
const general = JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, 'general.json'), 'utf8'));

// Wczytaj venue configs w kolejności z general.json
const venues = general.venueOrder.map(id => {
  const file = path.join(VENUES_DIR, `${id}.json`);
  if (!fs.existsSync(file)) {
    console.error(`BŁĄD: Brak pliku ${file}`);
    process.exit(1);
  }
  const venue = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (venue.id !== id) {
    console.warn(`OSTRZEŻENIE: id w pliku (${venue.id}) różni się od nazwy pliku (${id})`);
  }
  return venue;
});

// Zbuduj obiekt VENUES_DATA
const venuesData = {
  meta: {
    ...general.meta,
    defaultGuests: general.meta.defaultGuests,
    origins: general.origins,
  },
  venues,
};

// Zaktualizuj datę w meta
venuesData.meta.lastUpdated = general.meta.lastUpdated;

// Wczytaj szablon
let html = fs.readFileSync(TEMPLATE, 'utf8');

// Wstaw dane
const dataBlock = `const VENUES_DATA = ${JSON.stringify(venuesData, null, 2)};`;
html = html.replace('// __VENUES_DATA__', dataBlock);

// Wstaw datę aktualizacji w footer
html = html.replace('{{LAST_UPDATED}}', general.meta.lastUpdated);

// Zapisz output
fs.writeFileSync(OUTPUT, html, 'utf8');

console.log(`✓ Zbudowano index.html`);
console.log(`  Sale (${venues.length}): ${venues.map(v => v.name).join(', ')}`);
console.log(`  Ostatnia aktualizacja: ${general.meta.lastUpdated}`);
