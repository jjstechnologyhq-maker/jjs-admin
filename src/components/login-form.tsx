"use client";

import { useState } from "react";
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
import type { Role } from "@/lib/auth/types";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  // totp: z
  //   .string()
  //   .length(6, "TOTP code must be 6 digits")
  //   .regex(/^\d+$/, "TOTP code must contain only digits"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      // TODO: Replace mock with real API call when backend is ready:
      // const res = await authApi.login({ email: data.email, password: data.password });
      // setSession(
      //   { id: "...", email: data.email, permissions: [...], exp: ... },
      //   res.data.accessToken,
      //   res.data.refreshToken,
      // );

      // Mock successful login — bypasses API while backend is not ready
      // Determine permissions based on email for easy role testing
      let permissions: Role[] = ["SUPER_ADMIN"];
      if (data.email.includes("compliance"))
        permissions = ["COMPLIANCE_OFFICER"];
      if (data.email.includes("finance")) permissions = ["FINANCE_MANAGER"];
      if (data.email.includes("support")) permissions = ["CUSTOMER_SUPPORT"];

      setSession(
        {
          id: "mock_admin_123",
          email: data.email,
          permissions,
          exp: Math.floor(Date.now() / 1000) + 15 * 60,
        },
        "mock_access_token_for_dev",
        "mock_refresh_token_for_dev",
      );

      router.push(redirect);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center mb-4">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ShieldCheck className="size-6" />
              </div>
              <span className="sr-only">Admin Control Centre</span>
            </a>
            <h1 className="text-xl font-bold mt-2">Admin Control Centre</h1>
            <FieldDescription>
              Sign in with your admin credentials
            </FieldDescription>
          </div>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="admin@company.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </Field>

          {/* <Field>
            <FieldLabel htmlFor="totp">Authenticator Code</FieldLabel>
            <Input
              id="totp"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              autoComplete="one-time-code"
              {...register("totp")}
            />
            {errors.totp && (
              <p className="text-xs text-destructive">{errors.totp.message}</p>
            )}
          </Field> */}

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive mt-2">
              {error}
            </div>
          )}

          <Field className="">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sign in
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
