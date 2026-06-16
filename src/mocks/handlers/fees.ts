/**
 * MSW Fees/Pricing handlers — mock rates, fees, and asset toggles
 */

import { http, HttpResponse } from "msw";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.staging.jjs-admin.com/v1";

export const feesHandlers = [
  http.get(`${API_BASE}/pricing/rates`, () => {
    return HttpResponse.json([
      { asset: "BTC", name: "Bitcoin", marketRate: 67_000, platformRate: 68_340, spreadPercent: 2.0, enabled: true, lastUpdated: "2026-05-12T14:00:00Z" },
      { asset: "ETH", name: "Ethereum", marketRate: 3_900, platformRate: 3_958.5, spreadPercent: 1.5, enabled: true, lastUpdated: "2026-05-12T14:00:00Z" },
      { asset: "USDT", name: "Tether", marketRate: 1.0, platformRate: 1.005, spreadPercent: 0.5, enabled: true, lastUpdated: "2026-05-12T14:00:00Z" },
      { asset: "SOL", name: "Solana", marketRate: 175, platformRate: 178.5, spreadPercent: 2.0, enabled: true, lastUpdated: "2026-05-12T14:00:00Z" },
      { asset: "BNB", name: "BNB", marketRate: 620, platformRate: 632.4, spreadPercent: 2.0, enabled: false, lastUpdated: "2026-05-12T14:00:00Z" },
    ]);
  }),

  http.patch(`${API_BASE}/pricing/spread`, () => HttpResponse.json({ success: true })),

  http.get(`${API_BASE}/fees`, () => {
    return HttpResponse.json([
      { id: "fee_001", name: "Crypto Withdrawal", type: "WITHDRAWAL", feeType: "PERCENTAGE", value: 0.5, tiers: [{ minVolume: 0, maxVolume: 10_000, feeType: "PERCENTAGE", value: 0.5 }, { minVolume: 10_001, maxVolume: null, feeType: "PERCENTAGE", value: 0.3 }], updatedAt: "2026-05-10T10:00:00Z", updatedBy: "admin@company.com" },
      { id: "fee_002", name: "Swap Fee", type: "SWAP", feeType: "PERCENTAGE", value: 0.25, tiers: [], updatedAt: "2026-05-08T14:00:00Z", updatedBy: "finance@company.com" },
      { id: "fee_003", name: "VAS Processing", type: "VAS", feeType: "FLAT", value: 100, tiers: [], updatedAt: "2026-05-05T09:00:00Z", updatedBy: "admin@company.com" },
    ]);
  }),

  http.patch(`${API_BASE}/fees/:id`, () => HttpResponse.json({ success: true })),

  http.get(`${API_BASE}/pricing/assets`, () => {
    return HttpResponse.json([
      { asset: "BTC", tradingEnabled: true, depositsEnabled: true, withdrawalsEnabled: true },
      { asset: "ETH", tradingEnabled: true, depositsEnabled: true, withdrawalsEnabled: true },
      { asset: "USDT", tradingEnabled: true, depositsEnabled: true, withdrawalsEnabled: true },
      { asset: "SOL", tradingEnabled: true, depositsEnabled: true, withdrawalsEnabled: false },
      { asset: "BNB", tradingEnabled: false, depositsEnabled: false, withdrawalsEnabled: false },
    ]);
  }),

  http.patch(`${API_BASE}/pricing/assets/:asset`, () => HttpResponse.json({ success: true })),
];
