"use client";

/**
 * LoginForm — Full multi-step authentication flow.
 *
 * Handles both first-time seeded-admin login AND subsequent logins:
 *
 * First-time flow:
 *   1. credentials  → POST /auth/login → sessionToken
 *   2. totp-setup   → POST /auth/totp/setup → QR code + debugTotpToken
 *   3. totp-confirm → POST /auth/totp/confirm → MFA enrolled, fresh debugTotpToken
 *   4. totp-verify  → POST /auth/totp/verify → { forcePasswordChange: true }
 *   5. force-pw     → POST /auth/force-password-change → real JWT pair
 *
 * Subsequent flow:
 *   1. credentials  → POST /auth/login → sessionToken
 *   2. totp-verify  → POST /auth/totp/verify → real JWT pair
 *
 * The sessionToken is ALWAYS passed in the request body, never as Bearer.
 */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ShieldCheck,
  Loader2,
  KeyRound,
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  Lock,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

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
import { authApi, isForcePasswordChange, type TotpSetupResponse } from "@/api/auth";
import { getErrorCode, getErrorMessage } from "@/api/client";

// ── Zod schemas ────────────────────────────────────────────────────────────

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

const newPasswordSchema = z
  .object({
    newPassword: z.string().min(12, "Must be at least 12 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
type NewPasswordData = z.infer<typeof newPasswordSchema>;

// ── Constants ──────────────────────────────────────────────────────────────

const SESSION_TTL_SECONDS = 5 * 60;

type Step =
  | "credentials"
  | "totp-setup"
  | "totp-confirm"
  | "totp-verify"
  | "force-pw";

// ── Step indicator ─────────────────────────────────────────────────────────

const FIRST_TIME_STEPS: { key: Step; label: string }[] = [
  { key: "credentials", label: "Sign In" },
  { key: "totp-setup", label: "Setup MFA" },
  { key: "totp-confirm", label: "Confirm" },
  { key: "totp-verify", label: "Verify" },
  { key: "force-pw", label: "Password" },
];

function StepIndicator({
  currentStep,
  isFirstTime,
}: {
  currentStep: Step;
  isFirstTime: boolean;
}) {
  if (!isFirstTime) return null;

  const steps = FIRST_TIME_STEPS;
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center justify-center gap-1.5 mb-4">
      {steps.map((step, idx) => {
        const isComplete = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        return (
          <div key={step.key} className="flex items-center gap-1.5">
            <div
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                isComplete &&
                  "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
                isCurrent &&
                  "bg-primary text-primary-foreground shadow-sm scale-110",
                !isComplete &&
                  !isCurrent &&
                  "bg-muted text-muted-foreground/50",
              )}
            >
              {isComplete ? (
                <CheckCircle2 className="size-3.5" />
              ) : (
                idx + 1
              )}
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "h-px w-4 transition-colors duration-300",
                  idx < currentIndex ? "bg-emerald-500/40" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const setSession = useAuthStore((state) => state.setSession);

  // Flow state
  const [step, setStep] = useState<Step>("credentials");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [totpSetup, setTotpSetup] = useState<TotpSetupResponse | null>(null);
  const [debugToken, setDebugToken] = useState<string | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [copied, setCopied] = useState(false);

  // Session countdown
  const [secondsLeft, setSecondsLeft] = useState(SESSION_TTL_SECONDS);
  const expired = step !== "credentials" && secondsLeft <= 0;

  // Global error
  const [error, setError] = useState<string | null>(null);
  // Loading for non-form steps
  const [loading, setLoading] = useState(false);

  // Forms
  const credentialsForm = useForm<CredentialsData>({
    resolver: zodResolver(credentialsSchema),
  });
  const totpForm = useForm<TotpData>({ resolver: zodResolver(totpSchema) });
  const confirmForm = useForm<TotpData>({ resolver: zodResolver(totpSchema) });
  const verifyForm = useForm<TotpData>({ resolver: zodResolver(totpSchema) });
  const passwordForm = useForm<NewPasswordData>({
    resolver: zodResolver(newPasswordSchema),
  });

  // Countdown timer for 5-min session window
  useEffect(() => {
    if (step === "credentials" || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, secondsLeft]);

  // ── Step 1: Credentials ────────────────────────────────────────────────

  const onCredentials = async (data: CredentialsData) => {
    setError(null);
    try {
      const result = await authApi.login(data);
      setSessionToken(result.sessionToken);
      setSecondsLeft(SESSION_TTL_SECONDS);

      if (result.mfaRequired) {
        // Need to determine: is MFA already enrolled or first time?
        // Try totp/verify first. If the server returns MFA_NOT_ENROLLED (403),
        // we know it's first-time and need to go through setup.
        // But it's cleaner to attempt totp/setup: if 409 → already enrolled → go to verify.
        setLoading(true);
        try {
          const setupResult = await authApi.setupTotp(result.sessionToken);
          // Success → first-time flow
          setTotpSetup(setupResult);
          setDebugToken(setupResult.debugTotpToken ?? null);
          setIsFirstTime(true);
          setStep("totp-setup");
        } catch (setupErr) {
          const setupCode = getErrorCode(setupErr);
          if (setupCode === "MFA_ALREADY_ENROLLED") {
            // Already enrolled → go straight to verify
            setIsFirstTime(false);
            setStep("totp-verify");
          } else {
            setError(
              getErrorMessage(setupErr, "Could not check MFA enrollment"),
            );
          }
        } finally {
          setLoading(false);
        }
      }
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

  // ── Step 3: Confirm TOTP enrollment ────────────────────────────────────

  const onConfirmTotp = async (data: TotpData) => {
    if (!sessionToken) return;
    setError(null);
    try {
      const result = await authApi.confirmTotp({
        sessionToken,
        totpToken: data.totpToken,
      });
      // Store the fresh debugTotpToken for the next step
      if (result.debugTotpToken) {
        setDebugToken(result.debugTotpToken);
      } else {
        setDebugToken(null);
      }
      setStep("totp-verify");
    } catch (err) {
      const code = getErrorCode(err);
      if (code === "SESSION_EXPIRED") {
        setError("Session expired. Please sign in again.");
        resetToCredentials();
      } else {
        setError(getErrorMessage(err, "Invalid or expired code"));
      }
    }
  };

  // ── Step 4: Verify TOTP ────────────────────────────────────────────────

  const onVerifyTotp = async (data: TotpData) => {
    if (!sessionToken) return;
    setError(null);
    try {
      const result = await authApi.verifyTotp({
        sessionToken,
        totpToken: data.totpToken,
      });

      if (isForcePasswordChange(result)) {
        // First-time admin: needs to set a new password
        setStep("force-pw");
        return;
      }

      // Normal login complete
      setSession(result.admin, result.accessToken, result.refreshToken);
      router.push(redirect);
    } catch (err) {
      const code = getErrorCode(err);
      if (code === "SESSION_EXPIRED") {
        setError("Session expired. Please sign in again.");
        resetToCredentials();
      } else if (code === "MFA_NOT_ENROLLED") {
        setError(
          "MFA is not set up. Use your activation link or ask a super admin to reset MFA.",
        );
      } else {
        setError(getErrorMessage(err, "Invalid or expired code"));
      }
    }
  };

  // ── Step 5: Force password change ──────────────────────────────────────

  const onForcePasswordChange = async (data: NewPasswordData) => {
    if (!sessionToken) return;
    setError(null);
    try {
      const result = await authApi.forcePasswordChange(
        sessionToken,
        data.newPassword,
      );
      // Login complete — we have real tokens
      setSession(result.admin, result.accessToken, result.refreshToken);
      router.push(redirect);
    } catch (err) {
      const code = getErrorCode(err);
      if (code === "SESSION_EXPIRED") {
        setError("Session expired. Please sign in again.");
        resetToCredentials();
      } else if (code === "PASSWORD_SAME_AS_CURRENT") {
        setError("New password must differ from the seeded password.");
      } else {
        setError(getErrorMessage(err, "Could not change password"));
      }
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────

  const resetToCredentials = () => {
    setStep("credentials");
    setSessionToken(null);
    setTotpSetup(null);
    setDebugToken(null);
    setIsFirstTime(false);
    setError(null);
  };

  const copySecret = async () => {
    if (!totpSetup?.secret) return;
    await navigator.clipboard.writeText(totpSetup.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Step icons + headings ──────────────────────────────────────────────

  const stepConfig: Record<
    Step,
    { icon: React.ReactNode; title: string; description: string }
  > = {
    credentials: {
      icon: <ShieldCheck className="size-6" />,
      title: "Admin Control Centre",
      description: "Sign in with your admin credentials",
    },
    "totp-setup": {
      icon: <Smartphone className="size-6" />,
      title: "Set up two-factor auth",
      description: "Scan the QR code with your authenticator app",
    },
    "totp-confirm": {
      icon: <CheckCircle2 className="size-6" />,
      title: "Confirm enrollment",
      description: "Enter the code to confirm your authenticator is working",
    },
    "totp-verify": {
      icon: <KeyRound className="size-6" />,
      title: "Verify your identity",
      description: "Enter the 6-digit code from your authenticator app",
    },
    "force-pw": {
      icon: <Lock className="size-6" />,
      title: "Set your password",
      description: "Choose a new password (at least 12 characters) to replace the seeded one",
    },
  };

  const { icon, title, description } = stepConfig[step];

  // ── Session expiry banner ──────────────────────────────────────────────

  const SessionTimer = () => {
    if (step === "credentials") return null;
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-1.5 text-xs font-medium rounded-full px-3 py-1 mx-auto w-fit",
          expired
            ? "bg-destructive/10 text-destructive"
            : secondsLeft < 60
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "bg-muted text-muted-foreground",
        )}
      >
        {expired ? (
          "Session expired — sign in again"
        ) : (
          <>
            <span className="inline-block size-1.5 rounded-full bg-current animate-pulse" />
            Session expires in {formatTime(secondsLeft)}
          </>
        )}
      </div>
    );
  };

  // ── Debug token hint ───────────────────────────────────────────────────

  const DebugTokenHint = ({ token }: { token: string | null }) => {
    if (!token) return null;
    return (
      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
        <span className="font-semibold">Dev mode:</span> Use code{" "}
        <code className="rounded bg-amber-500/10 px-1.5 py-0.5 font-mono font-bold">
          {token}
        </code>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className={cn("flex flex-col gap-5", className)} {...props}>
      <StepIndicator currentStep={step} isFirstTime={isFirstTime} />

      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          {icon}
        </div>
        <h1 className="text-xl font-bold mt-2">{title}</h1>
        <FieldDescription>{description}</FieldDescription>
      </div>

      <SessionTimer />

      {/* Loading spinner (for auto-detection of MFA enrollment) */}
      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Global error */}
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ─── Step: Credentials ──────────────────────────────────────────── */}
      {step === "credentials" && !loading && (
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
      )}

      {/* ─── Step: TOTP Setup (QR Code) ─────────────────────────────────── */}
      {step === "totp-setup" && totpSetup && (
        <div className="flex flex-col gap-5">
          {/* QR code */}
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <QRCodeSVG value={totpSetup.otpauthUrl} size={180} />
            </div>
            <FieldDescription className="text-center text-xs">
              Scan with Google Authenticator, 1Password, or Authy.
              <br />
              Can&apos;t scan? Enter this key manually:
            </FieldDescription>
            <button
              type="button"
              onClick={copySecret}
              className="flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-sm hover:bg-muted transition-colors"
            >
              {totpSetup.secret}
              {copied ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>

          <DebugTokenHint token={debugToken} />

          <Button
            className="w-full"
            onClick={() => {
              setError(null);
              setStep("totp-confirm");
            }}
            disabled={expired}
          >
            I&apos;ve scanned the code
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={resetToCredentials}
          >
            Back
          </Button>
        </div>
      )}

      {/* ─── Step: TOTP Confirm ─────────────────────────────────────────── */}
      {step === "totp-confirm" && (
        <form onSubmit={confirmForm.handleSubmit(onConfirmTotp)}>
          <FieldGroup>
            <DebugTokenHint token={debugToken} />

            <Field>
              <FieldLabel htmlFor="confirmTotpToken">
                Authenticator Code
              </FieldLabel>
              <Input
                id="confirmTotpToken"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                autoFocus
                {...confirmForm.register("totpToken")}
              />
              {confirmForm.formState.errors.totpToken && (
                <p className="text-xs text-destructive">
                  {confirmForm.formState.errors.totpToken.message}
                </p>
              )}
            </Field>

            <Field className="gap-2">
              <Button
                type="submit"
                className="w-full"
                disabled={confirmForm.formState.isSubmitting || expired}
              >
                {confirmForm.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm enrollment
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setError(null);
                  setStep("totp-setup");
                }}
              >
                Back
              </Button>
            </Field>
          </FieldGroup>
        </form>
      )}

      {/* ─── Step: TOTP Verify ──────────────────────────────────────────── */}
      {step === "totp-verify" && (
        <form onSubmit={verifyForm.handleSubmit(onVerifyTotp)}>
          <FieldGroup>
            <DebugTokenHint token={debugToken} />

            <Field>
              <FieldLabel htmlFor="verifyTotpToken">
                Authenticator Code
              </FieldLabel>
              <Input
                id="verifyTotpToken"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                autoFocus
                {...verifyForm.register("totpToken")}
              />
              {verifyForm.formState.errors.totpToken && (
                <p className="text-xs text-destructive">
                  {verifyForm.formState.errors.totpToken.message}
                </p>
              )}
            </Field>

            <Field className="gap-2">
              <Button
                type="submit"
                className="w-full"
                disabled={verifyForm.formState.isSubmitting || expired}
              >
                {verifyForm.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Verify &amp; sign in
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setError(null);
                  if (isFirstTime) {
                    setStep("totp-confirm");
                  } else {
                    resetToCredentials();
                  }
                }}
              >
                Back
              </Button>
            </Field>
          </FieldGroup>
        </form>
      )}

      {/* ─── Step: Force Password Change ────────────────────────────────── */}
      {step === "force-pw" && (
        <form onSubmit={passwordForm.handleSubmit(onForcePasswordChange)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="newPassword">New password</FieldLabel>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Minimum 12 characters"
                autoFocus
                {...passwordForm.register("newPassword")}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-destructive">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">
                Confirm new password
              </FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                {...passwordForm.register("confirmPassword")}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </Field>

            <Field>
              <Button
                type="submit"
                className="w-full"
                disabled={passwordForm.formState.isSubmitting || expired}
              >
                {passwordForm.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Set password &amp; sign in
              </Button>
            </Field>
          </FieldGroup>
        </form>
      )}
    </div>
  );
}
