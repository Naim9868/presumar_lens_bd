
// app/api/customers/[id]/orders

import Order from '@/models/Order';
import Customer from '@/models/Customer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
 req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
){

 const id = (await params).id;
 const customer = await Customer.findById(id);

 const orders =
 await Order.find({
   $or:[
     {
       userId:
       customer._id
     },

     {
       guestPhone:
       customer.phone
     },
     {
      guestEmail: customer.email
     }
   ]
 })
 .sort({
   createdAt:-1
 });


 return NextResponse.json(
   orders
 );
}

