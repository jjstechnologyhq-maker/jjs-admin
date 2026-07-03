/**
 * VAS API — provider and product management.
 * See openapi-admin.yaml › VAS.
 */

import { apiClient } from "./client";
import type {
  VasProviderResponse,
  VasProductResponse,
  CreateVasProviderRequest,
  CreateVasProductRequest,
  ToggleRequest,
} from "./schema";

export const vasApi = {
  // ── Providers ──────────────────────────────────────────────────────────────
  listProviders: async (): Promise<VasProviderResponse[]> => {
    const res = await apiClient.get<VasProviderResponse[]>("/vas/providers");
    return res.data;
  },
  createProvider: async (body: CreateVasProviderRequest): Promise<VasProviderResponse> => {
    const res = await apiClient.post<VasProviderResponse>("/vas/providers", body);
    return res.data;
  },
  toggleProvider: async (id: string, body: ToggleRequest): Promise<VasProviderResponse> => {
    const res = await apiClient.patch<VasProviderResponse>(`/vas/providers/${id}/toggle`, body);
    return res.data;
  },

  // ── Products ─────────────────────────────────────────────────────────────────
  listProducts: async (): Promise<VasProductResponse[]> => {
    const res = await apiClient.get<VasProductResponse[]>("/vas/products");
    return res.data;
  },
  createProduct: async (body: CreateVasProductRequest): Promise<VasProductResponse> => {
    const res = await apiClient.post<VasProductResponse>("/vas/products", body);
    return res.data;
  },
  toggleProduct: async (id: string, body: ToggleRequest): Promise<VasProductResponse> => {
    const res = await apiClient.patch<VasProductResponse>(`/vas/products/${id}/toggle`, body);
    return res.data;
  },
};
