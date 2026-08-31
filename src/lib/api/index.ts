// Single entry point for every data access in the app.
// Point `api` at a different adapter (HTTP, RPC, Cloud) without touching the UI.

import { mockAdapter } from "./mock-adapter";
import type { LifeOsAdapter } from "./types";

let adapter: LifeOsAdapter = mockAdapter;

export function configureApi(next: LifeOsAdapter) {
  adapter = next;
}

export const api: LifeOsAdapter = new Proxy({} as LifeOsAdapter, {
  get: (_t, prop: string) => (adapter as unknown as Record<string, unknown>)[prop],
});

export { ApiError } from "./types";
export type { LifeOsAdapter } from "./types";
