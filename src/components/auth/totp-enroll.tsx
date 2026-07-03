"use client";

/**
 * TOTP enrollment — renders the otpauth QR + secret and confirms a code.
 * Shared by the invite-activation and authenticated setup flows.
 */

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { authApi } from "@/api/auth";
import { getErrorMessage } from "@/api/client";

const schema = z.object({
  totpToken: z.string().length(6, "Enter the 6-digit code").regex(/^\d+$/, "Digits only"),
});
type FormData = z.infer<typeof schema>;

export function TotpEnroll({
  otpauthUrl,
  secret,
  onConfirmed,
}: {
  otpauthUrl: string;
  secret: string;
  onConfirmed: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { register, handleSubmit, formState } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await authApi.confirmTotp({ totpToken: data.totpToken });
      onConfirmed();
    } catch (err) {
      setError(getErrorMessage(err, "Invalid or expired code"));
    }
  };

  const copySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-lg bg-white p-3">
          <QRCodeSVG value={otpauthUrl} size={176} />
        </div>
        <FieldDescription className="text-center">
          Scan with Google Authenticator, 1Password, or Authy. Can&apos;t scan? Enter this key manually:
        </FieldDescription>
        <button
          type="button"
          onClick={copySecret}
          className="flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-sm"
        >
          {secret}
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Field>
          <FieldLabel htmlFor="totpToken">Verification code</FieldLabel>
          <Input
            id="totpToken"
            inputMode="numeric"
            placeholder="000000"
            maxLength={6}
            autoComplete="one-time-code"
            {...register("totpToken")}
          />
          {formState.errors.totpToken && (
            <p className="text-xs text-destructive">{formState.errors.totpToken.message}</p>
          )}
        </Field>

        {error && (
          <div className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" className="mt-4 w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirm & activate
        </Button>
      </form>
    </div>
  );
}
