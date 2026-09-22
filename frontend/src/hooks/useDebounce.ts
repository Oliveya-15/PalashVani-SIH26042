import { useEffect, useState } from "react";

/** Delays updating the returned value until `delay` ms of silence.
 * Used by the Dictionary search box so we don't fire an API request on
 * every keystroke (see the project's "debounced search" performance
 * requirement). */
export function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
