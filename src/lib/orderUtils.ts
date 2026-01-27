/**
 * Maps order payment status + method to display label and optional detail.
 * Used in Dashboard, OrderDetail, Admin Orders.
 */
export function getPaymentStatusDisplay(order: {
  paymentStatus?: string;
  paymentMethod?: string;
  paymentAmount?: number;
  total?: number;
}): { label: string; className: string; detail?: string } {
  const status = (order.paymentStatus || 'PENDING').toUpperCase();
  const method = (order.paymentMethod || '').toUpperCase();

  if ((method === 'COD' || method === 'CASH_ON_DELIVERY') && status === 'PENDING') {
    return { label: 'Full COD', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
  }
  if (method === 'PARTIAL_COD' && status === 'PAID') {
    const paid = Number(order.paymentAmount ?? 0);
    const total = Number(order.total ?? 0);
    const pending = total - paid;
    const detail = total > 0 ? `₹${paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })} paid, ₹${pending.toLocaleString('en-IN', { minimumFractionDigits: 2 })} pending` : undefined;
    return { label: 'Partial Paid', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', detail };
  }
  if (method === 'PARTIAL_COD' && status === 'PENDING') {
    return { label: 'Partial COD (Pending)', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
  }
  if (status === 'PAID') {
    return { label: 'Paid', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
  }
  if (status === 'FAILED') {
    return { label: 'Failed', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
  }
  if (status === 'REFUNDED') {
    return { label: 'Refunded', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' };
  }
  return { label: 'Pending', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
}
