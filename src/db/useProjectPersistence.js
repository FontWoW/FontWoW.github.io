/**
 * React hook: keep an active event-sourced project in sync with design state.
 *
 * - Discrete edits (toggles, chips, typing): debounced patch events.
 * - Continuous gestures (layer drag / resize / rotate, sliders): no events
 *   until the finger/mouse is released — then one patch is written.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ACTIVE_PROJECT_KEY,
  createProject,
  deleteProject,
  listProjects,
  loadProjectState,
  migrateLegacyGallery,
  patchState,
  projectToGalleryEntry,
  replaceState,
  shallowPatch,
} from './projectStore.js'

const DEBOUNCE_MS = 450

/**
 * @param {object} opts
 * @param {Record<string, any>} opts.defaultState
 * @param {(state: Record<string, any>) => void} opts.onHydrateState — apply loaded state into the editor
 * @param {() => Record<string, any>} opts.getState — current design state snapshot
 * @param {Record<string, any>} opts.state — watched for auto-persist
 * @param {boolean} [opts.enabled=true]
 */
export function useProjectPersistence({
  defaultState,
  onHydrateState,
  getState,
  state,
  enabled = true,
}) {
  const [ready, setReady] = useState(false)
  const [projectId, setProjectId] = useState(/** @type {string | null} */ (null))
  const [gallery, setGallery] = useState(/** @type {any[]} */ ([]))

  const lastPersistedRef = useRef(/** @type {Record<string, any> | null} */ (null))
  const skipNextPersistRef = useRef(false)
  /** While > 0, auto-persist is paused (pointer-driven gestures). */
  const gestureDepthRef = useRef(0)
  const projectIdRef = useRef(/** @type {string | null} */ (null))
  const getStateRef = useRef(getState)
  getStateRef.current = getState
  const onHydrateRef = useRef(onHydrateState)
  onHydrateRef.current = onHydrateState
  const defaultStateRef = useRef(defaultState)
  defaultStateRef.current = defaultState

  const refreshGallery = useCallback(async () => {
    const projects = await listProjects()
    // Gallery sheet: only show kind === 'gallery' (explicit saves), not live drafts
    const entries = projects
      .filter(p => p.kind === 'gallery')
      .map(projectToGalleryEntry)
    setGallery(entries)
    return entries
  }, [])

  // Bootstrap: migrate, ensure active draft, hydrate editor
  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    ;(async () => {
      try {
        await migrateLegacyGallery()
        if (cancelled) return

        let activeId = null
        try {
          activeId = localStorage.getItem(ACTIVE_PROJECT_KEY)
        } catch { /* ignore */ }

        let draftState = null
        if (activeId) {
          draftState = await loadProjectState(activeId, defaultState)
          if (!draftState) activeId = null
        }

        if (!activeId) {
          // Seed draft from previous localStorage settings if present
          let seed = { ...defaultState }
          try {
            const raw = localStorage.getItem('fontwow_settings_v1')
            if (raw) seed = { ...defaultState, ...JSON.parse(raw) }
          } catch { /* ignore */ }
          const { project } = await createProject({
            name: 'Draft',
            state: seed,
            kind: 'draft',
          })
          activeId = project.id
          draftState = seed
        }

        if (cancelled) return

        projectIdRef.current = activeId
        setProjectId(activeId)
        try {
          localStorage.setItem(ACTIVE_PROJECT_KEY, activeId)
        } catch { /* ignore */ }

        skipNextPersistRef.current = true
        lastPersistedRef.current = { ...defaultState, ...draftState }
        onHydrateRef.current({ ...defaultState, ...draftState })

        await refreshGallery()
      } catch (err) {
        console.error('project persistence bootstrap failed:', err)
      } finally {
        if (!cancelled) setReady(true)
      }
    })()

    return () => {
      cancelled = true
    }
    // defaultState is stable module-level object from App
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, refreshGallery])

  /** Write one shallow patch from lastPersisted → current state (if any). */
  const commitPatchNow = useCallback(async () => {
    const pid = projectIdRef.current
    if (!pid) return null
    const current = getStateRef.current()
    const prev = lastPersistedRef.current ?? defaultStateRef.current
    const patch = shallowPatch(prev, current)
    if (Object.keys(patch).length === 0) return null
    try {
      const result = await patchState(pid, patch, current)
      lastPersistedRef.current = current
      return result
    } catch (err) {
      console.error('patchState failed:', err)
      return null
    }
  }, [])

  // Debounced event-sourced auto-save of the active draft (skipped during gestures)
  useEffect(() => {
    if (!enabled || !ready || !projectId) return
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false
      lastPersistedRef.current = state
      return
    }
    // Mid-drag/resize/rotate/slider: wait for endGesture → commit on release
    if (gestureDepthRef.current > 0) return

    const timer = setTimeout(() => {
      if (gestureDepthRef.current > 0) return
      void commitPatchNow()
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [state, projectId, ready, enabled, commitPatchNow])

  /** Call on pointerdown before continuous updates (resize, drag, rotate, slider). */
  const beginGesture = useCallback(() => {
    gestureDepthRef.current += 1
  }, [])

  /**
   * Call on pointerup / pointercancel after a continuous gesture.
   * Commits a single event with the final values.
   */
  const endGesture = useCallback(() => {
    gestureDepthRef.current = Math.max(0, gestureDepthRef.current - 1)
    if (gestureDepthRef.current === 0) {
      // rAF so the last setState from onMove has flushed into getState()
      requestAnimationFrame(() => {
        void commitPatchNow()
      })
    }
  }, [commitPatchNow])

  const saveToGallery = useCallback(async () => {
    const current = getStateRef.current()
    const { project } = await createProject({
      name: undefined,
      state: current,
      kind: 'gallery',
    })
    await refreshGallery()
    return project
  }, [refreshGallery])

  const openProject = useCallback(async (id) => {
    const loaded = await loadProjectState(id, defaultState)
    if (!loaded) throw new Error('Project has no events')

    // Open into a fresh draft so gallery originals stay immutable until re-saved
    const { project } = await createProject({
      name: 'Draft',
      state: loaded,
      kind: 'draft',
    })

    projectIdRef.current = project.id
    setProjectId(project.id)
    try {
      localStorage.setItem(ACTIVE_PROJECT_KEY, project.id)
    } catch { /* ignore */ }

    skipNextPersistRef.current = true
    lastPersistedRef.current = { ...defaultState, ...loaded }
    onHydrateRef.current({ ...defaultState, ...loaded })
    return project
  }, [defaultState])

  const removeFromGallery = useCallback(async (id) => {
    await deleteProject(id)
    await refreshGallery()
  }, [refreshGallery])

  /**
   * Force a full snapshot event on the active draft (e.g. before unload).
   */
  const flushSnapshot = useCallback(async () => {
    const pid = projectIdRef.current
    if (!pid) return
    const current = getStateRef.current()
    await replaceState(pid, current)
    lastPersistedRef.current = current
  }, [])

  return {
    ready,
    projectId,
    gallery,
    refreshGallery,
    saveToGallery,
    openProject,
    removeFromGallery,
    flushSnapshot,
    beginGesture,
    endGesture,
  }
}
