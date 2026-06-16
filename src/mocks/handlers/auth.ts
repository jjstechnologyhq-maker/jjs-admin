/**
 * MSW auth handlers — mock login/logout for development
 * PRD §11 Step 6 — build all UI without waiting for backend
 */

import { http, HttpResponse } from "msw";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api.staging.jjs-admin.com/v1";

/**
 * Generate a mock JWT with the given permissions.
 * This is a structurally valid JWT (base64 header.payload.signature)
 * but NOT cryptographically signed — it's for MSW mocking only.
 */
function createMockJWT(permissions: string[], email: string): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: "admin_001",
      email,
      permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 min
    })
  );
  const signature = btoa("mock_signature");
  return `${header}.${payload}.${signature}`;
}

export const authHandlers = [
  // POST /auth/admin/login
  http.post(`${API_BASE}/auth/admin/login`, async ({ request }) => {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      totp?: string;
    };

    // Simple mock validation
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Determine permissions based on email for easy testing
    let permissions = ["SUPER_ADMIN"];
    if (body.email.includes("compliance")) permissions = ["COMPLIANCE_OFFICER"];
    if (body.email.includes("finance")) permissions = ["FINANCE_MANAGER"];
    if (body.email.includes("support")) permissions = ["CUSTOMER_SUPPORT"];
    // multi-role test: "multi@" gets compliance + finance
    if (body.email.includes("multi"))
      permissions = ["COMPLIANCE_OFFICER", "FINANCE_MANAGER"];

    const token = createMockJWT(permissions, body.email);

    return HttpResponse.json(
      {
        success: true,
        admin: {
          id: "admin_001",
          email: body.email,
          permissions,
        },
      },
      {
        headers: {
          "Set-Cookie": `admin_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${15 * 60}`,
        },
      }
    );
  }),

  // POST /auth/admin/logout
  http.post(`${API_BASE}/auth/admin/logout`, () => {
    return HttpResponse.json(
      { success: true },
      {
        headers: {
          "Set-Cookie":
            "admin_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
        },
      }
    );
  }),

  // POST /auth/admin/refresh
  http.post(`${API_BASE}/auth/admin/refresh`, () => {
    return HttpResponse.json({ success: true });
  }),

  // POST /audit/log — accept all audit logs silently
  http.post(`${API_BASE}/audit/log`, () => {
    return HttpResponse.json({ success: true });
  }),

  // GET /audit/entries — mock audit log entries
  http.get(`${API_BASE}/audit/entries`, () => {
    return HttpResponse.json({
      data: MOCK_AUDIT_ENTRIES,
      pagination: { page: 1, limit: 20, total: MOCK_AUDIT_ENTRIES.length, totalPages: 1 },
    });
  }),
];

const MOCK_AUDIT_ENTRIES = [
  {
    id: "aud_001",
    action: "approve_kyc",
    actor: "admin@company.com",
    timestamp: "2026-05-12T14:30:00Z",
    ip: "192.168.1.100",
    details: { userId: "usr_042", previousStatus: "PENDING", newStatus: "APPROVED" },
  },
  {
    id: "aud_002",
    action: "reject_withdrawal",
    actor: "finance@company.com",
    timestamp: "2026-05-12T13:15:00Z",
    ip: "192.168.1.101",
    details: { withdrawalId: "wd_018", reason: "High-risk address", amount: 25000 },
  },
  {
    id: "aud_003",
    action: "update_spread",
    actor: "admin@company.com",
    timestamp: "2026-05-12T11:00:00Z",
    ip: "192.168.1.100",
    details: { asset: "BTC", oldSpread: 1.5, newSpread: 2.0 },
  },
  {
    id: "aud_004",
    action: "suspend_admin",
    actor: "admin@company.com",
    timestamp: "2026-05-11T16:45:00Z",
    ip: "192.168.1.100",
    details: { targetAdmin: "rogue@company.com" },
  },
  {
    id: "aud_005",
    action: "toggle_asset",
    actor: "finance@company.com",
    timestamp: "2026-05-11T09:20:00Z",
    ip: "192.168.1.101",
    details: { asset: "ETH", tradingEnabled: false, reason: "Network maintenance" },
  },
];
