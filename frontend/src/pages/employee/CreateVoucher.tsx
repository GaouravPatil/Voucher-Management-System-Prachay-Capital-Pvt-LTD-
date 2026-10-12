import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { vouchersApi } from '../../api/vouchers.api';
import { apiErrorMessage, apiFieldErrors } from '../../api/client';
import { VoucherForm, type VoucherSubmitArgs } from '../../components/vouchers/VoucherForm';

export function CreateVoucher() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'draft' | 'submit' | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const createMutation = useMutation({
    mutationFn: async ({ args, submit }: { args: VoucherSubmitArgs; submit: boolean }) => {
      const created = await vouchersApi.create(
        {
          departmentName: args.values.departmentName,
          expenseTitle: args.values.expenseTitle.trim(),
          expenseDate: args.values.expenseDate,
          expenseCategory: args.values.expenseCategory || 'Miscellaneous',
          expenseDescription: args.values.expenseDescription?.trim() || undefined,
          amount: args.values.amount,
          employeeCode: args.values.employeeCode?.trim() || undefined,
        },
        args.signature,
      );
      // Upload a newly-picked signature file BEFORE submit, so submit validation passes.
      if (args.signature) {
        await vouchersApi.uploadEmployeeSignature(created.id, args.signature);
      }
      if (submit) {
        return vouchersApi.submit(created.id);
      }
      return created;
    },
    onSuccess: (voucher, { submit }) => {
      invalidate();
      toast.success(submit ? 'Voucher submitted for approval.' : 'Draft saved.');
      navigate(`/employee/vouchers/${voucher.id}`);
    },
    onError: (e) => {
      setFieldErrors({ ...apiFieldErrors(e), _form: apiErrorMessage(e, 'Failed to save voucher.') });
      const details = apiFieldErrors(e);
      if (Object.keys(details).length === 0) {
        toast.error(apiErrorMessage(e, 'Failed to save voucher.'));
      }
    },
    onSettled: () => setMode(null),
  });

  const handle = (args: VoucherSubmitArgs, submit: boolean) => {
    setFieldErrors({});
    setMode(submit ? 'submit' : 'draft');
    createMutation.mutate({ args, submit });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">New Voucher</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Fill in the expense details. Save as draft or submit directly for approval.
        </p>
      </div>
      <VoucherForm
        mode="create"
        saving={createMutation.isPending && mode === 'draft'}
        submitting={createMutation.isPending && mode === 'submit'}
        fieldErrors={fieldErrors}
        onSaveDraft={(args) => handle(args, false)}
        onSubmit={(args) => handle(args, true)}
        onCancel={() => navigate('/employee/vouchers')}
      />
    </div>
  );
}
