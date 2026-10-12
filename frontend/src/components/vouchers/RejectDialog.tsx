import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { vouchersApi } from '../../api/vouchers.api';
import { apiErrorMessage } from '../../api/client';
import { rejectSchema, type RejectFormValues } from '../../lib/schemas';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface Props {
  voucherId: string;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

export function RejectDialog({ voucherId, open, onClose, onDone }: Props) {
  const queryClient = useQueryClient();
  const form = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: '' },
  });
  const reason = form.watch('reason') ?? '';

  const mutation = useMutation({
    mutationFn: (r: string) => vouchersApi.reject(voucherId, r),
    onSuccess: () => {
      toast.success('Voucher rejected.');
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['voucher', voucherId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onDone();
    },
    onError: (e) => toast.error(apiErrorMessage(e, 'Failed to reject voucher.')),
  });

  return (
    <Modal open={open} title="Reject voucher" onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((v) => mutation.mutate(v.reason.trim()))}
        noValidate
      >
        <Textarea
          label="Rejection reason"
          required
          rows={4}
          maxLength={1000}
          showCount
          value={reason}
          placeholder="Explain why this voucher is rejected (min 5 characters)…"
          error={form.formState.errors.reason?.message}
          {...form.register('reason')}
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={mutation.isPending}
            disabled={mutation.isPending}
          >
            Confirm rejection
          </Button>
        </div>
      </form>
    </Modal>
  );
}
