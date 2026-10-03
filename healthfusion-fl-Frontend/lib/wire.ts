/**
 * The real backend's exact response casing isn't known here (no
 * docs/frontend_api_contract.md was provided), so this assumes the
 * conventional FastAPI/Pydantic default -- snake_case JSON -- and
 * normalizes every live response to the camelCase shape our TypeScript
 * types already use. Demo-mode data never passes through this; it's
 * already camelCase because we authored it that way.
 */
type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

export function snakeToCamelDeep<T>(value: unknown): T {
  if (Array.isArray(value)) {
    return value.map((v) => snakeToCamelDeep(v)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, Json> = {};
    for (const [k, v] of Object.entries(value as Record<string, Json>)) {
      out[snakeToCamelKey(k)] = snakeToCamelDeep(v);
    }
    return out as unknown as T;
  }
  return value as T;
}
