// Ejecutar: node tests/core.test.mjs
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createZip, crc32, safeZipPath } from '../js/export/zip.js';
import * as U from '../js/core/utils.js';

let passed = 0;
const test = (name, fn) => {
  try { fn(); passed++; console.log('  ok  ', name); }
  catch (e) { console.error('  FAIL', name, '\n', e); process.exitCode = 1; }
};

test('crc32 conocido', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
});
test('safeZipPath bloquea ..', () => {
  assert.equal(safeZipPath('../../etc/passwd'), 'etc/passwd');
  assert.equal(safeZipPath('\\assets\\a.png'), 'assets/a.png');
});
test('zip rechaza duplicados', () => {
  assert.throws(() => createZip([{ path: 'a', data: '1' }, { path: 'a', data: '2' }]));
});
test('escape HTML', () => {
  assert.equal(U.esc('<img src=x onerror="a">'), '&lt;img src=x onerror=&quot;a&quot;&gt;');
});
test('WhatsApp: prefijo por defecto y mensaje codificado', () => {
  assert.equal(U.buildWhatsAppLink('612 34 56 78', 'Hola, quiero cita & más'),
    'https://wa.me/34612345678?text=Hola%2C%20quiero%20cita%20%26%20m%C3%A1s');
  assert.equal(U.buildWhatsAppLink('+44 7700 900123'), 'https://wa.me/447700900123');
  assert.equal(U.buildWhatsAppLink('0034612345678'), 'https://wa.me/34612345678');
  assert.equal(U.buildWhatsAppLink('34612345678'), 'https://wa.me/34612345678');
  assert.equal(U.buildWhatsAppLink(''), '');
});
test('tel y mailto', () => {
  assert.equal(U.buildTelLink('971 123 456'), 'tel:+34971123456');
  assert.equal(U.buildMailto('a@b.es', 'Hola mundo'), 'mailto:a@b.es?subject=Hola%20mundo');
  assert.equal(U.buildMailto('mal'), '');
});
test('normalizeUrl solo http(s)', () => {
  assert.equal(U.normalizeUrl('javascript:alert(1)'), '');
  assert.equal(U.normalizeUrl('ejemplo.com/reservas'), 'https://ejemplo.com/reservas');
  assert.equal(U.normalizeUrl('localhost'), '');
});
test('redes sociales', () => {
  assert.equal(U.buildSocialLink('instagram', '@taller_mx'), 'https://www.instagram.com/taller_mx');
  assert.equal(U.buildSocialLink('facebook', 'https://facebook.com/x'), 'https://facebook.com/x');
  assert.equal(U.buildSocialLink('instagram', 'javascript:alert(1)'), '');
});
test('mapa', () => {
  assert.match(U.buildMapLink('Calle Mayor 1', 'Palma'), /google\.com\/maps\/search.*Calle%20Mayor%201%2C%20Palma/);
});
test('slugify', () => {
  assert.equal(U.slugify('Peluquería Ñandú & Co.'), 'peluqueria-nandu-co');
  assert.equal(U.slugify('###'), 'sitio');
});

// Zip válido: lo verifica Python con zipfile
const zip = createZip([
  { path: 'index.html', data: '<h1>Ñandú ✓</h1>' },
  { path: 'assets/img/a.bin', data: new Uint8Array([0, 1, 2, 255]) },
]);
const dir = mkdtempSync(join(tmpdir(), 'lb-zip-'));
const file = join(dir, 't.zip');
writeFileSync(file, zip);
console.log('ZIP_PATH=' + file);
console.log(`\n${passed} pruebas OK`);
