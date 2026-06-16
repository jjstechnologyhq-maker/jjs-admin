/**
 * MSW Users handlers — mock user directory and detail endpoints
 */

import { http, HttpResponse } from "msw";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api.staging.jjs-admin.com/v1";

const MOCK_USERS = [
  { id: "usr_042", fullName: "Adebayo Ogunlesi", email: "adebayo.o@gmail.com", phone: "+234 801 234 5678", accountStatus: "ACTIVE", kycStatus: "PENDING", walletAddress: "0x1a2B3c4D5e6F7890AbCdEf1234567890aBcDeF12", createdAt: "2026-04-15T10:00:00Z", lastActive: "2026-05-12T14:30:00Z" },
  { id: "usr_078", fullName: "Chioma Nwosu", email: "chioma.nwosu@yahoo.com", phone: "+234 802 345 6789", accountStatus: "ACTIVE", kycStatus: "PENDING", walletAddress: "0x2B3c4D5e6F7890AbCdEf1234567890aBcDeF1234", createdAt: "2026-03-20T08:00:00Z", lastActive: "2026-05-12T11:15:00Z" },
  { id: "usr_091", fullName: "Fatima Ibrahim", email: "fatima.ib@gmail.com", phone: "+234 803 456 7890", accountStatus: "ACTIVE", kycStatus: "APPROVED", walletAddress: "0x3c4D5e6F7890AbCdEf1234567890aBcDeF123456", createdAt: "2026-02-10T12:00:00Z", lastActive: "2026-05-12T09:45:00Z" },
  { id: "usr_103", fullName: "Emeka Eze", email: "emeka.eze@outlook.com", phone: "+234 804 567 8901", accountStatus: "FROZEN", kycStatus: "PENDING", walletAddress: "0x4D5e6F7890AbCdEf1234567890aBcDeF12345678", createdAt: "2026-04-01T15:00:00Z", lastActive: "2026-05-10T20:00:00Z" },
  { id: "usr_115", fullName: "Oluwaseun Bakare", email: "seun.bakare@hotmail.com", phone: "+234 805 678 9012", accountStatus: "ACTIVE", kycStatus: "REJECTED", walletAddress: "0x5e6F7890AbCdEf1234567890aBcDeF1234567890", createdAt: "2026-04-22T09:00:00Z", lastActive: "2026-05-11T17:30:00Z" },
  { id: "usr_127", fullName: "Ngozi Okafor", email: "ngozi.ok@gmail.com", phone: "+234 806 789 0123", accountStatus: "SHADOW_BANNED", kycStatus: "INFO_REQUIRED", walletAddress: "0x6F7890AbCdEf1234567890aBcDeF123456789012", createdAt: "2026-01-05T14:00:00Z", lastActive: "2026-05-08T12:00:00Z" },
  { id: "usr_134", fullName: "Tunde Afolabi", email: "tunde.af@protonmail.com", phone: "+234 807 890 1234", accountStatus: "ACTIVE", kycStatus: "PENDING", walletAddress: "0x7890AbCdEf1234567890aBcDeF12345678901234", createdAt: "2026-05-01T07:00:00Z", lastActive: "2026-05-12T16:00:00Z" },
  { id: "usr_089", fullName: "Aisha Mohammed", email: "aisha.m@gmail.com", phone: "+234 808 901 2345", accountStatus: "ACTIVE", kycStatus: "APPROVED", walletAddress: "0x890AbCdEf1234567890aBcDeF1234567890123456", createdAt: "2026-03-10T11:00:00Z", lastActive: "2026-05-12T13:00:00Z" },
];

export const usersHandlers = [
  http.get(`${API_BASE}/users`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase();
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    let filtered = [...MOCK_USERS];
    if (search) {
      filtered = filtered.filter(
        (u) => u.fullName.toLowerCase().includes(search) || u.email.toLowerCase().includes(search) || u.walletAddress.toLowerCase().includes(search)
      );
    }
    if (status) filtered = filtered.filter((u) => u.accountStatus === status);

    const total = filtered.length;
    const start = (page - 1) * limit;
    return HttpResponse.json({
      data: filtered.slice(start, start + limit),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }),

  http.get(`${API_BASE}/users/:id`, ({ params }) => {
    const user = MOCK_USERS.find((u) => u.id === params.id);
    if (!user) return HttpResponse.json({ message: "User not found" }, { status: 404 });
    return HttpResponse.json({
      ...user, dateOfBirth: "1992-03-15", country: "Nigeria",
      balances: {
        fiat: [{ currency: "NGN", amount: 2_450_000 }, { currency: "USD", amount: 1_520 }],
        crypto: [{ asset: "BTC", amount: 0.0845, usdValue: 5_680 }, { asset: "ETH", amount: 1.25, usdValue: 4_875 }, { asset: "USDT", amount: 3_200, usdValue: 3_200 }],
      },
      devices: [
        { id: "dev_01", type: "Mobile", browser: "Chrome Mobile 125", os: "Android 15", lastUsed: "2026-05-12T14:30:00Z", ip: "105.112.45.23" },
        { id: "dev_02", type: "Desktop", browser: "Safari 19", os: "macOS 16", lastUsed: "2026-05-10T09:15:00Z", ip: "41.203.78.112" },
      ],
      notes: [
        { id: "note_01", content: "User requested account verification via support ticket #1234", createdBy: "support@company.com", createdAt: "2026-05-08T10:00:00Z" },
      ],
      transactionCount: 47,
    });
  }),

  http.patch(`${API_BASE}/users/:id/status`, () => HttpResponse.json({ success: true })),

  http.post(`${API_BASE}/users/:id/notes`, async ({ request }) => {
    const body = (await request.json()) as { content: string };
    return HttpResponse.json({ id: `note_${Date.now()}`, content: body.content, createdBy: "admin@company.com", createdAt: new Date().toISOString() });
  }),
];
