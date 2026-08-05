/**
 * Event-sourced project store backed by IndexedDB.
 *
 * Each project is an append-only event log. Current design state is a projection
 * of that log. Project rows hold metadata + a small preview for the gallery.
 *
 * Event types:
 *   project.created  — { name?, state }
 *   state.patched    — { patch }  (shallow merge into design state)
 *   state.replaced   — { state }  (full replace, used when loading / hard save)
 *   project.renamed  — { name }
 *   project.deleted  — {}         (tombstone; project row is removed)
 */

import {
  openDatabase,
  transactionDone,
  getAll,
  get,
  put,
  del,
} from './idb.js'

export const DB_NAME = 'fontwow_es'
export const DB_VERSION = 1

const STORE_PROJECTS = 'projects'
const STORE_EVENTS = 'events'
const STORE_META = 'meta'

/** localStorage keys used for one-time migration */
export const LEGACY_SAVED_KEY = 'fontwow_saved_v1'
export const ACTIVE_PROJECT_KEY = 'fontwow_active_project_id'
export const MIGRATION_FLAG_KEY = 'fontwow_es_migrated_v1'

/** Design fields used for gallery cards (subset of full state). */
const PREVIEW_KEYS = [
  'text',
  'fontId',
  'color',
  'bgId',
  'customBgUrl',
  'direction',
  'bold',
  'italic',
]

/** @type {IDBDatabase | null} */
let dbPromise = null

function openDb() {
  if (!dbPromise) {
    dbPromise = openDatabase(DB_NAME, DB_VERSION, (db) => {
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        const projects = db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' })
        projects.createIndex('by_updated', 'updatedAt')
      }
      if (!db.objectStoreNames.contains(STORE_EVENTS)) {
        const events = db.createObjectStore(STORE_EVENTS, { keyPath: 'id' })
        events.createIndex('by_project', 'projectId')
        events.createIndex('by_project_seq', ['projectId', 'seq'], { unique: true })
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' })
      }
    })
  }
  return dbPromise
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * @param {Record<string, any>} state
 */
export function previewFromState(state) {
  const preview = {}
  for (const k of PREVIEW_KEYS) {
    if (state[k] !== undefined) preview[k] = state[k]
  }
  return preview
}

/**
 * @param {Record<string, any>} base
 * @param {{ type: string, payload?: any }} event
 */
export function applyEvent(base, event) {
  switch (event.type) {
    case 'project.created':
      return { ...(event.payload?.state ?? {}) }
    case 'state.patched':
      return { ...base, ...(event.payload?.patch ?? {}) }
    case 'state.replaced':
      return { ...(event.payload?.state ?? {}) }
    case 'project.renamed':
    case 'project.deleted':
      return base
    default:
      return base
  }
}

/**
 * @param {Array<{ type: string, payload?: any }>} events
 * @param {Record<string, any>} [seed]
 */
export function reduceEvents(events, seed = {}) {
  return events.reduce((acc, ev) => applyEvent(acc, ev), { ...seed })
}

/**
 * Shallow diff of top-level keys (reference equality). Arrays/objects that
 * change identity are treated as full replacements under that key.
 * @param {Record<string, any>} prev
 * @param {Record<string, any>} next
 */
export function shallowPatch(prev, next) {
  /** @type {Record<string, any>} */
  const patch = {}
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)])
  for (const k of keys) {
    if (prev[k] !== next[k]) patch[k] = next[k]
  }
  return patch
}

/**
 * @param {string} projectId
 * @returns {Promise<Array<{ id: string, projectId: string, seq: number, type: string, payload: any, ts: number }>>}
 */
export async function listEvents(projectId) {
  const db = await openDb()
  const tx = db.transaction(STORE_EVENTS, 'readonly')
  const index = tx.objectStore(STORE_EVENTS).index('by_project')
  const all = await getAll(index, IDBKeyRange.only(projectId))
  await transactionDone(tx)
  all.sort((a, b) => a.seq - b.seq)
  return all
}

/**
 * @param {string} projectId
 * @param {Record<string, any>} [defaults] merged under the projection (e.g. defaultState)
 */
export async function loadProjectState(projectId, defaults = {}) {
  const events = await listEvents(projectId)
  if (events.length === 0) return null
  return reduceEvents(events, defaults)
}

/**
 * List projects newest-first (gallery order).
 * @returns {Promise<Array<ProjectMeta>>}
 */
export async function listProjects() {
  const db = await openDb()
  const tx = db.transaction(STORE_PROJECTS, 'readonly')
  const all = await getAll(tx.objectStore(STORE_PROJECTS))
  await transactionDone(tx)
  all.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
  return all
}

/**
 * @param {string} id
 */
export async function getProject(id) {
  const db = await openDb()
  const tx = db.transaction(STORE_PROJECTS, 'readonly')
  const row = await get(tx.objectStore(STORE_PROJECTS), id)
  await transactionDone(tx)
  return row ?? null
}

/**
 * Create a project and its first event.
 * @param {{ name?: string, state: Record<string, any>, kind?: 'draft' | 'gallery' }} opts
 */
export async function createProject({ name = '', state, kind = 'gallery' }) {
  const id = newId()
  const ts = Date.now()
  const event = {
    id: `${id}:1`,
    projectId: id,
    seq: 1,
    type: 'project.created',
    payload: { name, state },
    ts,
  }
  const project = {
    id,
    name: name || previewName(state),
    kind,
    createdAt: ts,
    updatedAt: ts,
    headSeq: 1,
    preview: previewFromState(state),
  }

  const db = await openDb()
  const tx = db.transaction([STORE_PROJECTS, STORE_EVENTS], 'readwrite')
  await put(tx.objectStore(STORE_PROJECTS), project)
  await put(tx.objectStore(STORE_EVENTS), event)
  await transactionDone(tx)
  return { project, event }
}

/**
 * Append an event and refresh project metadata / preview.
 * @param {string} projectId
 * @param {string} type
 * @param {any} payload
 * @param {{ previewState?: Record<string, any>, name?: string, kind?: string }} [meta]
 */
export async function appendEvent(projectId, type, payload, meta = {}) {
  const db = await openDb()
  const tx = db.transaction([STORE_PROJECTS, STORE_EVENTS], 'readwrite')
  const projects = tx.objectStore(STORE_PROJECTS)
  const events = tx.objectStore(STORE_EVENTS)

  const project = await get(projects, projectId)
  if (!project) {
    await transactionDone(tx)
    throw new Error(`Project not found: ${projectId}`)
  }

  const seq = (project.headSeq ?? 0) + 1
  const ts = Date.now()
  const event = {
    id: `${projectId}:${seq}`,
    projectId,
    seq,
    type,
    payload,
    ts,
  }

  const next = {
    ...project,
    headSeq: seq,
    updatedAt: ts,
  }
  if (meta.name !== undefined) next.name = meta.name
  if (meta.kind !== undefined) next.kind = meta.kind
  if (meta.previewState) {
    next.preview = previewFromState(meta.previewState)
    if (!next.name) next.name = previewName(meta.previewState)
  }

  await put(events, event)
  await put(projects, next)
  await transactionDone(tx)
  return { project: next, event }
}

/**
 * Replace full design state (single snapshot event) and update preview.
 * @param {string} projectId
 * @param {Record<string, any>} state
 * @param {{ name?: string, kind?: string }} [opts]
 */
export async function replaceState(projectId, state, opts = {}) {
  return appendEvent(projectId, 'state.replaced', { state }, {
    previewState: state,
    name: opts.name,
    kind: opts.kind,
  })
}

/**
 * Append a shallow patch if non-empty.
 * @param {string} projectId
 * @param {Record<string, any>} patch
 * @param {Record<string, any>} fullState for preview
 */
export async function patchState(projectId, patch, fullState) {
  if (!patch || Object.keys(patch).length === 0) return null
  return appendEvent(projectId, 'state.patched', { patch }, { previewState: fullState })
}

/**
 * Soft-delete: tombstone event then remove project + all events.
 * @param {string} projectId
 */
export async function deleteProject(projectId) {
  const db = await openDb()
  // Append tombstone first (best-effort history), then wipe for storage size.
  try {
    await appendEvent(projectId, 'project.deleted', {})
  } catch {
    // project may already be gone
  }

  const tx = db.transaction([STORE_PROJECTS, STORE_EVENTS], 'readwrite')
  const eventsStore = tx.objectStore(STORE_EVENTS)
  const index = eventsStore.index('by_project')
  const events = await getAll(index, IDBKeyRange.only(projectId))
  for (const ev of events) {
    await del(eventsStore, ev.id)
  }
  await del(tx.objectStore(STORE_PROJECTS), projectId)
  await transactionDone(tx)
}

/**
 * @param {string} key
 * @param {any} value
 */
async function setMeta(key, value) {
  const db = await openDb()
  const tx = db.transaction(STORE_META, 'readwrite')
  await put(tx.objectStore(STORE_META), { key, value })
  await transactionDone(tx)
}

/**
 * @param {string} key
 */
async function getMeta(key) {
  const db = await openDb()
  const tx = db.transaction(STORE_META, 'readonly')
  const row = await get(tx.objectStore(STORE_META), key)
  await transactionDone(tx)
  return row?.value
}

/**
 * One-time migrate gallery snapshots from localStorage into event-sourced projects.
 * @param {Array<Record<string, any>>} [legacyEntries]
 * @returns {Promise<{ migrated: number }>}
 */
export async function migrateLegacyGallery(legacyEntries) {
  const done = await getMeta(MIGRATION_FLAG_KEY)
  if (done) return { migrated: 0 }

  let entries = legacyEntries
  if (!entries) {
    try {
      entries = JSON.parse(localStorage.getItem(LEGACY_SAVED_KEY) ?? '[]')
    } catch {
      entries = []
    }
  }
  if (!Array.isArray(entries)) entries = []

  let migrated = 0
  // Oldest first so newest ends up with later timestamps when we re-save order
  for (const entry of [...entries].reverse()) {
    const { id: _legacyId, ...state } = entry
    await createProject({
      name: previewName(state),
      state,
      kind: 'gallery',
    })
    migrated += 1
  }

  await setMeta(MIGRATION_FLAG_KEY, { at: Date.now(), count: migrated })
  return { migrated }
}

/**
 * Gallery-facing row: flatten project.preview onto the object (App.jsx cards).
 * @param {ProjectMeta} project
 */
export function projectToGalleryEntry(project) {
  return {
    id: project.id,
    name: project.name,
    kind: project.kind,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    headSeq: project.headSeq,
    ...(project.preview ?? {}),
  }
}

function previewName(state) {
  const text = (state?.text ?? '').trim().replace(/\s+/g, ' ')
  if (!text) return 'Untitled'
  return text.length > 32 ? `${text.slice(0, 32)}…` : text
}

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   kind: 'draft' | 'gallery',
 *   createdAt: number,
 *   updatedAt: number,
 *   headSeq: number,
 *   preview: Record<string, any>,
 * }} ProjectMeta
 */
