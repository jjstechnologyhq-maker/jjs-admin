"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { useAuthStore } from "@/stores/auth-store";
import { authApi, isForcePasswordChange } from "@/api/auth";
import { getErrorCode, getErrorMessage } from "@/api/client";

const credentialsSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type CredentialsData = z.infer<typeof credentialsSchema>;

const totpSchema = z.object({
  totpToken: z
    .string()
    .length(6, "Enter the 6-digit code")
    .regex(/^\d+$/, "Digits only"),
});
type TotpData = z.infer<typeof totpSchema>;

const SESSION_TTL_SECONDS = 5 * 60;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const setSession = useAuthStore((state) => state.setSession);

  const [step, setStep] = useState<"credentials" | "totp">("credentials");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(SESSION_TTL_SECONDS);
  const [error, setError] = useState<string | null>(null);

  const credentialsForm = useForm<CredentialsData>({
    resolver: zodResolver(credentialsSchema),
  });
  const totpForm = useForm<TotpData>({ resolver: zodResolver(totpSchema) });

  // Countdown for the 5-minute session-token window. Expiry is derived in render
  // (below) rather than set synchronously here.
  const expired = step === "totp" && secondsLeft <= 0;
  useEffect(() => {
    if (step !== "totp" || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, secondsLeft]);

  const onCredentials = async (data: CredentialsData) => {
    setError(null);
    try {
      const result = await authApi.login(data);
      setSessionToken(result.sessionToken);
      setSecondsLeft(SESSION_TTL_SECONDS);
      setStep("totp");
    } catch (err) {
      const code = getErrorCode(err);
      if (code === "TOO_MANY_ATTEMPTS") {
        setError("Too many failed attempts. Try again in 10 minutes.");
      } else if (code === "ACCOUNT_SUSPENDED") {
        setError("This account is suspended. Contact a super admin.");
      } else {
        setError(getErrorMessage(err, "Invalid email or password"));
      }
    }
  };

  const onTotp = async (data: TotpData) => {
    if (!sessionToken) return;
    setError(null);
    try {
      const result = await authApi.verifyTotp({
        sessionToken,
        totpToken: data.totpToken,
      });

      if (isForcePasswordChange(result)) {
        router.push("/change-password?forced=1");
        return;
      }

      setSession(result.admin, result.accessToken, result.refreshToken);
      router.push(redirect);
    } catch (err) {
      const code = getErrorCode(err);
      if (code === "SESSION_EXPIRED") {
        setError("Your session expired. Please sign in again.");
        setStep("credentials");
      } else if (code === "MFA_NOT_ENROLLED") {
        setError(
          "MFA is not set up for this account. Use your activation link or ask a super admin to reset MFA.",
        );
      } else {
        setError(getErrorMessage(err, "Invalid or expired code"));
      }
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center mb-2">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="size-6" />
        </div>
        <h1 className="text-xl font-bold mt-2">Admin Control Centre</h1>
        <FieldDescription>
          {step === "credentials"
            ? "Sign in with your admin credentials"
            : "Enter the 6-digit code from your authenticator app"}
        </FieldDescription>
      </div>

      {step === "credentials" ? (
        <form onSubmit={credentialsForm.handleSubmit(onCredentials)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="admin@company.com"
                autoComplete="email"
                {...credentialsForm.register("email")}
              />
              {credentialsForm.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {credentialsForm.formState.errors.email.message}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...credentialsForm.register("password")}
              />
              {credentialsForm.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {credentialsForm.formState.errors.password.message}
                </p>
              )}
            </Field>

            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Field>
              <Button
                type="submit"
                className="w-full"
                disabled={credentialsForm.formState.isSubmitting}
              >
                {credentialsForm.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Continue
              </Button>
            </Field>
          </FieldGroup>
        </form>
      ) : (
        <form onSubmit={totpForm.handleSubmit(onTotp)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="totpToken">Authenticator Code</FieldLabel>
              <Input
                id="totpToken"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
                {...totpForm.register("totpToken")}
              />
              {totpForm.formState.errors.totpToken && (
                <p className="text-xs text-destructive">
                  {totpForm.formState.errors.totpToken.message}
                </p>
              )}
              <FieldDescription>
                {expired ? (
                  <span className="text-destructive">
                    The verification window expired — go back and sign in again.
                  </span>
                ) : (
                  <>
                    Code expires in {Math.floor(secondsLeft / 60)}:
                    {String(secondsLeft % 60).padStart(2, "0")}
                  </>
                )}
              </FieldDescription>
            </Field>

            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Field className="gap-2">
              <Button
                type="submit"
                className="w-full"
                disabled={totpForm.formState.isSubmitting || expired}
              >
                {totpForm.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Verify & sign in
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("credentials");
                  setError(null);
                }}
              >
                Back
              </Button>
            </Field>
          </FieldGroup>
        </form>
      )}
    </div>
  );
}
