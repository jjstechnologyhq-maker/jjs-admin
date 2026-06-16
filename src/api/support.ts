/**
 * Support & Communications API module
 * PRD §6.7 — Ticketing, Announcements, Email Templates
 */

import { apiClient } from "./client";
import type {
  PaginatedResponse,
  PaginationParams,
  TicketStatus,
  TicketPriority,
} from "./types";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  email: string;
  subject: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  lastReply: string;
  messageCount: number;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  sender: "USER" | "ADMIN";
  senderName: string;
  content: string;
  createdAt: string;
}

export interface TicketDetail extends Ticket {
  messages: TicketMessage[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "BANNER" | "PUSH" | "BOTH";
  status: "DRAFT" | "ACTIVE" | "EXPIRED";
  startDate: string;
  endDate?: string;
  createdBy: string;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  lastUpdated: string;
  updatedBy: string;
}

export type TicketListParams = PaginationParams & {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedTo?: string;
};

// ── API methods ──────────────────────────────────────────────────────────────

export const supportApi = {
  /** Fetch tickets with filters */
  getTickets: async (
    params?: TicketListParams
  ): Promise<PaginatedResponse<Ticket>> => {
    const response = await apiClient.get<PaginatedResponse<Ticket>>(
      "/tickets",
      { params }
    );
    return response.data;
  },

  /** Get ticket detail with messages */
  getTicket: async (id: string): Promise<TicketDetail> => {
    const response = await apiClient.get<TicketDetail>(`/tickets/${id}`);
    return response.data;
  },

  /** Reply to a ticket */
  replyToTicket: async (
    id: string,
    content: string
  ): Promise<TicketMessage> => {
    const response = await apiClient.post<TicketMessage>(
      `/tickets/${id}/reply`,
      { content }
    );
    return response.data;
  },

  /** Update ticket status */
  updateTicketStatus: async (
    id: string,
    status: TicketStatus
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.patch(`/tickets/${id}/status`, {
      status,
    });
    return response.data;
  },

  /** Get all announcements */
  getAnnouncements: async (): Promise<Announcement[]> => {
    const response = await apiClient.get<Announcement[]>("/announcements");
    return response.data;
  },

  /** Create a new announcement */
  createAnnouncement: async (
    data: Omit<Announcement, "id" | "createdBy" | "createdAt">
  ): Promise<Announcement> => {
    const response = await apiClient.post<Announcement>(
      "/announcements",
      data
    );
    return response.data;
  },

  /** Get all email templates */
  getEmailTemplates: async (): Promise<EmailTemplate[]> => {
    const response = await apiClient.get<EmailTemplate[]>("/email-templates");
    return response.data;
  },

  /** Update an email template */
  updateEmailTemplate: async (
    id: string,
    data: Partial<EmailTemplate>
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.patch(`/email-templates/${id}`, data);
    return response.data;
  },
};
