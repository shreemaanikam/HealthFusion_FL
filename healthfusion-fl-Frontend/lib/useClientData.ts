"use client";
/**
 * useClientData — fetch backend data inside a client component.
 *
 * Why client-side fetching for protected pages:
 *   The JWT lives in sessionStorage (set after login by lib/token.ts). Server
 *   Components running in Next.js SSR have no access to sessionStorage, so any
 *   API call they make would be anonymous — which now correctly returns 401.
 *
 *   By fetching inside a Client Component, the call happens in the browser
 *   after AuthGate has confirmed the session, so apiFetch() automatically
 *   attaches Authorization: Bearer <token> from lib/token.ts.
 */
import { useState, useEffect } from "react";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; data: T };

export function useClientData<T>(fetcher: () => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ status: "ok", data });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Failed to load data.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
