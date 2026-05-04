// app/api/notifications/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendNotification } from '@/lib/services/notification.service';
// import { authenticate } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // const user = await authenticate(req);
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    const { userId, type, orderId, customMessage } = await req.json();
    
    await sendNotification({
      userId,
      type,
      orderId,
      customMessage,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}