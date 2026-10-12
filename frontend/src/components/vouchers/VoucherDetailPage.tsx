import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  CheckCircle2,
  Pencil,
  Printer,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';
import { vouchersApi } from '../../api/vouchers.api';
import { apiErrorMessage } from '../../api/client';
import { STATUS_LABELS } from '../../lib/constants';
import { formatDate, formatDateTime, formatINR } from '../../lib/formatters';
import type { Voucher } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Modal } from '../ui/Modal';
import { SecureImage } from '../ui/SecureImage';
import { Skeleton } from '../ui/Skeleton';
import { ApproveDialog } from './ApproveDialog';
import { RejectDialog } from './RejectDialog';

interface Props {
  voucherId: string;
  backTo: string;
  editTo?: string;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-0.5 break-words text-sm text-gray-900">{value}</p>
    </div>
  );
}

/** Shared voucher details: sections + timeline + permission-driven action bar. */
export function VoucherDetailPage({ voucherId, backTo, editTo }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);

  const detail = useQuery({
    queryKey: ['voucher', voucherId],
    queryFn: () => vouchersApi.get(voucherId),
  });
  const history = useQuery({
    queryKey: ['voucher-history', voucherId],
    queryFn: () => vouchersApi.history(voucherId),
    enabled: detail.isSuccess,
  });

  const submitMutation = useMutation({
    mutationFn: () => vouchersApi.submit(voucherId),
    onSuccess: () => {
      toast.success('Voucher submitted for approval.');
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['voucher', voucherId] });
      queryClient.invalidateQueries({ queryKey: ['voucher-history', voucherId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSubmitOpen(false);
    },
    onError: (e) => {
      setSubmitOpen(false);
      toast.error(apiErrorMessage(e, 'Failed to submit voucher.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => vouchersApi.remove(voucherId),
    onSuccess: () => {
      toast.success('Voucher deleted.');
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate(backTo);
    },
    onError: (e) => {
      setDeleteOpen(false);
      toast.error(apiErrorMessage(e, 'Failed to delete voucher.'));
    },
  });

  if (detail.isLoading) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label="Loading voucher">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
        <span className="sr-only">Loading voucher details…</span>
      </div>
    );
  }

  if (detail.isError) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="secondary" onClick={() => navigate(backTo)} className="w-fit">
          Back to list
        </Button>
        <Card>
          <ErrorState
            message={apiErrorMessage(detail.error, 'Failed to load voucher. It may not exist or you may not have access.')}
            onRetry={() => detail.refetch()}
          />
        </Card>
      </div>
    );
  }

  const v = detail.data;
  if (!v) {
    return (
      <Card>
        <ErrorState message="Voucher not found." onRetry={() => detail.refetch()} />
      </Card>
    );
  }
  const perms = v.permissions;
  const timeline = history.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => navigate(backTo)}>
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              {v.voucherNumber}
            </h1>
            <p className="text-sm text-gray-500">{v.expenseTitle}</p>
          </div>
        </div>
        <Badge status={v.status} />
      </div>

      {/* Action bar (driven by server permissions) */}
      <div className="flex flex-wrap gap-2 no-print" role="toolbar" aria-label="Voucher actions">
        {perms.canEdit && editTo && (
          <Button variant="secondary" onClick={() => navigate(editTo)}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit draft
          </Button>
        )}
        {perms.canDelete && (
          <Button variant="secondary" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </Button>
        )}
        {perms.canSubmit && (
          <Button onClick={() => setSubmitOpen(true)}>
            <Send className="h-4 w-4" aria-hidden="true" />
            Submit for Approval
          </Button>
        )}
        {perms.canApprove && (
          <Button onClick={() => setApproveOpen(true)}>
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Approve
          </Button>
        )}
        {perms.canReject && (
          <Button variant="danger" onClick={() => setRejectOpen(true)}>
            <XCircle className="h-4 w-4" aria-hidden="true" />
            Reject
          </Button>
        )}
        <Button variant="ghost" onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden="true" />
          Print
        </Button>
      </div>

      {v.status === 'REJECTED' && v.rejectionReason && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-4"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-red-800">Rejected</p>
            <p className="mt-0.5 text-sm text-red-700">{v.rejectionReason}</p>
            {v.rejectedAt && (
              <p className="mt-1 text-xs text-red-600">
                {formatDateTime(v.rejectedAt)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Printable voucher */}
      <div className="print-area flex flex-col gap-4">
        <div className="print-only print-header">
          <h1>ABC Company – Expense Voucher</h1>
          <p>
            {v.voucherNumber} · {STATUS_LABELS[v.status]}
          </p>
        </div>

        <Card>
          <CardHeader title="Basic Information" />
          <CardBody>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Voucher Number" value={v.voucherNumber} />
              <Field label="Voucher Date" value={formatDate(v.voucherDate)} />
              <Field label="Expense Date" value={formatDate(v.expenseDate)} />
              <Field label="Department" value={v.departmentName} />
              <Field label="Expense Title" value={v.expenseTitle} />
              <Field label="Expense Category" value={v.expenseCategory} />
              <Field label="Amount" value={formatINR(v.amount)} />
              <Field
                label="Status"
                value={
                  <span className="no-print">
                    <Badge status={v.status} />
                  </span>
                }
              />
              <span className="print-only text-sm text-gray-900">
                Status: {STATUS_LABELS[v.status]}
              </span>
            </dl>
            {v.expenseDescription && (
              <div className="mt-4">
                <Field label="Description" value={v.expenseDescription} />
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Employee Information" />
          <CardBody>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Employee Name" value={v.employee.name} />
              <Field
                label="Employee ID"
                value={v.employee.employeeCode || '—'}
              />
            </dl>
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Employee Signature
              </p>
              <div className="mt-1">
                <SecureImage
                  url={
                    v.employeeSignature.present
                      ? vouchersApi.employeeSignatureUrl(v.id)
                      : null
                  }
                  alt="Employee signature"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Approval Information" />
          <CardBody>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Director" value={v.director?.name || '—'} />
              <Field
                label="Approval Date"
                value={formatDateTime(v.approvalDate)}
              />
              {v.submittedAt && (
                <Field label="Submitted At" value={formatDateTime(v.submittedAt)} />
              )}
              {v.rejectedAt && (
                <Field label="Rejected At" value={formatDateTime(v.rejectedAt)} />
              )}
            </dl>
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Director Signature
              </p>
              <div className="mt-1">
                <SecureImage
                  url={
                    v.directorSignature.present
                      ? vouchersApi.directorSignatureUrl(v.id)
                      : null
                  }
                  alt="Director signature"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Audit Information" />
          <CardBody>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Created" value={formatDateTime(v.createdAt)} />
              <Field label="Last Updated" value={formatDateTime(v.updatedAt)} />
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Status Timeline" />
          <CardBody>
            {history.isLoading ? (
              <div className="space-y-2" role="status" aria-label="Loading history">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <span className="sr-only">Loading timeline…</span>
              </div>
            ) : history.isError ? (
              <ErrorState
                message={apiErrorMessage(history.error, 'Failed to load history.')}
                onRetry={() => history.refetch()}
              />
            ) : timeline.length === 0 ? (
              <EmptyState title="No history yet" />
            ) : (
              <ol className="relative space-y-4 border-l-2 border-gray-200 pl-4">
                {timeline.map((h) => (
                  <li key={h.id} className="relative">
                    <span
                      className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-600"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-medium text-gray-900">
                      {h.fromStatus
                        ? `${STATUS_LABELS[h.fromStatus] ?? h.fromStatus} → ${STATUS_LABELS[h.toStatus] ?? h.toStatus}`
                        : (STATUS_LABELS[h.toStatus] ?? h.toStatus)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {h.actorName} ({h.actorRole}) ·{' '}
                      {formatDateTime(h.createdAt ?? h.at)}
                    </p>
                    {h.remarks && (
                      <p className="mt-0.5 text-sm text-gray-700">{h.remarks}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Confirm dialogs */}
      <Modal
        open={submitOpen}
        title="Submit for approval?"
        onClose={() => setSubmitOpen(false)}
      >
        <p className="text-sm text-gray-600">
          Once submitted, voucher {v.voucherNumber} becomes read-only.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setSubmitOpen(false)}>
            Cancel
          </Button>
          <Button
            loading={submitMutation.isPending}
            disabled={submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
          >
            Confirm submit
          </Button>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        title="Delete draft?"
        onClose={() => setDeleteOpen(false)}
      >
        <p className="text-sm text-gray-600">
          Permanently delete voucher {v.voucherNumber}? This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            Delete
          </Button>
        </div>
      </Modal>

      <ApproveDialog
        voucherId={v.id}
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        onDone={() => setApproveOpen(false)}
      />
      <RejectDialog
        voucherId={v.id}
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onDone={() => setRejectOpen(false)}
      />
    </div>
  );
}
