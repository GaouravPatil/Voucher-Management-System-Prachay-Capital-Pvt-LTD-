import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { vouchersApi } from '../../api/vouchers.api';
import { apiErrorMessage, apiFieldErrors } from '../../api/client';
import { VoucherForm, type VoucherSubmitArgs } from '../../components/vouchers/VoucherForm';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';

export function EditVoucher() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'draft' | 'submit' | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const detail = useQuery({
    queryKey: ['voucher', id],
    queryFn: () => vouchersApi.get(id ?? ''),
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ args, submit }: { args: VoucherSubmitArgs; submit: boolean }) => {
      if (!id) throw new Error('Missing voucher id');
      const updated = await vouchersApi.update(id, {
        departmentName: args.values.departmentName,
        expenseTitle: args.values.expenseTitle.trim(),
        expenseDate: args.values.expenseDate,
        expenseCategory: args.values.expenseCategory || 'Miscellaneous',
        expenseDescription: args.values.expenseDescription?.trim() || undefined,
        amount: args.values.amount,
        employeeCode: args.values.employeeCode?.trim() || undefined,
      });
      if (args.signature) {
        await vouchersApi.uploadEmployeeSignature(id, args.signature);
      }
      if (submit) return vouchersApi.submit(id);
      return updated;
    },
    onSuccess: (voucher, { submit }) => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['voucher', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(submit ? 'Voucher submitted for approval.' : 'Draft updated.');
      navigate(`/employee/vouchers/${voucher.id}`);
    },
    onError: (e) => {
      setFieldErrors({ ...apiFieldErrors(e), _form: apiErrorMessage(e, 'Failed to update voucher.') });
      if (Object.keys(apiFieldErrors(e)).length === 0) {
        toast.error(apiErrorMessage(e, 'Failed to update voucher.'));
      }
    },
    onSettled: () => setMode(null),
  });

  if (detail.isLoading) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label="Loading voucher">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full" />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <Card>
        <ErrorState
          message={apiErrorMessage(detail.error, 'Failed to load voucher.')}
          onRetry={() => detail.refetch()}
        />
      </Card>
    );
  }

  const voucher = detail.data;

  // Only drafts can be edited — otherwise redirect to details with a toast.
  if (voucher.status !== 'DRAFT' || !voucher.permissions.canEdit) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-sm text-gray-700">
            Only draft vouchers can be edited. This voucher is{' '}
            <span className="font-semibold">{voucher.status}</span> and is
            read-only.
          </p>
          <Button onClick={() => navigate(`/employee/vouchers/${voucher.id}`)}>
            View voucher details
          </Button>
        </div>
      </Card>
    );
  }

  const handle = (args: VoucherSubmitArgs, submit: boolean) => {
    setFieldErrors({});
    setMode(submit ? 'submit' : 'draft');
    saveMutation.mutate({ args, submit });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Edit Draft — {voucher.voucherNumber}
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Only draft vouchers can be edited.
        </p>
      </div>
      <VoucherForm
        mode="edit"
        initial={voucher}
        saving={saveMutation.isPending && mode === 'draft'}
        submitting={saveMutation.isPending && mode === 'submit'}
        fieldErrors={fieldErrors}
        onSaveDraft={(args) => handle(args, false)}
        onSubmit={(args) => handle(args, true)}
        onCancel={() => navigate(`/employee/vouchers/${voucher.id}`)}
      />
    </div>
  );
}
