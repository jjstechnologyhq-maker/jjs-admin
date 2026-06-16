/**
 * MSW Withdrawals handlers — mock withdrawal queue and approval endpoints
 */

import { http, HttpResponse } from "msw";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.staging.jjs-admin.com/v1";

const MOCK_WITHDRAWALS = [
  { id: "wd_001", userId: "usr_042", userName: "Adebayo Ogunlesi", email: "adebayo.o@gmail.com", asset: "BTC", amount: 0.5, usdValue: 33_500, destinationAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", network: "Bitcoin", status: "PENDING", riskLevel: "LOW", riskFlags: [], requestedAt: "2026-05-12T14:00:00Z", makerCheckerRequired: false },
  { id: "wd_002", userId: "usr_078", userName: "Chioma Nwosu", email: "chioma.nwosu@yahoo.com", asset: "ETH", amount: 15, usdValue: 58_500, destinationAddress: "0xdead...beef", network: "Ethereum", status: "PENDING", riskLevel: "HIGH", riskFlags: ["High value withdrawal", "New account (< 7 days)"], requestedAt: "2026-05-12T13:30:00Z", makerCheckerRequired: true },
  { id: "wd_003", userId: "usr_091", userName: "Fatima Ibrahim", email: "fatima.ib@gmail.com", asset: "USDT", amount: 5_000, usdValue: 5_000, destinationAddress: "TN8s...4kP2", network: "Tron", status: "PENDING", riskLevel: "LOW", riskFlags: [], requestedAt: "2026-05-12T12:00:00Z", makerCheckerRequired: false },
  { id: "wd_004", userId: "usr_103", userName: "Emeka Eze", email: "emeka.eze@outlook.com", asset: "BTC", amount: 2.5, usdValue: 167_500, destinationAddress: "bc1q...flagged", network: "Bitcoin", status: "PENDING", riskLevel: "CRITICAL", riskFlags: ["Flagged destination address", "Amount exceeds daily limit", "Smurfing pattern detected"], requestedAt: "2026-05-12T11:45:00Z", makerCheckerRequired: true },
  { id: "wd_005", userId: "usr_089", userName: "Aisha Mohammed", email: "aisha.m@gmail.com", asset: "ETH", amount: 0.8, usdValue: 3_120, destinationAddress: "0xabcd...1234", network: "Ethereum", status: "APPROVED", riskLevel: "LOW", riskFlags: [], requestedAt: "2026-05-12T10:00:00Z", processedAt: "2026-05-12T10:15:00Z", processedBy: "finance@company.com", makerCheckerRequired: false },
  { id: "wd_006", userId: "usr_115", userName: "Oluwaseun Bakare", email: "seun.bakare@hotmail.com", asset: "USDT", amount: 50_000, usdValue: 50_000, destinationAddress: "TQn8...9xMz", network: "Tron", status: "REJECTED", riskLevel: "HIGH", riskFlags: ["KYC not approved"], requestedAt: "2026-05-11T16:00:00Z", processedAt: "2026-05-11T16:30:00Z", processedBy: "admin@company.com", makerCheckerRequired: true },
];

export const withdrawalsHandlers = [
  http.get(`${API_BASE}/withdrawals/queue`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    let filtered = [...MOCK_WITHDRAWALS];
    if (status) filtered = filtered.filter((w) => w.status === status);

    const total = filtered.length;
    const start = (page - 1) * limit;
    return HttpResponse.json({
      data: filtered.slice(start, start + limit),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }),

  http.get(`${API_BASE}/withdrawals/:id`, ({ params }) => {
    const w = MOCK_WITHDRAWALS.find((w) => w.id === params.id);
    if (!w) return HttpResponse.json({ message: "Not found" }, { status: 404 });
    return HttpResponse.json(w);
  }),

  http.patch(`${API_BASE}/withdrawals/:id/approve`, () => HttpResponse.json({ success: true })),
  http.patch(`${API_BASE}/withdrawals/:id/reject`, () => HttpResponse.json({ success: true })),
  http.post(`${API_BASE}/withdrawals/bulk-approve`, async ({ request }) => {
    const body = (await request.json()) as { ids: string[] };
    return HttpResponse.json({ success: true, processed: body.ids.length });
  }),
  http.post(`${API_BASE}/withdrawals/bulk-reject`, async ({ request }) => {
    const body = (await request.json()) as { ids: string[] };
    return HttpResponse.json({ success: true, processed: body.ids.length });
  }),
];
