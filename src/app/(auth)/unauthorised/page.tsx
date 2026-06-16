/**
 * Unauthorised page — shown when RBAC denies access
 */

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function UnauthorisedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <ShieldAlert className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="text-2xl font-semibold">Access Denied</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        You don&apos;t have permission to access this page. If you believe this
        is an error, contact your Super Admin.
      </p>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        Return to Dashboard
      </Link>
    </div>
  );
}
