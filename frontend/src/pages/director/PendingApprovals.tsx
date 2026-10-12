import { VoucherListPage } from '../../components/vouchers/VoucherListPage';

export function PendingApprovals() {
  return (
    <VoucherListPage
      scope="director"
      title="Pending Approvals"
      subtitle="Vouchers awaiting your decision — oldest first."
      preset={{ status: 'PENDING_APPROVAL', sortBy: 'createdAt', sortOrder: 'asc' }}
      detailBase="/director/vouchers"
      showEmployeeFilter
    />
  );
}
