/**
 * JWT utilities — decode-only, no verification
 * Backend owns auth; we only decode to read the permissions claim.
 * PRD §4.1 — never trust for actual authorisation
 */

import type { JWTPayload, Role } from "./types";

/**
 * Decode a JWT without verification.
 * Backend validates the token — we only extract the payload for UI-level RBAC.
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf-8")
    );

    return {
      sub: decoded.sub,
      email: decoded.email,
      permissions: decoded.permissions as Role[],
      exp: decoded.exp,
      iat: decoded.iat,
    };
  } catch {
    return null;
  }
}

/**
 * Check if a JWT is expired.
 * Adds a 30-second buffer to account for clock skew.
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now - 30;
}

/**
 * Extract the permissions from a raw JWT string.
 * Returns empty array if token is invalid or expired.
 */
export function getPermissionsFromToken(token: string): Role[] {
  if (isTokenExpired(token)) return [];
  const payload = decodeJWT(token);
  return payload?.permissions ?? [];
}
