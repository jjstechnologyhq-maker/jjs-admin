/**
 * MSW Transactions handlers — mock transaction ledger
 */

import { http, HttpResponse } from "msw";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.staging.jjs-admin.com/v1";

const MOCK_TRANSACTIONS = [
  { id: "tx_001", type: "SWAP", userId: "usr_042", userName: "Adebayo Ogunlesi", asset: "BTC→ETH", amount: 0.5, usdValue: 33_500, fee: 167.5, status: "COMPLETED", riskLevel: "LOW", riskScore: 12, riskFlags: [], createdAt: "2026-05-12T14:00:00Z", completedAt: "2026-05-12T14:01:00Z" },
  { id: "tx_002", type: "WITHDRAWAL", userId: "usr_078", userName: "Chioma Nwosu", asset: "ETH", amount: 15, usdValue: 58_500, fee: 292.5, status: "PENDING", riskLevel: "HIGH", riskScore: 78, riskFlags: ["Large amount", "New account"], fromAddress: "0xplat...form", toAddress: "0xdead...beef", network: "Ethereum", createdAt: "2026-05-12T13:30:00Z" },
  { id: "tx_003", type: "FUNDING", userId: "usr_091", userName: "Fatima Ibrahim", asset: "NGN", amount: 2_000_000, usdValue: 1_250, fee: 0, status: "COMPLETED", riskLevel: "LOW", riskScore: 5, riskFlags: [], createdAt: "2026-05-12T12:00:00Z", completedAt: "2026-05-12T12:05:00Z" },
  { id: "tx_004", type: "TRANSFER", userId: "usr_103", userName: "Emeka Eze", asset: "USDT", amount: 25_000, usdValue: 25_000, fee: 125, status: "FLAGGED", riskLevel: "CRITICAL", riskScore: 95, riskFlags: ["Smurfing pattern", "Multiple small transfers", "Rapid-fire activity"], fromAddress: "0xfrom...addr", toAddress: "0xto...addr", network: "Tron", createdAt: "2026-05-12T11:00:00Z" },
  { id: "tx_005", type: "SWAP", userId: "usr_089", userName: "Aisha Mohammed", asset: "USDT→BTC", amount: 3_200, usdValue: 3_200, fee: 16, status: "COMPLETED", riskLevel: "LOW", riskScore: 8, riskFlags: [], createdAt: "2026-05-12T10:30:00Z", completedAt: "2026-05-12T10:31:00Z" },
  { id: "tx_006", type: "WITHDRAWAL", userId: "usr_134", userName: "Tunde Afolabi", asset: "BTC", amount: 0.02, usdValue: 1_340, fee: 6.7, status: "COMPLETED", riskLevel: "LOW", riskScore: 15, riskFlags: [], fromAddress: "0xplat...form", toAddress: "bc1q...safe", network: "Bitcoin", txHash: "abc123...def", createdAt: "2026-05-12T09:00:00Z", completedAt: "2026-05-12T09:45:00Z" },
  { id: "tx_007", type: "FUNDING", userId: "usr_115", userName: "Oluwaseun Bakare", asset: "NGN", amount: 500_000, usdValue: 312.5, fee: 0, status: "COMPLETED", riskLevel: "MEDIUM", riskScore: 42, riskFlags: ["Multiple deposits same day"], createdAt: "2026-05-11T16:00:00Z", completedAt: "2026-05-11T16:02:00Z" },
  { id: "tx_008", type: "SWAP", userId: "usr_127", userName: "Ngozi Okafor", asset: "ETH→USDT", amount: 5.5, usdValue: 21_450, fee: 107.25, status: "COMPLETED", riskLevel: "MEDIUM", riskScore: 38, riskFlags: ["Shadow-banned account"], createdAt: "2026-05-11T14:00:00Z", completedAt: "2026-05-11T14:01:00Z" },
];

export const transactionsHandlers = [
  http.get(`${API_BASE}/transactions`, ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const riskLevel = url.searchParams.get("riskLevel");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    let filtered = [...MOCK_TRANSACTIONS];
    if (type) filtered = filtered.filter((t) => t.type === type);
    if (riskLevel) filtered = filtered.filter((t) => t.riskLevel === riskLevel);

    const total = filtered.length;
    const start = (page - 1) * limit;
    return HttpResponse.json({
      data: filtered.slice(start, start + limit),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }),

  http.get(`${API_BASE}/transactions/:id`, ({ params }) => {
    const tx = MOCK_TRANSACTIONS.find((t) => t.id === params.id);
    if (!tx) return HttpResponse.json({ message: "Not found" }, { status: 404 });
    return HttpResponse.json({
      ...tx,
      user: { id: tx.userId, fullName: tx.userName, email: `${tx.userName.split(" ")[0].toLowerCase()}@email.com`, accountAge: 45, kycStatus: "APPROVED" },
      relatedTransactions: MOCK_TRANSACTIONS.filter((t) => t.userId === tx.userId && t.id !== tx.id).slice(0, 3),
    });
  }),

  http.post(`${API_BASE}/transactions/:id/flag`, () => HttpResponse.json({ success: true })),
];
