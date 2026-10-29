// Capa de datos. La interfaz es asíncrona a propósito: para añadir un backend
// basta con crear otra clase con los mismos métodos y cambiar `createRepository()`.
//
// IMPORTANTE: localStorage es específico de cada navegador y dispositivo.
// No hay sincronización en la nube; para mover proyectos se usa la copia de seguridad.

import { createProject, sanitizeProject, projectMeta, SCHEMA_VERSION } from './models.js';
import { uid, deepClone } from './utils.js';

const NS = 'lb:v1:';
const INDEX_KEY = `${NS}index`;
const projectKey = (id) => `${NS}p:${id}`;

export class RepositoryError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'RepositoryError';
    this.code = code; // 'quota' | 'unavailable' | 'invalid' | 'not-found'
  }
}

function isQuotaError(e) {
  return !!e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014);
}

export class LocalStorageRepository {
  /** @param {Storage} [storage] inyectable para pruebas */
  constructor(storage) {
    this.storage = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
  }

  _requireStorage() {
    if (!this.storage) throw new RepositoryError('unavailable', 'El navegador no permite guardar datos locales (¿modo privado o bloqueado?).');
    return this.storage;
  }

  _readJson(key) {
    try {
      const raw = this._requireStorage().getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      if (e instanceof RepositoryError) throw e;
      return null; // JSON corrupto
    }
  }

  _writeJson(key, value) {
    try {
      this._requireStorage().setItem(key, JSON.stringify(value));
    } catch (e) {
      if (e instanceof RepositoryError) throw e;
      if (isQuotaError(e)) throw new RepositoryError('quota', 'No hay espacio suficiente en el navegador. Elimina imágenes pesadas o proyectos que no uses, o exporta una copia de seguridad.');
      throw new RepositoryError('unavailable', 'No se pudo guardar en el navegador.');
    }
  }

  _allProjectIds() {
    const s = this._requireStorage();
    const ids = [];
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (k && k.startsWith(`${NS}p:`)) ids.push(k.slice(`${NS}p:`.length));
    }
    return ids;
  }

  /** Reconstruye el índice a partir de los proyectos guardados (autorreparación). */
  _rebuildIndex() {
    const metas = [];
    for (const id of this._allProjectIds()) {
      const p = sanitizeProject(this._readJson(projectKey(id)));
      if (p) metas.push(projectMeta({ ...p, id }));
    }
    try { this._writeJson(INDEX_KEY, metas); } catch { /* no crítico */ }
    return metas;
  }

  async list() {
    const index = this._readJson(INDEX_KEY);
    let metas = Array.isArray(index) ? index.filter((m) => m && typeof m.id === 'string') : this._rebuildIndex();
    // Descarta entradas cuyo proyecto ya no existe
    const existing = new Set(this._allProjectIds());
    if (metas.some((m) => !existing.has(m.id)) || [...existing].some((id) => !metas.find((m) => m.id === id))) {
      metas = this._rebuildIndex();
    }
    return metas.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }

  async get(id) {
    const raw = this._readJson(projectKey(id));
    const p = sanitizeProject(raw);
    if (!p) return null;
    p.id = id;
    return p;
  }

  async save(project) {
    const p = sanitizeProject(project);
    if (!p) throw new RepositoryError('invalid', 'El proyecto no es válido.');
    p.id = project.id || p.id;
    p.updatedAt = new Date().toISOString();
    this._writeJson(projectKey(p.id), p);
    const metas = (await this.list()).filter((m) => m.id !== p.id);
    metas.push(projectMeta(p));
    this._writeJson(INDEX_KEY, metas);
    return p;
  }

  async create(init) {
    return this.save(createProject(init));
  }

  async remove(id) {
    const s = this._requireStorage();
    s.removeItem(projectKey(id));
    const metas = (await this.list()).filter((m) => m.id !== id);
    this._writeJson(INDEX_KEY, metas);
  }

  async rename(id, name) {
    const p = await this.get(id);
    if (!p) throw new RepositoryError('not-found', 'El proyecto no existe.');
    p.name = String(name).trim().slice(0, 120) || p.name;
    return this.save(p);
  }

  async duplicate(id) {
    const p = await this.get(id);
    if (!p) throw new RepositoryError('not-found', 'El proyecto no existe.');
    const copy = deepClone(p);
    copy.id = uid('proj');
    copy.name = `${p.name} (copia)`.slice(0, 120);
    copy.status = 'draft';
    copy.createdAt = new Date().toISOString();
    copy.lastExportedAt = '';
    return this.save(copy);
  }

  async markExported(id) {
    const p = await this.get(id);
    if (!p) return null;
    const saved = await this.save({ ...p, status: 'exported' });
    saved.lastExportedAt = new Date().toISOString();
    this._writeJson(projectKey(id), saved);
    const metas = (await this.list()).filter((m) => m.id !== id);
    metas.push(projectMeta(saved));
    this._writeJson(INDEX_KEY, metas);
    return saved;
  }

  // ---------- Copia de seguridad ----------

  async exportBackup() {
    const projects = [];
    for (const m of await this.list()) {
      const p = await this.get(m.id);
      if (p) projects.push(p);
    }
    return { app: 'LocalBoost', kind: 'backup', schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), projects };
  }

  /** @returns {{imported:number, skipped:number}} */
  async importBackup(data, { overwrite = false } = {}) {
    if (!data || data.app !== 'LocalBoost' || !Array.isArray(data.projects)) {
      throw new RepositoryError('invalid', 'El archivo no es una copia de seguridad de LocalBoost.');
    }
    let imported = 0;
    let skipped = 0;
    const existing = new Set((await this.list()).map((m) => m.id));
    for (const raw of data.projects.slice(0, 200)) {
      const p = sanitizeProject(raw);
      if (!p) { skipped++; continue; }
      if (existing.has(p.id) && !overwrite) p.id = uid('proj');
      await this.save(p);
      imported++;
    }
    return { imported, skipped };
  }

  /** Aproximación del espacio usado por LocalBoost (caracteres ≈ bytes ×2 en UTF-16). */
  usage() {
    const s = this.storage;
    if (!s) return { bytes: 0, limit: 5 * 1024 * 1024 };
    let chars = 0;
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (k && k.startsWith(NS)) chars += k.length + (s.getItem(k) || '').length;
    }
    return { bytes: chars * 2, limit: 5 * 1024 * 1024 };
  }
}

export function createRepository() {
  return new LocalStorageRepository();
}
