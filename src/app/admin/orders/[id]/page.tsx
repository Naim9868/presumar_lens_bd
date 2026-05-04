import { notFound } from 'next/navigation';
import OrderDetailClient from './OrderDetailClient';
import { getOrderById } from '@/app/actions/order.actions';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

// This is a Server Component
export default async function OrderDetailPage({ params }: PageProps) {
  // Handle both sync and async params (Next.js 15 compatibility)
  const { id } = await params;
  
  const result = await getOrderById(id);

  if (!result.success || !result.order) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <OrderDetailClient order={result.order} />
    </div>
  );
}