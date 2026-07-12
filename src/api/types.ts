/**
 * Shared API types — cursor pagination + common query params.
 *
 * Response/entity types come from the generated spec (`./schema`). This file
 * only holds cross-cutting client helpers that aren't 1:1 spec schemas.
 *
 * ## Conventions (from openapi-admin.yaml)
 * - **Cursor pagination**: list responses are `{ data, meta: { nextCursor, hasMore, total } }`.
 *   The cursor is opaque — never decode or construct it.
 * - **Monetary values are strings** — parse with helpers in `@/lib/money`.
 * - **Datetimes** are ISO-8601 UTC strings.
 * - **Errors**: `{ code, message, details: { errorCode } }` — see `getErrorCode` in `./client`.
 */

import type { PaginatedMeta } from "./schema";

export type { PaginatedMeta };

/** Generic cursor-paginated envelope. */
export interface Paginated<T> {
  data: T[];
  meta: PaginatedMeta;
}

/** Common query params for cursor-paginated list endpoints. */
export interface CursorParams {
  cursor?: string;
  limit?: number;
}

/** Strip undefined/empty values so they don't become `?x=undefined` in the URL. */
export function cleanParams<T extends object>(params: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      out[key as keyof T] = value as T[keyof T];
    }
  }
  return out;
}
