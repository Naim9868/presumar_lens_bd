
// app/api/customers/[id]/orders

import Order from '@/models/Order';
import Customer from '@/models/Customer';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';

export async function GET(
 req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
){
 try {
   await connectDB();
   const id = (await params).id;
   const customer = await Customer.findById(id).lean();

   if (!customer) {
     return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
   }

   const identityFilters: Record<string, unknown>[] = [
     { userId: customer._id },
     { guestPhone: customer.phone },
     { 'shipping.phone': customer.phone },
   ];
   if (customer.email) {
     identityFilters.push(
       { guestEmail: customer.email },
       { 'shipping.email': customer.email },
     );
   }

   const orders = await Order.find({ $or: identityFilters })
     .sort({ createdAt: -1 })
     .lean();

   return NextResponse.json(orders);
 } catch (error) {
   console.error('Get customer orders error:', error);
   return NextResponse.json(
     { error: error instanceof Error ? error.message : 'Failed to fetch customer orders' },
     { status: 500 },
   );
 }
}
