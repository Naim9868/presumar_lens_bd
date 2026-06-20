// src/app/api/orders/[id]/note/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import Order from '@/models/Order';
import mongoose from 'mongoose';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { text, createdBy } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Note text is required' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    order.notes.push({
      text,
      createdBy: createdBy ? new mongoose.Types.ObjectId(createdBy) : undefined,
      createdAt: new Date(),
    });

    await order.save();

    return NextResponse.json({ 
      success: true, 
      note: order.notes[order.notes.length - 1] 
    });
  } catch (error: any) {
    console.error('Add order note error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add note' },
      { status: 500 }
    );
  }
}