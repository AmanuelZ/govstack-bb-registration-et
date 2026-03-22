/**
 * GovStack Information Mediator BB interface types.
 * The IM BB provides secure, audited inter-BB communication (X-Road compatible).
 */
export interface IMClientIdentifier {
  /** Country/environment instance (e.g., "ET" for Ethiopia) */
  instance: string;
  /** Member class (e.g., "GOV" for government, "COM" for commercial) */
  memberClass: string;
  /** Member code (organization identifier) */
  memberCode: string;
  /** Subsystem code (specific service/system within the organization) */
  subsystem: string;
}

export function formatIMClientHeader(client: IMClientIdentifier): string {
  return `${client.instance}/${client.memberClass}/${client.memberCode}/${client.subsystem}`;
}

export function parseIMClientHeader(header: string): IMClientIdentifier | null {
  const parts = header.split('/');
  if (parts.length !== 4) return null;
  const [instance, memberClass, memberCode, subsystem] = parts;
  if (!instance || !memberClass || !memberCode || !subsystem) return null;
  return { instance, memberClass, memberCode, subsystem };
}
