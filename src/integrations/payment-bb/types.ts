/**
 * GovStack Payments Building Block interface types.
 * Based on GovStack Payments BB specification v1.0.
 */
export interface PaymentRequest {
  /** Internal reference ID for this payment */
  referenceId: string;
  /** Amount in ETB (Ethiopian Birr), smallest unit = 1 cent */
  amount: number;
  currency: 'ETB';
  /** Description shown to payer */
  description: string;
  /** Payer's Fayda FIN or phone number for mobile money */
  payerIdentifier: string;
  /** Callback URL for payment status notification */
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResponse {
  transactionId: string;
  referenceId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  amount: number;
  currency: 'ETB';
  paymentUrl?: string; // Redirect URL for hosted payment page
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStatusResponse {
  transactionId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  completedAt?: string;
  failureReason?: string;
}
