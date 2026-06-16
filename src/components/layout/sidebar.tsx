/**
 * Sidebar navigation — role-filtered
 * PRD §4.1 — Role from Zustand drives sidebar nav
 * Design ref: Untitled UI Admin Dashboard — dense sidebar with icon + label, section groupings
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  ArrowDownToLine,
  ArrowLeftRight,
  Coins,
  Wallet,
  Zap,
  HeadphonesIcon,
  ShieldCheck,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { ROLES, type Role } from "@/lib/auth/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const ALL_ROLES: Role[] = Object.values(ROLES);

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        roles: ALL_ROLES,
      },
    ],
  },
  {
    title: "Compliance",
    items: [
      {
        label: "KYC Queue",
        href: "/kyc",
        icon: FileCheck,
        roles: [ROLES.SUPER_ADMIN, ROLES.COMPLIANCE_OFFICER],
      },
      {
        label: "Users",
        href: "/users",
        icon: Users,
        roles: [
          ROLES.SUPER_ADMIN,
          ROLES.COMPLIANCE_OFFICER,
          ROLES.CUSTOMER_SUPPORT,
        ],
      },
      {
        label: "Transactions",
        href: "/transactions",
        icon: ArrowLeftRight,
        roles: [
          ROLES.SUPER_ADMIN,
          ROLES.COMPLIANCE_OFFICER,
          ROLES.FINANCE_MANAGER,
        ],
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        label: "Withdrawals",
        href: "/withdrawals",
        icon: ArrowDownToLine,
        roles: [ROLES.SUPER_ADMIN, ROLES.FINANCE_MANAGER],
      },
      {
        label: "Pricing & Fees",
        href: "/pricing",
        icon: Coins,
        roles: [ROLES.SUPER_ADMIN, ROLES.FINANCE_MANAGER],
      },
      {
        label: "Liquidity",
        href: "/liquidity",
        icon: Wallet,
        roles: [ROLES.SUPER_ADMIN, ROLES.FINANCE_MANAGER],
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "VAS",
        href: "/vas",
        icon: Zap,
        roles: [ROLES.SUPER_ADMIN, ROLES.FINANCE_MANAGER],
      },
      {
        label: "Support",
        href: "/support",
        icon: HeadphonesIcon,
        roles: [ROLES.SUPER_ADMIN, ROLES.CUSTOMER_SUPPORT],
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "Admin Management",
        href: "/admin-management",
        icon: ShieldCheck,
        roles: [ROLES.SUPER_ADMIN],
      },
      {
        label: "Audit Log",
        href: "/audit",
        icon: ScrollText,
        roles: [ROLES.SUPER_ADMIN, ROLES.COMPLIANCE_OFFICER],
      },
      {
        label: "System Config",
        href: "/system-config",
        icon: Settings,
        roles: [ROLES.SUPER_ADMIN],
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const session = useAuthStore((state) => state.session);
  const [collapsed, setCollapsed] = useState(false);

  const userPermissions = session?.permissions ?? [];

  // Filter nav items based on permissions (array intersection)
  const filteredSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) =>
      userPermissions.some((perm) => item.roles.includes(perm)),
    ),
  })).filter((section) => section.items.length > 0);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-[260px]",
      )}
    >
      {/* Logo / Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <ShieldCheck className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-semibold tracking-tight">
              Admin Centre
            </span>
            <span className="truncate text-xs text-muted-foreground">
              Control Panel
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="flex flex-col gap-1 px-2">
          {filteredSections.map((section, idx) => (
            <div key={section.title}>
              {idx > 0 && <Separator className="my-2" />}
              {!collapsed && (
                <span className="mb-1 block px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </span>
              )}
              {section.items.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                const linkContent = (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive
                          ? "text-sidebar-primary"
                          : "text-muted-foreground group-hover:text-sidebar-foreground",
                      )}
                    />
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return linkContent;
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
