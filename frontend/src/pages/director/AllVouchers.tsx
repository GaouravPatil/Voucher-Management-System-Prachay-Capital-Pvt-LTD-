import { VoucherListPage } from '../../components/vouchers/VoucherListPage';

export function DirectorAllVouchers() {
  return (
    <VoucherListPage
      scope="director"
      title="All Vouchers"
      subtitle="Every submitted voucher across the organization."
      detailBase="/director/vouchers"
      showEmployeeFilter
    />
  );
}
