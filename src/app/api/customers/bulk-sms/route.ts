// src/app/api/customers/bulk-sms/route.ts
import { NextRequest } from 'next/server';
import Customer from '@/models/Customer';
import { connectDB } from '@/lib/dbConnect';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { customerIds, message } = body;

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return Response.json(
        { error: 'Customer IDs are required' },
        { status: 400 }
      );
    }

    if (!message) {
      return Response.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Update all customers with SMS history
    const result = await Customer.updateMany(
      { _id: { $in: customerIds } },
      {
        $push: {
          smsHistory: {
            message,
            sentAt: new Date(),
            type: 'bulk',
            status: 'sent',
          },
        },
      }
    );

    // Log to console (replace with actual SMS service later)
    console.log(`Bulk SMS sent to ${result.modifiedCount} customers:`, message);

    return Response.json({
      success: true,
      message: `SMS sent to ${result.modifiedCount} customers`,
      count: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    return Response.json(
      { error: 'Failed to send bulk SMS' },
      { status: 500 }
    );
  }
}