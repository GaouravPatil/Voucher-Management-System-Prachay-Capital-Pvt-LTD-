import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { metaApi } from '../../api/meta.api';
import { authApi } from '../../api/auth.api';
import { voucherFormSchema, type VoucherFormValues } from '../../lib/schemas';
import { todayISODate } from '../../lib/formatters';
import { CATEGORIES, DEPARTMENTS } from '../../lib/constants';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { ImageUploader } from '../ui/ImageUploader';
import { Modal } from '../ui/Modal';
import { FormSection, FullRow } from '../forms/FormSection';
import type { Voucher } from '../../types';

export interface VoucherSubmitArgs {
  values: VoucherFormValues;
  signature: File | null;
  useSavedSignature: boolean;
}

interface Props {
  mode: 'create' | 'edit';
  initial?: Voucher | null;
  saving: boolean;
  submitting: boolean;
  fieldErrors: Record<string, string>;
  onSaveDraft: (args: VoucherSubmitArgs) => void;
  onSubmit: (args: VoucherSubmitArgs) => void;
  onCancel: () => void;
}

const FALLBACK_DEPTS = [...DEPARTMENTS];
const FALLBACK_CATS = [...CATEGORIES];

export function VoucherForm({
  mode,
  initial,
  saving,
  submitting,
  fieldErrors,
  onSaveDraft,
  onSubmit,
  onCancel,
}: Props) {
  const [signature, setSignature] = useState<File | null>(null);
  const [useSaved, setUseSaved] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitBlocked, setSubmitBlocked] = useState<string | null>(null);

  const { data: options } = useQuery({
    queryKey: ['meta-options'],
    queryFn: metaApi.options,
    staleTime: 10 * 60 * 1000,
  });
  const { data: sigStatus } = useQuery({
    queryKey: ['my-signature'],
    queryFn: authApi.signatureStatus,
    staleTime: 60 * 1000,
  });

  const departments = options?.departments?.length
    ? options.departments
    : FALLBACK_DEPTS;
  const categories = options?.categories?.length
    ? options.categories
    : FALLBACK_CATS;

  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherFormSchema),
    defaultValues: {
      departmentName: initial?.departmentName ?? '',
      expenseTitle: initial?.expenseTitle ?? '',
      expenseDate: initial?.expenseDate?.slice(0, 10) ?? '',
      expenseCategory: initial?.expenseCategory ?? 'Miscellaneous',
      expenseDescription: initial?.expenseDescription ?? '',
      amount: initial?.amount ?? '',
      employeeCode: initial?.employee?.employeeCode ?? '',
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
    setError,
  } = form;

  // Map server field errors onto the form.
  useEffect(() => {
    for (const [field, message] of Object.entries(fieldErrors)) {
      const name = field as keyof VoucherFormValues;
      if (['departmentName', 'expenseTitle', 'expenseDate', 'expenseCategory', 'expenseDescription', 'amount', 'employeeCode'].includes(field)) {
        setError(name, { type: 'server', message });
      }
    }
  }, [fieldErrors, setError]);

  // Unsaved-changes warning.
  useEffect(() => {
    if (!isDirty && !signature) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty, signature]);

  const busy = saving || submitting;
  const description = watch('expenseDescription') ?? '';
  const hasExistingSig = !!initial?.employeeSignature.present;
  const hasSavedSig = !!sigStatus?.present;

  const args = (): VoucherSubmitArgs => ({
    values: {
      departmentName: watch('departmentName'),
      expenseTitle: watch('expenseTitle'),
      expenseDate: watch('expenseDate'),
      expenseCategory: watch('expenseCategory') || 'Miscellaneous',
      expenseDescription: watch('expenseDescription'),
      amount: watch('amount'),
      employeeCode: watch('employeeCode'),
    },
    signature,
    useSavedSignature: useSaved,
  });

  const handleSaveDraft = handleSubmit(() => {
    setSubmitBlocked(null);
    onSaveDraft(args());
  });

  const requestSubmit = handleSubmit(() => {
    // Signature required before submission (WORKFLOW_RULES §4).
    if (!signature && !useSaved && !hasSavedSig && !hasExistingSig) {
      setSubmitBlocked(
        'Employee signature is required before submission. Upload a signature or tick "Use my saved signature".',
      );
      return;
    }
    setSubmitBlocked(null);
    setConfirmOpen(true);
  });

  return (
    <form
      aria-label={mode === 'create' ? 'Create voucher' : 'Edit voucher'}
      className="flex flex-col gap-4"
      onSubmit={(e) => e.preventDefault()}
      noValidate
    >
      {/* Read-only identifiers */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Voucher Number
          </p>
          <p className="mt-0.5 text-sm font-semibold text-gray-900">
            {mode === 'create'
              ? 'Auto-generated on save'
              : (initial?.voucherNumber ?? '—')}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Voucher Date
          </p>
          <p className="mt-0.5 text-sm font-semibold text-gray-900">
            {mode === 'create'
              ? `${todayISODate()} (today)`
              : (initial?.voucherDate?.slice(0, 10) ?? '—')}
          </p>
        </div>
      </div>

      <FormSection
        title="Expense Details"
        description="All fields marked * are mandatory."
      >
        <Select
          label="Department"
          required
          error={errors.departmentName?.message}
          placeholder="Select department"
          options={departments.map((d) => ({ value: d, label: d }))}
          {...register('departmentName')}
        />
        <Select
          label="Expense Category"
          error={errors.expenseCategory?.message}
          options={categories.map((c) => ({ value: c, label: c }))}
          {...register('expenseCategory')}
        />
        <FullRow>
          <Input
            label="Expense Title"
            required
            placeholder="e.g. Client visit cab fare"
            error={errors.expenseTitle?.message}
            {...register('expenseTitle')}
          />
        </FullRow>
        <Input
          label="Expense Date"
          required
          type="date"
          max={todayISODate()}
          error={errors.expenseDate?.message}
          {...register('expenseDate')}
        />
        <div className="flex flex-col gap-1">
          <Input
            label="Amount (INR)"
            required
            inputMode="decimal"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <p className="flex items-center gap-1 text-xs text-gray-500">
            <Info className="h-3 w-3" aria-hidden="true" />
            Enter numbers only, up to 2 decimals (e.g. 1250.50).
          </p>
        </div>
        <FullRow>
          <Textarea
            label="Expense Description"
            rows={4}
            maxLength={2000}
            showCount
            value={description}
            placeholder="Optional details about this expense…"
            error={errors.expenseDescription?.message}
            {...register('expenseDescription')}
          />
        </FullRow>
      </FormSection>

      <FormSection
        title="Employee Information"
        description="Name comes from your profile and cannot be changed here."
      >
        <Input
          label="Employee ID (optional)"
          placeholder="e.g. E-1001"
          error={errors.employeeCode?.message}
          {...register('employeeCode')}
        />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Employee Name</span>
          <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {initial?.employee.name ?? 'From your profile'}
          </p>
        </div>
        <FullRow>
          <ImageUploader
            label="Employee Signature"
            value={signature}
            onChange={(f) => {
              setSignature(f);
              setSubmitBlocked(null);
            }}
            existingPreviewUrl={undefined}
            useSavedOption={{
              available: hasSavedSig || hasExistingSig,
              checked: useSaved,
              onToggle: (v) => {
                setUseSaved(v);
                setSubmitBlocked(null);
              },
            }}
          />
          {submitBlocked && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {submitBlocked}
            </p>
          )}
        </FullRow>
      </FormSection>

      {fieldErrors._form && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {fieldErrors._form}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="secondary"
          onClick={handleSaveDraft}
          loading={saving}
          disabled={busy}
        >
          Save as Draft
        </Button>
        <Button onClick={requestSubmit} loading={submitting} disabled={busy}>
          Submit for Approval
        </Button>
      </div>

      <Modal
        open={confirmOpen}
        title="Submit for approval?"
        onClose={() => setConfirmOpen(false)}
      >
        <p className="text-sm text-gray-600">
          Once submitted, the voucher becomes read-only and moves to the
          Director&apos;s pending queue. You will not be able to edit or
          delete it afterwards.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Keep editing
          </Button>
          <Button
            loading={submitting}
            disabled={submitting}
            onClick={() => {
              setConfirmOpen(false);
              onSubmit(args());
            }}
          >
            Confirm submit
          </Button>
        </div>
      </Modal>
    </form>
  );
}
