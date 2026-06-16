/**
 * MSW Analytics handlers — mock dashboard summary and metrics
 */

import { http, HttpResponse } from "msw";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.staging.jjs-admin.com/v1";

function generateDauData(days: number) {
  const data = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({ date: date.toISOString().split("T")[0], count: Math.floor(800 + Math.random() * 400) });
  }
  return data;
}

export const analyticsHandlers = [
  http.get(`${API_BASE}/analytics/dashboard`, () => {
    return HttpResponse.json({
      totalUsers: 12_847,
      activeUsers24h: 1_234,
      pendingKyc: 23,
      pendingWithdrawals: 8,
      totalVolume24h: 2_450_000,
      totalRevenue24h: 12_250,
      systemHealth: "HEALTHY",
    });
  }),

  http.get(`${API_BASE}/analytics/dau`, ({ request }) => {
    const url = new URL(request.url);
    const range = url.searchParams.get("range") || "30d";
    const days = range === "24h" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
    return HttpResponse.json(generateDauData(days));
  }),

  http.get(`${API_BASE}/analytics/volume`, () => {
    return HttpResponse.json([
      { period: "2026-05-12", totalSwapped: 850_000, totalWithdrawn: 420_000, totalFunded: 1_180_000, currency: "USD" },
      { period: "2026-05-11", totalSwapped: 720_000, totalWithdrawn: 380_000, totalFunded: 950_000, currency: "USD" },
      { period: "2026-05-10", totalSwapped: 910_000, totalWithdrawn: 510_000, totalFunded: 1_050_000, currency: "USD" },
    ]);
  }),

  http.get(`${API_BASE}/analytics/revenue`, () => {
    return HttpResponse.json([
      { period: "2026-05-12", swapFees: 4_250, withdrawalFees: 2_100, vasFees: 890, totalRevenue: 7_240, currency: "USD" },
      { period: "2026-05-11", swapFees: 3_600, withdrawalFees: 1_900, vasFees: 750, totalRevenue: 6_250, currency: "USD" },
    ]);
  }),

  http.get(`${API_BASE}/analytics/kyc-conversion`, () => {
    return HttpResponse.json({ totalRegistered: 12_847, kycStarted: 8_432, kycCompleted: 6_891, kycApproved: 6_540, conversionRate: 50.9 });
  }),

  http.post(`${API_BASE}/analytics/reports`, () => {
    return HttpResponse.json({ downloadUrl: "https://example.com/reports/mock-report.pdf" });
  }),
];
