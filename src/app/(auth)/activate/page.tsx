"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { apiClient, getErrorCode, getErrorMessage } from "@/api/client";
import type { ActivateAdminRequest, TotpSetupResult } from "@/api/schema";
import { TotpEnroll } from "@/components/auth/totp-enroll";

const schema = z
  .object({
    password: z.string().min(12, "Must be at least 12 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
type FormData = z.infer<typeof schema>;

function ActivateFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [totp, setTotp] = useState<TotpSetupResult | null>(null);
  const { register, handleSubmit, formState } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const body: ActivateAdminRequest = { token, password: data.password };
      const res = await apiClient.post<TotpSetupResult>("/admins/activate", body);
      setTotp(res.data);
    } catch (err) {
      const code = getErrorCode(err);
      if (code === "INVITE_NOT_FOUND") setError("This invite link is invalid.");
      else if (code === "INVITE_ALREADY_USED") setError("This invite has already been used.");
      else if (code === "INVITE_EXPIRED") setError("This invite has expired. Ask for a new one.");
      else setError(getErrorMessage(err, "Could not activate account"));
    }
  };

  if (!token) {
    return (
      <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
        Missing invite token. Please use the link from your invitation email.
      </div>
    );
  }

  if (totp) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-xl font-bold">Set up two-factor auth</h1>
          <FieldDescription>
            Almost done — enroll your authenticator to finish activation.
          </FieldDescription>
        </div>
        <TotpEnroll
          otpauthUrl={totp.otpauthUrl}
          secret={totp.secret}
          onConfirmed={() => {
            toast.success("Account activated. You can now sign in.");
            router.push("/login");
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="size-6" />
        </div>
        <h1 className="mt-2 text-xl font-bold">Activate your account</h1>
        <FieldDescription>Choose a password to get started.</FieldDescription>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
            {formState.errors.password && (
              <p className="text-xs text-destructive">
                {formState.errors.password.message}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {formState.errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {formState.errors.confirmPassword.message}
              </p>
            )}
          </Field>

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
            {formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense>
          <ActivateFlow />
        </Suspense>
      </div>
    </div>
  );
}
