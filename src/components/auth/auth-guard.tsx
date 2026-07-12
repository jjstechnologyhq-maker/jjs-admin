"use client";

/**
 * Client-side route guard for the dashboard.
 *
 * Tokens are Bearer/localStorage (not cookies), so route protection happens on
 * the client after the Zustand store hydrates. Unauthenticated users are sent to
 * /login; authenticated users lacking the role for the current route go to
 * /unauthorised. Server-side auth is still enforced by the API on every request.
 */

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuthStore } from "@/stores/auth-store";
import { hasAccess } from "@/lib/auth/route-access";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAuthStore((s) => s.session);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [hydrated, setHydrated] = useState(false);

  // Wait for the persisted store to rehydrate (client only) before deciding.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated || !session) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!hasAccess(session.role, pathname)) {
      router.replace("/unauthorised");
    }
  }, [hydrated, isAuthenticated, session, pathname, router]);

  const authorized =
    hydrated && isAuthenticated && !!session && hasAccess(session.role, pathname);

  if (!authorized) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
