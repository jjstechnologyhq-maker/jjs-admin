/**
 * Support API — tickets, push notifications, banners, and email templates.
 * See openapi-admin.yaml › Support.
 */

import { apiClient } from "./client";
import { cleanParams, type Paginated } from "./types";
import type {
  SupportTicketResponse,
  TicketReplyResponse,
  PaginatedTickets,
  BannerResponse,
  EmailTemplateResponse,
  CreateTicketRequest,
  ReplyTicketRequest,
  UpdateTicketStatusRequest,
  SendNotificationRequest,
  CreateBannerRequest,
  UpdateBannerRequest,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TicketStatusEnum,
} from "./schema";

export interface TicketListParams {
  status?: TicketStatusEnum;
  assignedTo?: string;
  cursor?: string;
  limit?: number;
}

export const supportApi = {
  // ── Tickets ──────────────────────────────────────────────────────────────
  listTickets: async (params: TicketListParams = {}): Promise<Paginated<SupportTicketResponse>> => {
    const res = await apiClient.get<PaginatedTickets>("/support/tickets", {
      params: cleanParams(params),
    });
    return res.data as Paginated<SupportTicketResponse>;
  },
  getTicket: async (id: string): Promise<SupportTicketResponse> => {
    const res = await apiClient.get<SupportTicketResponse>(`/support/tickets/${id}`);
    return res.data;
  },
  createTicket: async (body: CreateTicketRequest): Promise<SupportTicketResponse> => {
    const res = await apiClient.post<SupportTicketResponse>("/support/tickets", body);
    return res.data;
  },
  reply: async (id: string, body: ReplyTicketRequest): Promise<TicketReplyResponse> => {
    const res = await apiClient.post<TicketReplyResponse>(`/support/tickets/${id}/replies`, body);
    return res.data;
  },
  updateStatus: async (id: string, body: UpdateTicketStatusRequest): Promise<SupportTicketResponse> => {
    const res = await apiClient.patch<SupportTicketResponse>(`/support/tickets/${id}/status`, body);
    return res.data;
  },

  // ── Notifications ────────────────────────────────────────────────────────
  sendNotification: async (body: SendNotificationRequest): Promise<{ jobId: string }> => {
    const res = await apiClient.post<{ jobId: string }>("/support/notifications", body);
    return res.data;
  },

  // ── Banners ──────────────────────────────────────────────────────────────
  listBanners: async (): Promise<BannerResponse[]> => {
    const res = await apiClient.get<BannerResponse[]>("/support/banners");
    return res.data;
  },
  createBanner: async (body: CreateBannerRequest): Promise<BannerResponse> => {
    const res = await apiClient.post<BannerResponse>("/support/banners", body);
    return res.data;
  },
  updateBanner: async (id: string, body: UpdateBannerRequest): Promise<BannerResponse> => {
    const res = await apiClient.patch<BannerResponse>(`/support/banners/${id}`, body);
    return res.data;
  },
  deleteBanner: async (id: string): Promise<void> => {
    await apiClient.delete(`/support/banners/${id}`);
  },

  // ── Email templates ──────────────────────────────────────────────────────
  listTemplates: async (): Promise<EmailTemplateResponse[]> => {
    const res = await apiClient.get<EmailTemplateResponse[]>("/support/templates");
    return res.data;
  },
  createTemplate: async (body: CreateTemplateRequest): Promise<EmailTemplateResponse> => {
    const res = await apiClient.post<EmailTemplateResponse>("/support/templates", body);
    return res.data;
  },
  updateTemplate: async (id: string, body: UpdateTemplateRequest): Promise<EmailTemplateResponse> => {
    const res = await apiClient.patch<EmailTemplateResponse>(`/support/templates/${id}`, body);
    return res.data;
  },
};
