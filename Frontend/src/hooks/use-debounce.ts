"use client"

import { useEffect, useState } from "react"

/**
 * Returns a debounced copy of `value` that only updates after `delayMs` of
 * no further changes — used to avoid firing a network request on every
 * keystroke (e.g. a table toolbar's search input, per
 * `.claude/ui/playbooks/data-table.md`).
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => clearTimeout(timeoutId)
  }, [value, delayMs])

  return debouncedValue
}
