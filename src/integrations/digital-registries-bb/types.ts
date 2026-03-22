/**
 * GovStack Digital Registries Building Block interface types.
 * Based on GovStack Digital Registries BB specification.
 */
export interface RegistryRecord {
  id: string;
  registryType: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreateRegistryRecordRequest {
  registryType: string;
  data: Record<string, unknown>;
  /** External reference ID (e.g., our application fileId) */
  externalRef?: string;
}

export interface UpdateRegistryRecordRequest {
  id: string;
  data: Partial<Record<string, unknown>>;
}

export interface SearchRegistryRequest {
  registryType: string;
  query: Record<string, unknown>;
  page?: number;
  limit?: number;
}
