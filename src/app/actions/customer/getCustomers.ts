// src/actions/customer/getCustomers.ts
'use server';

import { connectDB } from '@/lib/dbConnect';
import Customer from '@/models/Customer';

interface GetCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  accountType?: string;
  sortBy?: string;
  sortOrder?: string;
}

export async function getCustomers(params: GetCustomersParams) {
  try {
    await connectDB();

    const {
      page = 1,
      limit = 20,
      search = '',
      status = 'ALL',
      accountType = 'all',
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = params;

    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (accountType === 'registered') {
      filter['account.hasLogin'] = true;
    } else if (accountType === 'guest') {
      filter['account.hasLogin'] = false;
    }

    const skip = (page - 1) * limit;
    const sortObj: any = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments(filter),
    ]);

    // Calculate dashboard stats
    const [
      totalCustomers,
      returningCustomers,
      guestCustomers,
      avgOrderValue,
      customerLifetimeValue,
    ] = await Promise.all([
      Customer.countDocuments({ status: { $ne: 'ARCHIVED' } }),
      Customer.countDocuments({ 'stats.ordersCount': { $gt: 1 } }),
      Customer.countDocuments({ 'account.hasLogin': false, status: { $ne: 'ARCHIVED' } }),
      Customer.aggregate([
        { $match: { status: { $ne: 'ARCHIVED' } } },
        { $group: { _id: null, avg: { $avg: '$stats.totalSpent' } } },
      ]),
      Customer.aggregate([
        { $match: { status: { $ne: 'ARCHIVED' } } },
        { $group: { _id: null, total: { $sum: '$stats.totalSpent' } } },
      ]),
    ]);

    return {
      success: true,
      customers: customers.map((customer: any) => ({
        ...customer,
        _id: customer._id.toString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalCustomers,
        returningCustomers,
        guestCustomers,
        avgOrderValue: avgOrderValue[0]?.avg || 0,
        customerLifetimeValue: customerLifetimeValue[0]?.total || 0,
      },
    };
  } catch (error) {
    console.error('Error fetching customers:', error);
    return {
      success: false,
      error: 'Failed to fetch customers',
      customers: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      stats: {
        totalCustomers: 0,
        returningCustomers: 0,
        guestCustomers: 0,
        avgOrderValue: 0,
        customerLifetimeValue: 0,
      },
    };
  }
}