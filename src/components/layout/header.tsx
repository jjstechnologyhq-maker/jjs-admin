/**
 * Header — session info, role badge, theme toggle, logout
 * PRD §4.1 — Session timeout: 15 minutes of inactivity
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Moon, Sun, Bell } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/api/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** 15-minute inactivity timeout — PRD §4.1 */
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  COMPLIANCE_OFFICER: "Compliance",
  FINANCE_MANAGER: "Finance",
  CUSTOMER_SUPPORT: "Support",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-500/10 text-red-500 border-red-500/20",
  COMPLIANCE_OFFICER: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  FINANCE_MANAGER: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  CUSTOMER_SUPPORT: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

export function Header() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const session = useAuthStore((state) => state.session);
  const clearSession = useAuthStore((state) => state.clearSession);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Proceed with client-side cleanup even if API fails
    }
    clearSession();
    router.push("/login");
  }, [clearSession, router]);

  // Inactivity timeout — PRD §4.1
  useEffect(() => {
    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [handleLogout]);

  const initials = session?.email
    ? session.email.slice(0, 2).toUpperCase()
    : "AD";

  const primaryRole = session?.permissions?.[0];
  const roleLabel = primaryRole
    ? (ROLE_LABELS[primaryRole] ?? primaryRole)
    : "Unknown";

  const roleColor = primaryRole ? (ROLE_COLORS[primaryRole] ?? "") : "";

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      {/* Left — Page context (populated by ContentShell) */}
      <div id="header-left" />

      {/* Right — Actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle theme</TooltipContent>
        </Tooltip>

        {/* Notifications placeholder */}
        <Tooltip>
          <TooltipTrigger>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 py-1.5"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start md:flex">
                <span className="text-sm font-medium">
                  {session?.email ?? "admin@jjs.com"}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${roleColor}`}
                >
                  {roleLabel}
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">
                  {session?.email ?? "admin@jjs.com"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {roleLabel}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
