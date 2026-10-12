import { useParams } from 'react-router-dom';
import { VoucherDetailPage } from '../../components/vouchers/VoucherDetailPage';

export function EmployeeVoucherDetails() {
  const { id } = useParams<{ id: string }>();
  return (
    <VoucherDetailPage
      voucherId={id ?? ''}
      backTo="/employee/vouchers"
      editTo={id ? `/employee/vouchers/${id}/edit` : undefined}
    />
  );
}
