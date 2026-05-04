// ./src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getOrderById } from '@/app/actions/order.actions';
import { dbConnect } from '@/lib/dbConnect';
import { OrderService } from '@/lib/services/order.service';
import Order from '@/models/Order';
import { Product } from '@/models';


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const order = await getOrderById(id);
    
    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }
    
    
    return NextResponse.json({
      success: true,
      data: {
        ...order
      }
    });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch order'
    }, { status: 500 });
  }
}


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
){
  try {
    await dbConnect();
    
    const { id } = await params;
    const body = await request.json();

    const order = await Order.findByIdAndUpdate(
      id,
      { status: body.status },
      { returnDocument: 'after',  runValidators: true }
    );

    if (!order) {
        console.log(`Order ${id} not found`); // Add logging
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if(body.status === 'DELIVERED'){
      const items = order.items;
      for (const item of items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { 'variants.$.inventory': -item.quantity } }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...order
      }
    });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update order'
    }, { status: 500 });
  }

}


export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
){
  try {
    await dbConnect();
    
    const { id } = await params;

    await Order.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting order:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete order'
    }, { status: 500 });
  }

}