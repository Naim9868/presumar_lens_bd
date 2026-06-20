// src/app/admin/customers/page.tsx
import { Suspense } from 'react';
import CustomersClient from '@/components/admin/customer/CustomersClient';
import { getCustomers } from '@/app/actions/customer/getCustomers';

export const dynamic = 'force-dynamic';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    accountType?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}) {
  const params = await searchParams;
  
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '20');
  const search = params.search || '';
  const status = params.status || 'ALL';
  const accountType = params.accountType || 'all';
  const sortBy = params.sortBy || 'updatedAt';
  const sortOrder = params.sortOrder || 'desc';

  const result = await getCustomers({
    page,
    limit,
    search,
    status,
    accountType,
    sortBy,
    sortOrder,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">Manage your customer database</p>
        </div>
      </div>

      <Suspense fallback={<div className="text-center py-8">Loading customers...</div>}>
        <CustomersClient
          initialCustomers={result.customers}
          initialPagination={result.pagination}
          initialStats={result.stats}
        />
      </Suspense>
    </div>
  );
}