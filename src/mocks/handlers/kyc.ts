/**
 * MSW KYC handlers — mock KYC queue and verification endpoints
 */

import { http, HttpResponse } from "msw";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api.staging.jjs-admin.com/v1";

const MOCK_KYC_QUEUE = [
  {
    id: "kyc_001",
    userId: "usr_042",
    userName: "Adebayo Ogunlesi",
    email: "adebayo.o@gmail.com",
    status: "PENDING",
    documentType: "National ID",
    documentUrl: "https://placehold.co/600x400/1a1a2e/e0e0e0?text=NIN+Card",
    selfieUrl: "https://placehold.co/400x400/1a1a2e/e0e0e0?text=Selfie",
    submittedAt: "2026-05-12T09:30:00Z",
    riskLevel: "LOW",
  },
  {
    id: "kyc_002",
    userId: "usr_078",
    userName: "Chioma Nwosu",
    email: "chioma.nwosu@yahoo.com",
    status: "PENDING",
    documentType: "International Passport",
    documentUrl: "https://placehold.co/600x400/1a1a2e/e0e0e0?text=Passport",
    selfieUrl: "https://placehold.co/400x400/1a1a2e/e0e0e0?text=Selfie",
    submittedAt: "2026-05-12T08:15:00Z",
    riskLevel: "MEDIUM",
  },
  {
    id: "kyc_003",
    userId: "usr_103",
    userName: "Emeka Eze",
    email: "emeka.eze@outlook.com",
    status: "PENDING",
    documentType: "Driver's License",
    documentUrl: "https://placehold.co/600x400/1a1a2e/e0e0e0?text=License",
    selfieUrl: "https://placehold.co/400x400/1a1a2e/e0e0e0?text=Selfie",
    submittedAt: "2026-05-11T22:00:00Z",
    riskLevel: "HIGH",
  },
  {
    id: "kyc_004",
    userId: "usr_091",
    userName: "Fatima Ibrahim",
    email: "fatima.ib@gmail.com",
    status: "APPROVED",
    documentType: "National ID",
    documentUrl: "https://placehold.co/600x400/1a1a2e/e0e0e0?text=NIN+Card",
    selfieUrl: "https://placehold.co/400x400/1a1a2e/e0e0e0?text=Selfie",
    submittedAt: "2026-05-10T14:00:00Z",
    reviewedAt: "2026-05-10T14:30:00Z",
    reviewedBy: "admin@company.com",
    riskLevel: "LOW",
  },
  {
    id: "kyc_005",
    userId: "usr_115",
    userName: "Oluwaseun Bakare",
    email: "seun.bakare@hotmail.com",
    status: "REJECTED",
    documentType: "Voter's Card",
    documentUrl: "https://placehold.co/600x400/1a1a2e/e0e0e0?text=Voters+Card",
    selfieUrl: "https://placehold.co/400x400/1a1a2e/e0e0e0?text=Selfie",
    submittedAt: "2026-05-09T10:00:00Z",
    reviewedAt: "2026-05-09T11:15:00Z",
    reviewedBy: "compliance@company.com",
    rejectionReason: "BLURRY_DOCUMENT",
    riskLevel: "LOW",
  },
  {
    id: "kyc_006",
    userId: "usr_127",
    userName: "Ngozi Okafor",
    email: "ngozi.ok@gmail.com",
    status: "INFO_REQUIRED",
    documentType: "National ID",
    documentUrl: "https://placehold.co/600x400/1a1a2e/e0e0e0?text=NIN+Card",
    selfieUrl: "https://placehold.co/400x400/1a1a2e/e0e0e0?text=Selfie",
    submittedAt: "2026-05-11T16:00:00Z",
    riskLevel: "MEDIUM",
  },
  {
    id: "kyc_007",
    userId: "usr_134",
    userName: "Tunde Afolabi",
    email: "tunde.af@protonmail.com",
    status: "PENDING",
    documentType: "International Passport",
    documentUrl: "https://placehold.co/600x400/1a1a2e/e0e0e0?text=Passport",
    selfieUrl: "https://placehold.co/400x400/1a1a2e/e0e0e0?text=Selfie",
    submittedAt: "2026-05-12T11:45:00Z",
    riskLevel: "CRITICAL",
  },
  {
    id: "kyc_008",
    userId: "usr_089",
    userName: "Aisha Mohammed",
    email: "aisha.m@gmail.com",
    status: "PENDING",
    documentType: "National ID",
    documentUrl: "https://placehold.co/600x400/1a1a2e/e0e0e0?text=NIN+Card",
    selfieUrl: "https://placehold.co/400x400/1a1a2e/e0e0e0?text=Selfie",
    submittedAt: "2026-05-12T07:20:00Z",
    riskLevel: "LOW",
  },
];

export const kycHandlers = [
  // GET /kyc/queue
  http.get(`${API_BASE}/kyc/queue`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    let filtered = [...MOCK_KYC_QUEUE];
    if (status) {
      filtered = filtered.filter((k) => k.status === status);
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return HttpResponse.json({
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }),

  // GET /kyc/:userId
  http.get(`${API_BASE}/kyc/:userId`, ({ params }) => {
    const item = MOCK_KYC_QUEUE.find((k) => k.userId === params.userId);
    if (!item) {
      return HttpResponse.json(
        { message: "KYC submission not found" },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      ...item,
      user: {
        id: item.userId,
        fullName: item.userName,
        email: item.email,
        phone: "+234 801 234 5678",
        accountStatus: "ACTIVE",
        createdAt: "2026-04-15T10:00:00Z",
        country: "Nigeria",
        dateOfBirth: "1992-03-15",
      },
      documents: [
        {
          id: "doc_01",
          type: item.documentType,
          url: item.documentUrl,
          uploadedAt: item.submittedAt,
        },
        {
          id: "doc_02",
          type: "Selfie",
          url: item.selfieUrl,
          uploadedAt: item.submittedAt,
        },
      ],
    });
  }),

  // PATCH /kyc/:userId/status
  http.patch(`${API_BASE}/kyc/:userId/status`, async ({ params, request }) => {
    const body = (await request.json()) as {
      status: string;
      rejectionReason?: string;
    };
    const item = MOCK_KYC_QUEUE.find((k) => k.userId === params.userId);
    if (item) {
      (item as Record<string, unknown>).status = body.status;
      if (body.rejectionReason) {
        (item as Record<string, unknown>).rejectionReason = body.rejectionReason;
      }
    }
    return HttpResponse.json({ success: true });
  }),
];
