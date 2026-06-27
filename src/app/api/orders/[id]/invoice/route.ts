import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import Order from '@/models/Order';
import { generateInvoicePDF } from '@/utils/pdf-generator';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdfBlob = await generateInvoicePDF(order);
    
    // Return PDF as download
    return new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${order.orderId}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Generate invoice error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}