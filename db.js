// IndexedDB 数据层
const DB_NAME = 'FitTrackDB';
const DB_VERSION = 1;
const STORES = { exercises: 'exercises', templates: 'templates', sessions: 'sessions' };

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(STORES.exercises)) {
        d.createObjectStore(STORES.exercises, { keyPath: 'id' });
      }
      if (!d.objectStoreNames.contains(STORES.templates)) {
        d.createObjectStore(STORES.templates, { keyPath: 'id' });
      }
      if (!d.objectStoreNames.contains(STORES.sessions)) {
        const store = d.createObjectStore(STORES.sessions, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
      }
    };
    req.onsuccess = (e) => { db = e.target.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });
}

function dbGetAll(storeName) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

function dbPut(storeName, data) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(data);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  }));
}

function dbDelete(storeName, id) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  }));
}

function dbGet(storeName, id) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

// 初始化：写入预设动作
async function initDB() {
  await openDB();
  const existing = await dbGetAll(STORES.exercises);
  const presetIds = new Set(PRESET_EXERCISES.map(e => e.id));
  const hasPresets = existing.some(e => presetIds.has(e.id));
  if (!hasPresets) {
    for (const ex of PRESET_EXERCISES) {
      await dbPut(STORES.exercises, ex);
    }
  }
}

// ===== Exercise API =====
function getUID() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

async function getAllExercises() {
  return dbGetAll(STORES.exercises);
}

async function getExercisesByGroup(group) {
  const all = await getAllExercises();
  if (group === '全部') return all;
  return all.filter(e => e.muscleGroup === group);
}

async function addCustomExercise(name, muscleGroup) {
  const ex = { id: 'custom_' + getUID(), name, muscleGroup, isCustom: true };
  await dbPut(STORES.exercises, ex);
  return ex;
}

async function updateCustomExercise(id, name, muscleGroup) {
  const ex = await dbGet(STORES.exercises, id);
  if (!ex || !ex.isCustom) throw new Error('只能编辑自定义动作');
  ex.name = name;
  ex.muscleGroup = muscleGroup;
  await dbPut(STORES.exercises, ex);
  return ex;
}

async function deleteCustomExercise(id) {
  const ex = await dbGet(STORES.exercises, id);
  if (!ex || !ex.isCustom) throw new Error('只能删除自定义动作');
  await dbDelete(STORES.exercises, id);
}

// ===== Template API =====
async function getTemplates() {
  return dbGetAll(STORES.templates);
}

async function getTemplate(id) {
  return dbGet(STORES.templates, id);
}

async function saveTemplate(template) {
  if (!template.id) template.id = 'tpl_' + getUID();
  await dbPut(STORES.templates, template);
  return template;
}

async function deleteTemplate(id) {
  await dbDelete(STORES.templates, id);
}

// ===== Session API =====
async function getSessions() {
  return dbGetAll(STORES.sessions);
}

async function saveSession(session) {
  if (!session.id) session.id = 'sess_' + getUID();
  await dbPut(STORES.sessions, session);
  return session;
}

async function getSession(id) {
  return dbGet(STORES.sessions, id);
}

async function deleteSession(id) {
  await dbDelete(STORES.sessions, id);
}
