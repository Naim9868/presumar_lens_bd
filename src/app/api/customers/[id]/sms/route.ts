// src/app/api/customers/[id]/sms/route.ts
import { NextRequest } from 'next/server';
import Customer from '@/models/Customer';
import { connectDB } from '@/lib/dbConnect';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { message, type = 'single' } = body;

    if (!message) {
      return Response.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const customer = await Customer.findById(id);
    if (!customer) {
      return Response.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Add SMS to history
    customer.smsHistory.push({
      message,
      sentAt: new Date(),
      type,
      status: 'sent',
    });

    await customer.save();

    // Log to console (replace with actual SMS service later)
    console.log(`SMS sent to ${customer.phone}:`, message);

    return Response.json({
      success: true,
      message: 'SMS sent successfully',
      smsHistory: customer.smsHistory,
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return Response.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const customer = await Customer.findById(id).select('smsHistory phone name');
    if (!customer) {
      return Response.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return Response.json({
      smsHistory: customer.smsHistory,
      phone: customer.phone,
      name: customer.name,
    });
  } catch (error) {
    console.error('Error fetching SMS history:', error);
    return Response.json(
      { error: 'Failed to fetch SMS history' },
      { status: 500 }
    );
  }
}