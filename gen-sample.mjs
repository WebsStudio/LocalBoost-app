// Genera una web de ejemplo en una carpeta. Uso: node tests/gen-sample.mjs <categoria> <carpeta> [claro|oscuro]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createDemoProject } from '../js/core/demo.js';
import { generateSite, dataUrlToBytes } from '../js/generator/index.js';

const [, , category = 'beauty', outDir = '/tmp/lb-site', theme] = process.argv;
const p = createDemoProject(category);
if (theme === 'claro') p.identity.themeMode = 'light';
if (theme === 'oscuro') p.identity.themeMode = 'dark';
p.business.countryCode = '34';
p.business.bookingUrl = 'https://ejemplo.com/reservas';
p.business.address = 'Calle Mayor 12';
p.business.city = 'Palma';

// Contenido de relleno adicional para ver todas las secciones
for (const s of p.sections) s.enabled = true;
p.sections.find((s) => s.type === 'testimonials').content.items = [
  { id: 'a', name: 'Marta G.', text: 'Salí encantada. Trato cercano y un resultado mejor del que esperaba.' },
  { id: 'b', name: 'Luis P.', text: 'Puntuales, claros con los precios y muy profesionales.' },
  { id: 'c', name: 'Ana R.', text: 'Mi sitio de confianza desde hace años.' },
];
p.services[0].category = 'Esenciales';
p.services[1].category = 'Esenciales';
p.services[2].category = 'Especiales';

// Imagen sintética (PNG 1x1 escalado por CSS) para probar rutas de assets
const px = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
p.assets.img1 = { name: 'Foto Portada.png', mime: 'image/png', size: 100, dataUrl: px, width: 1, height: 1 };

const site = generateSite(p);
mkdirSync(join(outDir, 'assets'), { recursive: true });
for (const f of site.files) writeFileSync(join(outDir, f.path), f.data);
for (const a of site.assets) writeFileSync(join(outDir, a.path), dataUrlToBytes(a.dataUrl));
console.log('OK', outDir, site.files.map((f) => `${f.path} (${f.data.length})`).join(', '));
