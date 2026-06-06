import { useCallback, useRef } from 'react'

/**
 * Returns pointer event handlers for long-press detection.
 * didLongPress() returns true once if a long press fired, then resets.
 * Use it in onClick to skip normal click handling after a long press.
 */
export function useLongPress(onLongPress: () => void, delay = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firedRef = useRef(false)

  const start = useCallback(() => {
    firedRef.current = false
    timerRef.current = setTimeout(() => {
      firedRef.current = true
      onLongPress()
    }, delay)
  }, [onLongPress, delay])

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const didLongPress = useCallback((): boolean => {
    const result = firedRef.current
    firedRef.current = false
    return result
  }, [])

  return {
    handlers: {
      onPointerDown: start,
      onPointerUp: cancel,
      onPointerLeave: cancel,
    },
    didLongPress,
  }
}
