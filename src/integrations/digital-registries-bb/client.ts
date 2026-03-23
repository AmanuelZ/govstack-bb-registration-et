import { logger } from '../../common/logger.js';
import { randomUUID } from 'crypto';
import type {
  RegistryRecord,
  CreateRegistryRecordRequest,
  UpdateRegistryRecordRequest,
  SearchRegistryRequest,
} from './types.js';

/**
 * GovStack Digital Registries BB client.
 *
 * Used to persist approved registration outcomes (business registration certificates,
 * trade licenses, manufacturing permits) into the national digital registry.
 *
 * In development (MOCK_REGISTRIES=true), stores in-memory and returns mock registry IDs.
 * In production, calls the real Digital Registries BB endpoint via Information Mediator.
 */
export class DigitalRegistriesBBClient {
  private readonly isMock: boolean;
  private readonly mockStore = new Map<string, RegistryRecord>();

  constructor() {
    this.isMock = process.env['MOCK_REGISTRIES'] !== 'false';
  }

  /**
   * Create a new registry record (e.g., business registration certificate).
   */
  async create(request: CreateRegistryRecordRequest): Promise<RegistryRecord> {
    if (this.isMock) {
      return this.mockCreate(request);
    }
    throw new Error(
      'Real Digital Registries BB integration not configured. Set REGISTRIES_BB_URL.',
    );
  }

  /**
   * Update an existing registry record.
   */
  async update(request: UpdateRegistryRecordRequest): Promise<RegistryRecord> {
    if (this.isMock) {
      return this.mockUpdate(request);
    }
    throw new Error('Real Digital Registries BB integration not configured.');
  }

  /**
   * Search registry records.
   */
  async search(request: SearchRegistryRequest): Promise<RegistryRecord[]> {
    if (this.isMock) {
      return this.mockSearch(request);
    }
    throw new Error('Real Digital Registries BB integration not configured.');
  }

  private mockCreate(request: CreateRegistryRecordRequest): RegistryRecord {
    const id = `REG-${randomUUID().slice(0, 8).toUpperCase()}`;
    const record: RegistryRecord = {
      id,
      registryType: request.registryType,
      data: request.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    this.mockStore.set(id, record);
    logger.info(
      { id, registryType: request.registryType },
      '[MOCK] Digital Registries BB: record created',
    );
    return record;
  }

  private mockUpdate(request: UpdateRegistryRecordRequest): RegistryRecord {
    const existing = this.mockStore.get(request.id);
    if (!existing) {
      throw new Error(`Registry record '${request.id}' not found`);
    }
    const updated: RegistryRecord = {
      ...existing,
      data: { ...existing.data, ...request.data },
      updatedAt: new Date().toISOString(),
      version: existing.version + 1,
    };
    this.mockStore.set(request.id, updated);
    return updated;
  }

  private mockSearch(request: SearchRegistryRequest): RegistryRecord[] {
    return Array.from(this.mockStore.values()).filter(
      (r) =>
        r.registryType === request.registryType &&
        Object.entries(request.query).every(([key, value]) => r.data[key] === value),
    );
  }
}

export const digitalRegistriesBBClient = new DigitalRegistriesBBClient();
