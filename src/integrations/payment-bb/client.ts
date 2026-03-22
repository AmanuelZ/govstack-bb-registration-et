import { logger } from '../../common/logger.js';
import type { PaymentRequest, PaymentResponse, PaymentStatusResponse } from './types.js';
import { randomUUID } from 'crypto';

/**
 * GovStack Payments BB client.
 *
 * In development (MOCK_PAYMENTS=true), returns realistic mock responses.
 * In production, calls the real Payment BB endpoint via Information Mediator.
 *
 * The interface contract is defined by the GovStack Payments BB specification.
 * Replace the mock implementation with real API calls when integrating
 * with Telebirr, CBEBirr, or another Payment BB-compliant system.
 */
export class PaymentBBClient {
  private readonly isMock: boolean;

  constructor() {
    this.isMock = process.env['MOCK_PAYMENTS'] !== 'false';
  }

  /**
   * Initiate a payment request.
   * Returns a payment URL (for hosted page) or transaction ID for direct payment.
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (this.isMock) {
      return this.mockInitiatePayment(request);
    }
    throw new Error('Real Payment BB integration not yet configured. Set PAYMENT_BB_URL environment variable.');
  }

  /**
   * Check the status of an existing payment.
   */
  async getPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
    if (this.isMock) {
      return this.mockGetStatus(transactionId);
    }
    throw new Error('Real Payment BB integration not yet configured.');
  }

  private mockInitiatePayment(request: PaymentRequest): PaymentResponse {
    const transactionId = `TXN-${randomUUID().slice(0, 8).toUpperCase()}`;
    logger.info(
      { transactionId, referenceId: request.referenceId, amount: request.amount },
      '[MOCK] Payment BB: payment initiated',
    );

    return {
      transactionId,
      referenceId: request.referenceId,
      status: 'PENDING',
      amount: request.amount,
      currency: 'ETB',
      // Mock hosted payment page URL
      paymentUrl: `http://localhost:4012/pay/${transactionId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private mockGetStatus(transactionId: string): PaymentStatusResponse {
    // Mock: payments starting with 'TXN-' are always successful after 5s
    logger.info({ transactionId }, '[MOCK] Payment BB: status check');
    return {
      transactionId,
      status: 'SUCCESS',
      completedAt: new Date().toISOString(),
    };
  }
}

export const paymentBBClient = new PaymentBBClient();
