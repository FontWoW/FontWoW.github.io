import { useCallback, useRef, useState } from 'react'

const HISTORY_LIMIT = 50

/**
 * Keeps the editable design state and a bounded, in-memory undo/redo history.
 * UI-only changes (such as selecting a layer) can opt out of history.
 */
export function useDesignHistory(initialState) {
  const [state, setState] = useState(initialState)
  const stateRef = useRef(initialState)
  const historyRef = useRef({ past: [], future: [] })
  const [history, setHistory] = useState(historyRef.current)

  const commit = useCallback((nextState, { record = true } = {}) => {
    const currentState = stateRef.current
    if (nextState === currentState) return

    if (record) {
      const nextHistory = {
        past: [...historyRef.current.past, currentState].slice(-HISTORY_LIMIT),
        future: [],
      }
      historyRef.current = nextHistory
      setHistory(nextHistory)
    }

    stateRef.current = nextState
    setState(nextState)
  }, [])

  const patch = useCallback(
    (changes, options) => {
      const nextChanges = typeof changes === 'function' ? changes(stateRef.current) : changes
      commit({ ...stateRef.current, ...nextChanges }, options)
    },
    [commit],
  )

  const undo = useCallback(() => {
    const { past, future } = historyRef.current
    if (!past.length) return

    const previous = past[past.length - 1]
    const nextHistory = { past: past.slice(0, -1), future: [stateRef.current, ...future] }
    historyRef.current = nextHistory
    stateRef.current = previous
    setHistory(nextHistory)
    setState(previous)
  }, [])

  const redo = useCallback(() => {
    const { past, future } = historyRef.current
    if (!future.length) return

    const next = future[0]
    const nextHistory = { past: [...past, stateRef.current].slice(-HISTORY_LIMIT), future: future.slice(1) }
    historyRef.current = nextHistory
    stateRef.current = next
    setHistory(nextHistory)
    setState(next)
  }, [])

  return {
    state,
    commit,
    patch,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  }
}
