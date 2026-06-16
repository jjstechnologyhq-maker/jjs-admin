/**
 * MSW Admin Management handlers — mock admin CRUD and security operations
 */

import { http, HttpResponse } from "msw";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.staging.jjs-admin.com/v1";

const MOCK_ADMINS = [
  { id: "adm_001", email: "admin@company.com", fullName: "Kola Adeyemi", permissions: ["SUPER_ADMIN"], status: "ACTIVE", mfaEnabled: true, createdAt: "2025-12-01T10:00:00Z", lastActive: "2026-05-12T14:30:00Z", loginCount: 342 },
  { id: "adm_002", email: "compliance@company.com", fullName: "Ade Osei", permissions: ["COMPLIANCE_OFFICER"], status: "ACTIVE", mfaEnabled: true, createdAt: "2026-01-15T09:00:00Z", lastActive: "2026-05-12T11:00:00Z", loginCount: 189 },
  { id: "adm_003", email: "finance@company.com", fullName: "Bola Tinubu", permissions: ["FINANCE_MANAGER"], status: "ACTIVE", mfaEnabled: true, createdAt: "2026-01-20T08:00:00Z", lastActive: "2026-05-12T13:00:00Z", loginCount: 156 },
  { id: "adm_004", email: "support@company.com", fullName: "Funmi Ojo", permissions: ["CUSTOMER_SUPPORT"], status: "ACTIVE", mfaEnabled: false, createdAt: "2026-03-01T10:00:00Z", lastActive: "2026-05-11T17:00:00Z", loginCount: 98 },
  { id: "adm_005", email: "newadmin@company.com", fullName: "Chidi Aneke", permissions: ["COMPLIANCE_OFFICER"], status: "PENDING", mfaEnabled: false, createdAt: "2026-05-10T09:00:00Z", lastActive: "", loginCount: 0 },
  { id: "adm_006", email: "old@company.com", fullName: "Yemi Alade", permissions: ["CUSTOMER_SUPPORT"], status: "EXPIRED", mfaEnabled: false, createdAt: "2026-04-01T09:00:00Z", lastActive: "", loginCount: 0 },
];

export const adminHandlers = [
  http.get(`${API_BASE}/admins`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    let filtered = [...MOCK_ADMINS];
    if (status) filtered = filtered.filter((a) => a.status === status);
    return HttpResponse.json({
      data: filtered,
      pagination: { page: 1, limit: 20, total: filtered.length, totalPages: 1 },
    });
  }),

  http.get(`${API_BASE}/admins/:id`, ({ params }) => {
    const admin = MOCK_ADMINS.find((a) => a.id === params.id);
    if (!admin) return HttpResponse.json({ message: "Not found" }, { status: 404 });
    return HttpResponse.json({
      ...admin,
      loginHistory: [
        { timestamp: "2026-05-12T14:30:00Z", ip: "192.168.1.100", userAgent: "Chrome/125", success: true },
        { timestamp: "2026-05-12T09:00:00Z", ip: "192.168.1.100", userAgent: "Chrome/125", success: true },
        { timestamp: "2026-05-11T14:00:00Z", ip: "10.0.0.5", userAgent: "Firefox/127", success: false },
      ],
      actionSummary: { totalActions: 1_247, lastAction: "approve_kyc", lastActionTimestamp: "2026-05-12T14:30:00Z" },
    });
  }),

  http.post(`${API_BASE}/admins/invite`, () => HttpResponse.json({ success: true, adminId: `adm_${Date.now()}` })),
  http.patch(`${API_BASE}/admins/:id/permissions`, () => HttpResponse.json({ success: true })),
  http.post(`${API_BASE}/admins/:id/suspend`, () => HttpResponse.json({ success: true })),
  http.post(`${API_BASE}/admins/:id/deactivate`, () => HttpResponse.json({ success: true })),
  http.post(`${API_BASE}/admins/:id/reset-mfa`, () => HttpResponse.json({ success: true })),
  http.post(`${API_BASE}/admins/:id/force-password-change`, () => HttpResponse.json({ success: true })),
];
