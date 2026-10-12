import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../api/auth.api';
import { vouchersApi } from '../../api/vouchers.api';
import { apiErrorMessage } from '../../api/client';
import { approveSchema, type ApproveFormValues } from '../../lib/schemas';
import { ImageUploader } from '../ui/ImageUploader';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface Props {
  voucherId: string;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

export function ApproveDialog({ voucherId, open, onClose, onDone }: Props) {
  const queryClient = useQueryClient();
  const [signature, setSignature] = useState<File | null>(null);
  const [sigError, setSigError] = useState<string | null>(null);

  const { data: sigStatus } = useQuery({
    queryKey: ['my-signature'],
    queryFn: authApi.signatureStatus,
    staleTime: 60 * 1000,
    enabled: open,
  });

  const form = useForm<ApproveFormValues>({
    resolver: zodResolver(approveSchema),
    defaultValues: { useSavedSignature: false, remarks: '' },
  });
  const useSaved = form.watch('useSavedSignature');
  const remarks = form.watch('remarks') ?? '';

  const mutation = useMutation({
    mutationFn: () =>
      vouchersApi.approve(voucherId, {
        file: signature,
        useSavedSignature: useSaved,
        remarks: remarks || undefined,
      }),
    onSuccess: () => {
      toast.success('Voucher approved.');
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['voucher', voucherId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onDone();
    },
    onError: (e) => toast.error(apiErrorMessage(e, 'Failed to approve voucher.')),
  });

  const confirm = () => {
    if (!signature && !useSaved) {
      setSigError('Director signature is required before approval');
      return;
    }
    setSigError(null);
    mutation.mutate();
  };

  return (
    <Modal open={open} title="Approve voucher" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <ImageUploader
          label="Director Signature"
          value={signature}
          onChange={(f) => {
            setSignature(f);
            setSigError(null);
          }}
          error={sigError ?? undefined}
          useSavedOption={{
            available: !!sigStatus?.present,
            checked: useSaved,
            onToggle: (v) => {
              form.setValue('useSavedSignature', v);
              setSigError(null);
            },
          }}
        />
        <Textarea
          label="Remarks (optional)"
          rows={3}
          maxLength={1000}
          showCount
          value={remarks}
          placeholder="Optional approval remarks…"
          {...form.register('remarks')}
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={confirm}
            loading={mutation.isPending}
            disabled={mutation.isPending || (!signature && !useSaved)}
          >
            Confirm approval
          </Button>
        </div>
      </div>
    </Modal>
  );
}
