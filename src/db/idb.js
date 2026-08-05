/** Minimal IndexedDB helpers (no external deps). */

/**
 * @param {string} name
 * @param {number} version
 * @param {(db: IDBDatabase, oldVersion: number, tx: IDBTransaction) => void} onUpgrade
 * @returns {Promise<IDBDatabase>}
 */
export function openDatabase(name, version, onUpgrade) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version)
    req.onerror = () => reject(req.error ?? new Error('indexedDB.open failed'))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      onUpgrade(req.result, req.oldVersion, req.transaction)
    }
  })
}

/**
 * @param {IDBRequest} request
 * @returns {Promise<any>}
 */
export function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IDB request failed'))
  })
}

/**
 * @param {IDBTransaction} tx
 * @returns {Promise<void>}
 */
export function transactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IDB transaction failed'))
    tx.onabort = () => reject(tx.error ?? new Error('IDB transaction aborted'))
  })
}

/**
 * @template T
 * @param {IDBObjectStore | IDBIndex} source
 * @param {IDBKeyRange | null} [range]
 * @returns {Promise<T[]>}
 */
export function getAll(source, range = null) {
  return requestToPromise(source.getAll(range ?? undefined))
}

/**
 * @template T
 * @param {IDBObjectStore | IDBIndex} source
 * @param {IDBValidKey} key
 * @returns {Promise<T | undefined>}
 */
export function get(source, key) {
  return requestToPromise(source.get(key))
}

/**
 * @param {IDBObjectStore} store
 * @param {any} value
 * @param {IDBValidKey} [key]
 */
export function put(store, value, key) {
  return requestToPromise(key !== undefined ? store.put(value, key) : store.put(value))
}

/**
 * @param {IDBObjectStore} store
 * @param {IDBValidKey} key
 */
export function del(store, key) {
  return requestToPromise(store.delete(key))
}
