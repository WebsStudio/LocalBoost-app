// Pruebas del exportador: ZIP válido, archivos esperados, rutas relativas y README.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createDemoProject } from '../js/core/demo.js';
import { buildExportBundle, getExportWarnings } from '../js/export/exporter.js';
import { CATEGORIES } from '../js/core/models.js';

let n = 0;
const ok = (label) => { n++; console.log('  ok  ', label); };
const px = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

for (const cat of ['beauty', 'restaurant', 'motor']) {
  const p = createDemoProject(cat);
  p.assets.img1 = { name: 'Foto Portada.png', mime: 'image/png', size: 100, dataUrl: px, width: 1, height: 1 };
  p.sections.find((s) => s.type === 'hero').content.imageId = 'img1';
  const b = buildExportBundle(p);
  for (const f of ['index.html', 'style.css', 'script.js', 'README.md', '.nojekyll', 'assets/foto-portada.png']) {
    assert.ok(b.paths.includes(f), `${cat}: falta ${f}`);
  }
  const dir = mkdtempSync(join(tmpdir(), 'lb-exp-'));
  const zipPath = join(dir, 'x.zip');
  writeFileSync(zipPath, b.zip);
  const out = execFileSync('unzip', ['-t', zipPath]).toString();
  assert.match(out, /No errors detected/, `${cat}: ZIP inválido`);
  ok(`${cat}: ZIP válido con ${b.fileCount} archivos`);

  const html = execFileSync('unzip', ['-p', zipPath, 'index.html']).toString();
  assert.ok(!/(src|href)="\//.test(html), `${cat}: rutas absolutas en index.html`);
  assert.ok(!/localboost/i.test(html), `${cat}: referencia a LocalBoost en la web`);
  assert.ok(html.includes('style.css') && html.includes('script.js'), `${cat}: enlaces a css/js`);
  assert.ok(html.includes('assets/foto-portada.png'), `${cat}: imagen referenciada con ruta relativa`);
  assert.ok(html.includes('https://wa.me/34600000000'), `${cat}: enlace wa.me`);
  ok(`${cat}: rutas relativas, independiente de LocalBoost`);

  const readme = execFileSync('unzip', ['-p', zipPath, 'README.md']).toString();
  assert.match(readme, /GitHub Pages/);
  assert.match(readme, /no publica la web por ti/);
  ok(`${cat}: README con instrucciones`);
}

// Texto malicioso se escapa
{
  const p = createDemoProject('beauty');
  p.business.name = '<img src=x onerror=alert(1)>';
  p.business.description = '"><script>alert(1)</script>';
  const b = buildExportBundle(p);
  const dir = mkdtempSync(join(tmpdir(), 'lb-exp-'));
  writeFileSync(join(dir, 'x.zip'), b.zip);
  const html = execFileSync('unzip', ['-p', join(dir, 'x.zip'), 'index.html']).toString();
  assert.ok(!html.includes('<img src=x onerror'), 'nombre sin escapar');
  assert.ok(!html.includes('<script>alert(1)'), 'descripción sin escapar');
  ok('el texto del usuario se escapa en la web exportada');
}

// Avisos
{
  const p = createDemoProject('motor');
  assert.ok(getExportWarnings(p).some((w) => /demostración/i.test(w)));
  const q = createDemoProject('motor');
  q.isDemo = false; Object.assign(q.business, { email: 'a@b.com', phone: '', whatsapp: '' });
  assert.equal(getExportWarnings(q).length, 0);
  q.business.email = '';
  assert.ok(getExportWarnings(q).some((w) => /contactar/i.test(w)));
  ok('avisos previos a exportar');
}
console.log(`\n${n} pruebas OK`);
