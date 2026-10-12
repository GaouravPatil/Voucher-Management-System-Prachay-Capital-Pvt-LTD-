import { VoucherListPage } from '../../components/vouchers/VoucherListPage';

export function AccountsAllVouchers() {
  return (
    <VoucherListPage
      scope="accounts"
      title="All Vouchers"
      subtitle="Every voucher across the organization. Use filters to build the reimbursement queue."
      detailBase="/accounts/vouchers"
      showEmployeeFilter
    />
  );
}
