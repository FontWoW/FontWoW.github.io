import { useCallback, useRef, useState } from 'react'

const HISTORY_LIMIT = 50

/**
 * Keeps the editable design state and a bounded, in-memory undo/redo history.
 * UI-only changes (such as selecting a layer) can opt out of history.
 */
export function useDesignHistory(initialState) {
  const [state, setState] = useState(initialState)
  const stateRef = useRef(initialState)
  const [history, setHistory] = useState({ past: [], future: [] })

  const commit = useCallback((nextState, { record = true } = {}) => {
    const currentState = stateRef.current
    if (nextState === currentState) return

    if (record) {
      setHistory(({ past }) => ({
        past: [...past, currentState].slice(-HISTORY_LIMIT),
        future: [],
      }))
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
    setHistory(({ past, future }) => {
      if (!past.length) return { past, future }
      const previous = past[past.length - 1]
      const current = stateRef.current
      stateRef.current = previous
      setState(previous)
      return { past: past.slice(0, -1), future: [current, ...future] }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory(({ past, future }) => {
      if (!future.length) return { past, future }
      const next = future[0]
      const current = stateRef.current
      stateRef.current = next
      setState(next)
      return { past: [...past, current].slice(-HISTORY_LIMIT), future: future.slice(1) }
    })
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
