/**
 * MSW Liquidity handlers — mock wallet balances and adjustments
 */

import { http, HttpResponse } from "msw";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.staging.jjs-admin.com/v1";

export const liquidityHandlers = [
  http.get(`${API_BASE}/liquidity/wallets`, () => {
    return HttpResponse.json([
      { asset: "BTC", name: "Bitcoin", hotWallet: 12.5, coldWallet: 85.3, totalUsdValue: 6_557_600, lowBalanceThreshold: 5, isLowBalance: false, lastUpdated: "2026-05-12T14:00:00Z" },
      { asset: "ETH", name: "Ethereum", hotWallet: 245, coldWallet: 1_200, totalUsdValue: 5_635_500, lowBalanceThreshold: 100, isLowBalance: false, lastUpdated: "2026-05-12T14:00:00Z" },
      { asset: "USDT", name: "Tether", hotWallet: 450_000, coldWallet: 2_800_000, totalUsdValue: 3_250_000, lowBalanceThreshold: 200_000, isLowBalance: false, lastUpdated: "2026-05-12T14:00:00Z" },
      { asset: "SOL", name: "Solana", hotWallet: 80, coldWallet: 500, totalUsdValue: 101_500, lowBalanceThreshold: 150, isLowBalance: true, lastUpdated: "2026-05-12T14:00:00Z" },
    ]);
  }),

  http.post(`${API_BASE}/liquidity/adjust`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ id: `adj_${Date.now()}`, ...body, initiatedBy: "admin@company.com", initiatedAt: new Date().toISOString(), status: "PENDING" });
  }),

  http.get(`${API_BASE}/liquidity/adjustments/pending`, () => {
    return HttpResponse.json([
      { id: "adj_001", type: "CREDIT", asset: "SOL", amount: 500, reason: "Replenish hot wallet", initiatedBy: "finance@company.com", initiatedAt: "2026-05-12T10:00:00Z", status: "PENDING" },
    ]);
  }),

  http.patch(`${API_BASE}/liquidity/adjustments/:id`, () => HttpResponse.json({ success: true })),
  http.patch(`${API_BASE}/liquidity/thresholds/:asset`, () => HttpResponse.json({ success: true })),
];
