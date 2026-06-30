'use client';

interface StatusBadgeProps {
  status: string;
}

const TONE: Record<string, string> = {
  pending: 'bg-yellow-light-2 text-yellow-dark-2',
  paid: 'bg-blue-light-5 text-blue-dark',
  shipped: 'bg-blue-light-5 text-blue-dark',
  processing: 'bg-blue-light-5 text-blue-dark',
  delivered: 'bg-green-light-6 text-green-dark',
  completed: 'bg-green-light-6 text-green-dark',
  cancelled: 'bg-red-light-6 text-red-dark',
  refunded: 'bg-red-light-6 text-red-dark',
  failed: 'bg-red-light-6 text-red-dark',
  active: 'bg-green-light-6 text-green-dark',
  inactive: 'bg-gray-2 text-meta-3',
  in_stock: 'bg-green-light-6 text-green-dark',
  low_stock: 'bg-yellow-light-2 text-yellow-dark-2',
  out_of_stock: 'bg-red-light-6 text-red-dark',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const cls = TONE[status] ?? 'bg-gray-2 text-meta-3';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold capitalize ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
