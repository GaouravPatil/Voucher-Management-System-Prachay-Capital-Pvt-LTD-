import { useParams } from 'react-router-dom';
import { VoucherDetailPage } from '../../components/vouchers/VoucherDetailPage';

export function DirectorVoucherDetails() {
  const { id } = useParams<{ id: string }>();
  return (
    <VoucherDetailPage voucherId={id ?? ''} backTo="/director/vouchers" />
  );
}
