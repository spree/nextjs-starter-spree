import type { State } from "@spree/sdk";
import { useEffect, useState, useTransition } from "react";

/**
 * Fetches states for a country ISO code, with cleanup on unmount/change.
 * Returns [states, loading].
 */
export function useCountryStates(
  countryIso: string,
  fetchStates: (countryIso: string) => Promise<State[]>,
  enabled = true,
): [State[], boolean] {
  const [states, setStates] = useState<State[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!enabled || !countryIso) {
      setStates([]);
      return;
    }

    let cancelled = false;

    startTransition(() => {
      fetchStates(countryIso)
        .then((result) => {
          if (!cancelled) setStates(result);
        })
        .catch(() => {
          if (!cancelled) setStates([]);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [countryIso, fetchStates, enabled]);

  return [states, isPending];
}
