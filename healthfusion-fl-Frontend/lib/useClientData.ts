import { useState, useEffect } from "react";
import { ApiError } from "@/services/api/client";
import { DEMO_MODE } from "./demo-mode";

export type ClientDataState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "forbidden"; message: string }
  | { status: "ok"; data: T };

export function useClientData<T>(fetcher: () => Promise<T>): ClientDataState<T> {
  const [state, setState] = useState<ClientDataState<T>>({ status: "loading" });

  useEffect(() => {
    let active = true;
    fetcher()
      .then((data) => {
        if (active) setState({ status: "ok", data });
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 403) {
          setState({ status: "forbidden", message: err.message });
        } else {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "An error occurred while loading data",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [fetcher]);

  return state;
}
