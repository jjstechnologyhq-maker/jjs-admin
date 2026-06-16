/**
 * MSW Provider — conditionally starts mock service worker in development
 */

"use client";

import { useEffect, useState } from "react";

export function MSWProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      import("@/mocks/browser").then(({ worker }) => {
        worker.start({ onUnhandledRequest: "bypass" });
      });
    }
  }, []);

  return <>{children}</>;
}
