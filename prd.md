# Crypto Admin Control Centre
## Product Requirements Document
**Version:** 1.0 | **Role:** Administrative Backend & Management Interface | **Status:** Active

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Target Audience & RBAC](#2-target-audience--rbac)
3. [Tech Stack](#3-tech-stack)
4. [Architecture Decisions](#4-architecture-decisions)
5. [Feature Priority Roadmap](#5-feature-priority-roadmap)
6. [Functional Requirements](#6-functional-requirements)
7. [Analytics & Reporting](#7-analytics--reporting)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [UI Design Resources](#9-ui-design-resources)
10. [Backend Alignment Checklist](#10-backend-alignment-checklist)
11. [Immediate First Steps](#11-immediate-first-steps)
12. [Success Metrics](#12-success-metrics)

---

## 1. Project Overview

The Admin Control Centre is the centralised management interface for the crypto platform. It serves four primary functions:

| Function | Scope |
|---|---|
| **Compliance** | KYC/AML oversight, user flagging, transaction monitoring |
| **Financial Operations** | Liquidity management, withdrawal approvals |
| **Business Management** | Fee configuration, pricing, spread control |
| **Customer Support** | User profiles, ticket management, communications |

The goal is a secure, high-integrity environment for internal staff to monitor platform health and resolve user issues — without requiring direct database access.

> **Backend Note:** An existing backend owns all auth, data, and business logic. The frontend is a pure consumer. No BFF proxy layer is needed. Attach the JWT from an `httpOnly` cookie to every request via an Axios interceptor.

---

## 2. Target Audience & RBAC

Role-Based Access Control (RBAC) must be implemented at the route middleware level — never client-side guards alone.

| Role | Access Level |
|---|---|
| **Super Admin** | Full access — all modules, system config, admin management |
| **Compliance Officer** | KYC, user flagging, transaction monitoring |
| **Finance Manager** | Liquidity, withdrawal approvals, fee settings, price lists |
| **Customer Support** | View-only user profiles and transaction history; support tickets and comms |

---

## 3. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | SSR for auth-sensitive pages, middleware for RBAC guards |
| **Language** | TypeScript (strict mode) | Non-negotiable for a compliance/financial product |
| **Styling** | Tailwind CSS + shadcn/ui | Accessible unstyled primitives, dense admin-friendly UI, fully owned |
| **Server State** | TanStack Query v5 | Caching, background refetch, optimistic updates with rollback |
| **Client State** | Zustand | RBAC context, active filters, lightweight session store |
| **Tables** | TanStack Table v8 | Filterable/sortable/paginated — used in every module |
| **Charts** | Tremor + Recharts | Tremor for stat cards/KPIs; Recharts for custom time-series |
| **Forms** | React Hook Form + Zod | Fee configs, KYC toggles, spread settings — all validated |
| **Auth** | Custom JWT handler | Backend owns auth; store JWT in `httpOnly` cookie, decode role client-side |
| **Real-time** | WebSocket / SSE | Live wallet balances & withdrawal queue — confirm protocol with backend |
| **PDF Export** | Confirm with backend | Prefer server-generated PDF; frontend triggers download via signed URL |

> **TODO (Phase 4):** Install Tremor (`@tremor/react`) and Recharts (`recharts`) when Analytics & Reporting work begins. These are not included in the initial scaffold — do not forget to add them before starting Phase 4.

---

## 4. Architecture Decisions

### 4.1 Auth & Session

- JWT stored in `httpOnly` cookie on login response — never `localStorage`
- Decode JWT client-side for role only — never trust for actual authorisation
- Role stored in Zustand as RBAC context, drives sidebar nav and `ProtectedAction` wrapper
- Auto-logout on 401 via Axios response interceptor
- Session timeout: 15 minutes of inactivity (enforce both backend and frontend)

### 4.2 Route-Level RBAC Middleware

```ts
// middleware.ts
export function middleware(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;
  const { role } = decodeJWT(token); // decode only, backend validates
  if (!hasAccess(role, req.nextUrl.pathname)) {
    return NextResponse.redirect('/unauthorised');
  }
}
```

No page renders before auth is confirmed. Client-side guards are supplementary only.

### 4.3 ProtectedAction Wrapper

Build this on day one. Every sensitive button or form wraps it — no raw ternaries scattered across files.

```tsx
<ProtectedAction roles={['SUPER_ADMIN', 'FINANCE_MANAGER']}>
  <ApproveWithdrawalButton />
</ProtectedAction>
```

### 4.4 Central API Directory

```
src/
  api/
    client.ts        // Axios instance, interceptors, token attachment
    kyc.ts
    withdrawals.ts
    fees.ts
    liquidity.ts
    transactions.ts
    audit.ts
```

### 4.5 auditedMutation Utility

Every data-changing API call passes through a single wrapper that posts to the audit log endpoint. Build once on day one — never retrofit into 20 places.

```ts
const auditedMutation = async (action: string, fn: () => Promise<any>) => {
  const result = await fn();
  await audit.log({ action, timestamp: Date.now(), ip: getClientIP() });
  return result;
};
```

### 4.6 Optimistic UI with Rollback

Use TanStack Query's `onMutate`/`onError` pattern for all status toggles (KYC approval, asset on/off). Feels instant, reverts cleanly on failure.

### 4.7 Maker-Checker Pattern

Two-step modal for any financial action above a configured threshold. First admin triggers — second admin confirms. Never built as a one-click action.

```
Admin A → "Initiate Transfer ₦10M" → Pending state in backend
Admin B → Sees pending action in queue → Confirms or rejects
```

### 4.8 Real-time Layer

Confirm with backend team upfront — this determines the entire live data setup:

- **WebSocket** → use `socket.io-client`, subscribe on mount, update TanStack Query cache directly
- **SSE** → use `EventSource`, same cache update pattern
- **Neither** → TanStack Query `refetchInterval` as fallback (acceptable for low-frequency data)

---

## 5. Feature Priority Roadmap

### Phase 1 — Foundation (Weeks 1–3)
*These block everything else.*

| Feature | Notes |
|---|---|
| **Auth & RBAC** | JWT cookie setup, middleware guard, role context in Zustand, `ProtectedAction` component, TOTP flow |
| **Admin User Management** | Invite flow, role assignment, kill switch (suspend/deactivate), onboarding status view |
| **Audit Trail Infrastructure** | Log viewer component + `auditedMutation` wrapper pattern — establish the pattern before feature work begins |

### Phase 2 — Core Operations (Weeks 4–7)
*Highest business-critical daily workflows.*

| Feature | Notes |
|---|---|
| **KYC Queue & User Management** | Side-by-side ID/selfie viewer, status toggles, rejection reason codes, user detail view |
| **Withdrawal Approval Engine** | Queue, bulk actions, high-risk address flagging, Maker-Checker approval UI |
| **Global Transaction Ledger** | Filterable table, risk score badges, smurfing flag indicators |

### Phase 3 — Financial Configuration (Weeks 8–10)

| Feature | Notes |
|---|---|
| **Price List & Fee Engine** | Spread control slider, tiered fee forms, asset enable/disable toggle |
| **Platform Liquidity Overview** | Hot/cold wallet balances, low-balance alerts, manual credit/debit with Maker-Checker |

### Phase 4 — Ops & Intelligence (Weeks 11–13)

| Feature | Notes |
|---|---|
| **VAS Management** | Provider status dashboard, enable/disable products |
| **Analytics & Reporting** | DAU, volume, revenue, KYC conversion — PDF export trigger |
| **Support & Communications** | Ticketing, system announcement composer, email template manager |

---

## 6. Functional Requirements

### 6.1 Authentication & Security

- **MFA:** Mandatory TOTP (Google Authenticator / Authy) for all admin accounts
- **IP Whitelisting:** Restricted access to specified office or VPN IP addresses
- **Session Management:** Auto-timeout after 15 minutes of inactivity
- **Audit Trail:** Every action logged with timestamp, IP, actor, and specific changes made

### 6.2 User Management & KYC Module

**User Directory**
- Searchable by Name, Email, Wallet Address, or Phone Number

**KYC Verification Queue**
- Side-by-side view of user-submitted ID vs. liveness selfie
- Status toggle: `Pending` | `Approved` | `Rejected` | `Information Required`
- Rejection reason codes (e.g. "Blurry Document", "Expired ID")

**User Detail View**
- Account status: `Active` | `Frozen` | `Shadow-banned`
- Balance breakdown (Fiat vs. Crypto assets)
- Device fingerprinting — list of devices used to access the account
- Internal note system — staff comments log

### 6.3 Financial Operations: Wallets & Liquidity

**Platform Liquidity Overview**
- Real-time hot wallet vs. cold wallet balances
- Low-balance alerts with configurable thresholds

**Manual Funding / Adjustment**
- Credit/debit tool for reconciliation
- Requires Maker-Checker approval for amounts above a configured threshold

**Withdrawal Approval Engine**
- Queue of pending withdrawals
- Automated flagging for high-risk destination addresses
- Bulk approval / rejection capabilities

### 6.4 Price List & Fee Configuration

**Exchange Rate Management**
- View current market rates vs. platform rates
- Spread control: set percentage markup/markdown on mid-market price for swaps

**Fee Engine**
- Flat fees or percentages for: Withdrawals, Swaps, VAS
- Tiered fee settings (e.g. lower fees for high-volume users)

**Asset Toggle**
- Instantly enable/disable trading or deposits for specific coins during network maintenance

**Audit Logs**
- Full history of every rate change — who changed it, when, and old vs. new spread value

### 6.5 Transaction Oversight & Risk Management

**Global Transaction Ledger**
- Filterable by type: `Swap` | `Transfer` | `Withdrawal` | `Funding`

**Risk Scoring**
- Rule-based automatic flagging — examples:
  - Flag any swap above ₦5M from an account less than 7 days old
  - "Smurfing" detection: multiple small transactions to avoid limits
  - Rapid-fire transfer patterns

**Manual Reversal (VAS only)**
- Retry or refund failed bill payments if provider API fails (e.g. electricity, airtime)

### 6.6 Value Added Services (VAS) Management

- **Provider Monitoring:** Dashboard showing status and balance of third-party utility/airtime APIs
- **Product Management:** Enable/disable specific bills or services (e.g. "DSTV Payment", "Data Bundles")

### 6.7 Support & Communication

- **Ticketing System:** Integrated help desk for responding to user-initiated queries
- **System Announcements:** Push notification composer + in-app banner management (e.g. "Scheduled Ethereum maintenance")
- **Email Templates:** Manage automated emails for KYC approval, withdrawal confirmations, etc.

### 6.8 Admin User Management

**Admin Invitation & Onboarding**
- Super Admins invite by email and assign RBAC role
- System sends time-limited activation link
- Invitee creates password (complexity enforced) → immediately prompted for MFA setup
- Dashboard view: `Pending` | `Active` | `Expired` invitations

**Admin Profile & Permissions**
- Role modification requires secondary Super Admin confirmation
- Kill switch: Suspend (revokes sessions instantly) or Deactivate/Delete (permanent)
- Admin detail view: login history, last active timestamp, action summary

**Password & Security Resets**
- Manual MFA reset by Super Admin after offline identity verification
- Forced password change on next login

---

## 7. Analytics & Reporting

| Metric | Detail |
|---|---|
| **Daily Active Users (DAU)** | Growth trends over time |
| **Volume Metrics** | Total Swapped, Withdrawn, Funded — Daily / Weekly / Monthly |
| **Revenue Reports** | Summary of all fees collected across modules |
| **KYC Conversion Rate** | % of users who pass KYC vs. drop off |
| **VASP Monitoring** | Virtual Asset Service Provider licence monitoring section |
| **PDF Export** | All reports exportable as PDF — confirm if server-generated or `@react-pdf/renderer` |

---

## 8. Non-Functional Requirements

| Requirement | Spec |
|---|---|
| **Performance** | Dashboard pages must load in < 2 seconds |
| **Data Integrity** | Database transactions for all balance adjustments — ledger and user balance updated simultaneously |
| **Encryption at Rest** | AES-256 for all data |
| **PII Storage** | ID documents stored in secured bucket (e.g. S3 with restricted IAM roles) |
| **Audit Compliance** | 100% of admin actions logged and searchable |

---

## 9. UI Design Resources

### Recommended Figma Community Files

| Resource | Why |
|---|---|
| **Untitled UI – Admin Dashboard** | Best-in-class density, dark/light modes, tables, stat cards, empty states |
| **Tremor Dashboard Components** | Purpose-built admin UI — matches the Tremor React library exactly |
| **KYC Verification UI Kit** | Side-by-side document viewer patterns and verification queue flows |
| **Ant Design Admin Template** | Reference for complex table-heavy, data-dense layouts |

### Priority Components to Source from Figma

- Side-by-side KYC document viewer layout
- Maker-Checker two-step approval modal
- Risk score badge / flag system for transaction rows
- Spread control slider with live rate preview
- Dense data table with inline status badges and bulk action toolbar

---

## 10. Backend Alignment Checklist

Confirm these with the backend team before writing any feature code.

- [ ] **JWT payload** — confirm role claim field name (`role` vs. `permissions`)
- [ ] **Real-time protocol** — WebSocket, SSE, or polling? Determines the entire live data setup
- [ ] **Audit metadata** — every mutation response should return `timestamp`, `actor`, and `changedFields`
- [ ] **PDF reports** — server-generated (preferred) or frontend-rendered via `@react-pdf/renderer`?
- [ ] **Maker-Checker flow** — does backend hold pending state, or does frontend manage it?
- [ ] **Risk rules** — are rule-based flags computed server-side and returned as a score, or does frontend apply rules to raw data?
- [ ] **MFA integration** — does backend validate TOTP or does frontend use a shared secret?

---

## 11. Immediate First Steps

| # | Step | Action |
|---|---|---|
| 1 | **Scaffold** | `npx create-next-app@latest --typescript --tailwind --app` → add shadcn/ui init |
| 2 | **Auth layer** | JWT `httpOnly` cookie setup, decode role util, Zustand RBAC store |
| 3 | **Middleware** | Next.js route guard + `ProtectedAction` component |
| 4 | **Base layout** | Sidebar (role-filtered nav) + header (session info, logout) + content shell |
| 5 | **API layer** | `api/` directory, Axios instance with interceptors, `auditedMutation` utility |
| 6 | **Mock layer** | MSW (Mock Service Worker) — build all UI without waiting for backend |
| 7 | **KYC module** | First real feature — validates your table, detail panel, and status toggle patterns |

---

## 12. Success Metrics

| Metric | Target |
|---|---|
| **KYC Turnaround Time** | Average time from submission to approval < 2 hours |
| **Withdrawal Processing** | 95% of approved withdrawals processed within 10 minutes |
| **Audit Compliance** | 100% of admin actions logged and searchable |
| **Page Load** | All dashboard pages load in < 2 seconds |
