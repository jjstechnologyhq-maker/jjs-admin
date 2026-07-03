"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
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
  ShieldAlert,
  ScrollText,
  ChartBarIcon,
} from "lucide-react";

import { useAuthStore } from "@/stores/auth-store";
import { ROLES, type Role } from "@/lib/auth/types";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const ALL_ROLES: Role[] = Object.values(ROLES);

export const NAV_SECTIONS: NavSection[] = [
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
      {
        label: "Risk",
        href: "/risk",
        icon: ShieldAlert,
        roles: [ROLES.SUPER_ADMIN, ROLES.COMPLIANCE_OFFICER],
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
        roles: [ROLES.SUPER_ADMIN],
      },
      {
        label: "Analytics & Reporting",
        href: "/analytics",
        icon: ChartBarIcon,
        roles: ALL_ROLES,
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const session = useAuthStore((state) => state.session);
  const role = session?.role;

  // When there's no active session yet, show nothing role-specific.
  // Once a role is present, filter each section to items that role can see.
  const filteredSections = !role
    ? []
    : NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) => item.roles.includes(role)),
      })).filter((section) => section.items.length > 0);

  // We map session data for NavUser
  const userData = {
    name: session?.email?.split("@")[0] || "Admin",
    email: session?.email || "admin@example.com",
    avatar: "",
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/" />}
            >
              <div className="flex size-5 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <ShieldCheck className="size-3.5" />
              </div>
              <span className="text-base font-semibold">Admin Centre</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {filteredSections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        className="my-0.5"
                      >
                        <Link
                          href={item.href}
                          className="flex items-center gap-2 w-full"
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
