"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { FieldDescription } from "@/components/ui/field";
import { authApi } from "@/api/auth";
import { getErrorCode, getErrorMessage } from "@/api/client";
import type { TotpSetupResult } from "@/api/schema";
import { TotpEnroll } from "@/components/auth/totp-enroll";

export default function SetupTotpPage() {
  const router = useRouter();
  const [totp, setTotp] = useState<TotpSetupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    authApi
      .setupTotp()
      .then((res) => {
        if (!cancelled) setTotp(res);
      })
      .catch((err) => {
        if (cancelled) return;
        if (getErrorCode(err) === "MFA_ALREADY_ENROLLED") {
          setError("MFA is already enrolled on this account.");
        } else {
          setError(getErrorMessage(err, "Could not start MFA setup"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <h1 className="text-xl font-bold">Set up two-factor auth</h1>
          <FieldDescription>
            Scan the QR code with your authenticator app, then confirm a code.
          </FieldDescription>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {totp && (
          <TotpEnroll
            otpauthUrl={totp.otpauthUrl}
            secret={totp.secret}
            onConfirmed={() => {
              toast.success("Two-factor auth enabled.");
              router.push("/");
            }}
          />
        )}
      </div>
    </div>
  );
}
