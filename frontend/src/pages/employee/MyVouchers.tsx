import { VoucherListPage } from '../../components/vouchers/VoucherListPage';

export function MyVouchers() {
  return (
    <VoucherListPage
      scope="employee"
      title="My Vouchers"
      subtitle="Only vouchers created by you are listed here."
      detailBase="/employee/vouchers"
      allowCreate
    />
  );
}
