/**
 * Next.js Proxy (formerly middleware) — Route-level RBAC guard
 * PRD §4.2 — No page renders before auth is confirmed.
 * Client-side guards are supplementary only.
 *
 * ⚠️  AUTH GUARD DISABLED — intentionally open for backend team review.
 *     All routes are accessible without a token. Re-enable the cookie check
 *     in the proxy body once the backend auth endpoints are ready.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// import { hasAccess, isPublicRoute } from "@/lib/auth/route-access";
// import type { Role } from "@/lib/auth/types";

// const COOKIE_NAME = "admin_token";

// /**
//  * Lightweight JWT decode for Edge Runtime (no Node.js Buffer).
//  * Decode-only — backend validates the signature.
//  */
// function decodeJWTEdge(token: string): { role: Role; sub: string; exp: number } | null {
//   try {
//     const parts = token.split(".");
//     if (parts.length !== 3) return null;
//     const payload = parts[1];
//     const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
//     return {
//       sub: decoded.sub,
//       role: decoded.role as Role,
//       exp: decoded.exp,
//     };
//   } catch {
//     return null;
//   }
// }

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ⚠️  AUTH GUARD DISABLED — all routes are open so the backend team can
  //     explore the platform and identify required endpoints.
  //     Re-enable by uncommenting the block below.
  //
  // const token = req.cookies.get("admin_token")?.value;
  // if (!token) {
  //   const loginUrl = new URL("/login", req.url);
  //   loginUrl.searchParams.set("redirect", pathname);
  //   return NextResponse.redirect(loginUrl);
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
