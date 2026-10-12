import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { VoucherDetailPage } from '../../components/vouchers/VoucherDetailPage';

/** Role-aware wrapper that renders the shared detail page with correct nav targets. */
export function SharedVoucherDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'EMPLOYEE') {
    return (
      <VoucherDetailPage
        voucherId={id ?? ''}
        backTo="/employee/vouchers"
        editTo={id ? `/employee/vouchers/${id}/edit` : undefined}
      />
    );
  }
  if (user.role === 'DIRECTOR') {
    return <VoucherDetailPage voucherId={id ?? ''} backTo="/director/vouchers" />;
  }
  return <VoucherDetailPage voucherId={id ?? ''} backTo="/accounts/vouchers" />;
}
