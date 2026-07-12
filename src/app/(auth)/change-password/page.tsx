"use client";

/**
 * Change Password page — for already-authenticated admins who want to
 * voluntarily change their password.
 *
 * NOTE: The "forced password change" for first-time seeded admins is now
 * handled inline in the LoginForm (Step 5: force-pw), which uses
 * POST /auth/force-password-change with the sessionToken in the body.
 * This page uses the authenticated POST /auth/change-password endpoint
 * (Bearer token required).
 */

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { authApi } from "@/api/auth";
import { getErrorCode, getErrorMessage } from "@/api/client";
import { useAuthStore } from "@/stores/auth-store";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(12, "Must be at least 12 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
type FormData = z.infer<typeof schema>;

function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forced = searchParams.get("forced") === "1";
  const clearSession = useAuthStore((s) => s.clearSession);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // If someone navigates here with ?forced=1 but no session, redirect to login.
  // The forced password change for first-time logins is handled in LoginForm.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (forced && !isAuthenticated) {
    // The first-time forced-pw flow is now inline in LoginForm.
    // Redirect there.
    if (typeof window !== "undefined") {
      router.replace("/login");
    }
    return null;
  }

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password changed. Please sign in with your new password.");
      // A fresh login is required afterwards.
      clearSession();
      router.push("/login");
    } catch (err) {
      const code = getErrorCode(err);
      if (code === "INVALID_CURRENT_PASSWORD") {
        setError("Current password is incorrect.");
      } else if (code === "PASSWORD_SAME_AS_CURRENT") {
        setError("New password must differ from your current password.");
      } else {
        setError(getErrorMessage(err, "Could not change password"));
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <KeyRound className="size-6" />
        </div>
        <h1 className="mt-2 text-xl font-bold">Change your password</h1>
        <FieldDescription>
          Choose a new password of at least 12 characters.
        </FieldDescription>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              {...register("currentPassword")}
            />
            {formState.errors.currentPassword && (
              <p className="text-xs text-destructive">
                {formState.errors.currentPassword.message}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="newPassword">New password</FieldLabel>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...register("newPassword")}
            />
            {formState.errors.newPassword && (
              <p className="text-xs text-destructive">
                {formState.errors.newPassword.message}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
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
            Change password
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense>
          <ChangePasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
