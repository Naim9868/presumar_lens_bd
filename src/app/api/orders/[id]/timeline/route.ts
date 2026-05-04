// app/api/orders/[id]/timeline/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatusSchema } from '@/lib/validations/order.validation';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const validation = updateOrderStatusSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  
  const order = await OrderService.updateOrderStatus(
    params.id,
    validation.data.status,
    validation.data.note
  );
  
  // Emit WebSocket update
  const wsServer = req.socket?.server?.wsServer;
  if (wsServer) {
    wsServer.emitOrderUpdate(params.id, {
      status: order.status,
      timeline: order.timeline,
    });
  }
  
  return NextResponse.json(order);
}