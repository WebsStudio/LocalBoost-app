// Ejecutar: node tests/repository.test.mjs
import assert from 'node:assert/strict';
import { LocalStorageRepository, RepositoryError } from '../js/core/repository.js';
import { createProject, sanitizeProject } from '../js/core/models.js';

class FakeStorage {
  constructor(limitChars = Infinity) { this.m = new Map(); this.limit = limitChars; }
  get length() { return this.m.size; }
  key(i) { return [...this.m.keys()][i] ?? null; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) {
    const used = [...this.m].reduce((n, [kk, vv]) => n + (kk === k ? 0 : kk.length + vv.length), 0);
    if (used + k.length + v.length > this.limit) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; }
    this.m.set(k, String(v));
  }
  removeItem(k) { this.m.delete(k); }
}

let passed = 0;
const test = async (name, fn) => {
  try { await fn(); passed++; console.log('  ok  ', name); }
  catch (e) { console.error('  FAIL', name, '\n', e); process.exitCode = 1; }
};

await test('crear, listar, leer y borrar', async () => {
  const repo = new LocalStorageRepository(new FakeStorage());
  const p = await repo.create({ name: 'Salón Luna', category: 'beauty' });
  assert.equal((await repo.list()).length, 1);
  assert.equal((await repo.get(p.id)).name, 'Salón Luna');
  await repo.remove(p.id);
  assert.equal((await repo.list()).length, 0);
  assert.equal(await repo.get(p.id), null);
});

await test('persistencia entre "recargas" (nuevo repositorio, mismo storage)', async () => {
  const st = new FakeStorage();
  const a = new LocalStorageRepository(st);
  const p = await a.create({ name: 'Taller X', category: 'motor' });
  p.business.name = 'Taller X Motos';
  await a.save(p);
  const b = new LocalStorageRepository(st);
  assert.equal((await b.get(p.id)).business.name, 'Taller X Motos');
});

await test('renombrar y duplicar', async () => {
  const repo = new LocalStorageRepository(new FakeStorage());
  const p = await repo.create({ name: 'A' });
  await repo.rename(p.id, '  Nuevo nombre ');
  assert.equal((await repo.get(p.id)).name, 'Nuevo nombre');
  const d = await repo.duplicate(p.id);
  assert.notEqual(d.id, p.id);
  assert.match(d.name, /\(copia\)$/);
  assert.equal((await repo.list()).length, 2);
});

await test('datos corruptos no rompen la app', async () => {
  const st = new FakeStorage();
  st.setItem('lb:v1:index', '{no es json');
  st.setItem('lb:v1:p:abc123', '[]');
  st.setItem('lb:v1:p:def456', '{"id":"def456","name":"Rescatado","business":null,"sections":"x"}');
  const repo = new LocalStorageRepository(st);
  const list = await repo.list();
  assert.equal(list.length, 1);
  assert.equal(list[0].name, 'Rescatado');
  const p = await repo.get('def456');
  assert.ok(p.sections.find((s) => s.type === 'hero'));
});

await test('cuota excedida → RepositoryError("quota")', async () => {
  const repo = new LocalStorageRepository(new FakeStorage(2000));
  const p = createProject({ name: 'Grande' });
  p.business.description = 'x'.repeat(500);
  await assert.rejects(() => repo.save(p), (e) => e instanceof RepositoryError && e.code === 'quota');
});

await test('copia de seguridad: exportar e importar sin pisar', async () => {
  const a = new LocalStorageRepository(new FakeStorage());
  await a.create({ name: 'Uno' });
  await a.create({ name: 'Dos' });
  const backup = JSON.parse(JSON.stringify(await a.exportBackup()));
  const b = new LocalStorageRepository(new FakeStorage());
  assert.deepEqual(await b.importBackup(backup), { imported: 2, skipped: 0 });
  assert.equal((await b.list()).length, 2);
  // Importar otra vez crea copias, no sobrescribe
  await b.importBackup(backup);
  assert.equal((await b.list()).length, 4);
  await assert.rejects(() => b.importBackup({ foo: 1 }), RepositoryError);
});

await test('sanitizeProject neutraliza datos peligrosos', async () => {
  const p = createProject({ name: 'X' });
  p.assets.img1 = { name: 'a', mime: 'image/png', size: 1, dataUrl: 'javascript:alert(1)' };
  p.assets.img2 = { name: 'b', mime: 'image/png', size: 1, dataUrl: 'data:image/png;base64,AAAA' };
  p.identity.primary = 'url(javascript:1)';
  p.sections.push({ id: 'z', type: 'malicioso', enabled: true, content: {} });
  const s = sanitizeProject(p);
  assert.equal(s.assets.img1, undefined);
  assert.ok(s.assets.img2);
  assert.match(s.identity.primary, /^#[0-9a-f]{6}$/i);
  assert.ok(!s.sections.find((x) => x.type === 'malicioso'));
});

console.log(`\n${passed} pruebas OK`);
