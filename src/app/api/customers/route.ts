// src/app/api/customers/route.ts
import { NextRequest } from 'next/server';
import Customer from '@/models/Customer';
import { connectDB } from '@/lib/dbConnect';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 20;
    const search = url.searchParams.get('search');
    const status = url.searchParams.get('status');
    const accountType = url.searchParams.get('accountType');
    const sortBy = url.searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    const filter: any = {};

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Status filter
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    // Account type filter
    if (accountType === 'registered') {
      filter['account.hasLogin'] = true;
    } else if (accountType === 'guest') {
      filter['account.hasLogin'] = false;
    }

    const skip = (page - 1) * limit;

    // Build sort object
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

    return Response.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        totalCustomers,
        returningCustomers,
        guestCustomers,
        avgOrderValue: avgOrderValue[0]?.avg || 0,
        customerLifetimeValue: customerLifetimeValue[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return Response.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}