export const TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'],
  PENDING_APPROVAL: ['APPROVED', 'REJECTED'],
  APPROVED: [],
  REJECTED: [],
};

export function assertTransition(from: string, to: string) {
  const allowed = TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    const e: any = new Error(`Invalid state transition ${from} -> ${to}`);
    e.status = 409;
    e.code = 'INVALID_STATE_TRANSITION';
    throw e;
  }
}

export function assertEditable(status: string) {
  if (status !== 'DRAFT') {
    const e: any = new Error('Voucher is not editable');
    e.status = 409;
    e.code = 'VOUCHER_NOT_EDITABLE';
    throw e;
  }
}
