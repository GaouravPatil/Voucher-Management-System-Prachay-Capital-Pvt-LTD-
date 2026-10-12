import {
  CheckCircle2,
  Clock,
  FileText,
  Send,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from '../../lib/constants';
import type { VoucherStatus } from '../../types';

const STATUS_ICONS: Record<VoucherStatus, LucideIcon> = {
  DRAFT: FileText,
  SUBMITTED: Send,
  PENDING_APPROVAL: Clock,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
};

/** Status badge: text + icon, never color-only. */
export function Badge({ status }: { status: VoucherStatus }) {
  const Icon = STATUS_ICONS[status] ?? FileText;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 transition-colors duration-150 ${STATUS_BADGE_CLASSES[status]}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
