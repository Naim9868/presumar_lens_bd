import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatusSchema } from '@/lib/validations/order.validation';
import { dbConnect } from '@/lib/dbConnect';
import { OrderService } from '@/lib/services/order.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    const body = await req.json();

    const validation = updateOrderStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const order = await OrderService.updateOrderStatus(
      id,
      validation.data.status,
      validation.data.note
    );

    // ✅ WebSocket emit (safe access)
    const wsServer = (req as any)?.socket?.server?.wsServer;

    if (wsServer) {
      wsServer.emitOrderUpdate(id, {
        status: order.status,
        timeline: order.timeline,
      });
    }

    return NextResponse.json({
      success: true,
      data: order
    });

  } catch (error: any) {
    console.error('Timeline update error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update timeline'
      },
      { status: 500 }
    );
  }
}