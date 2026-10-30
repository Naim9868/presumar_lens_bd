import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import Order from '@/models/Order';
import { generateInvoicePDF } from '@/utils/pdf-generator';
import { getRawSettings } from '@/services/settings.service';

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

    const generalSettings = await getRawSettings('general');
    const pdfBlob = await generateInvoicePDF(order, {
      name: generalSettings.store_name || 'Prosumer Lens BD',
      email: generalSettings.store_email,
      phone: generalSettings.store_phone || generalSettings.support_phone,
      website: generalSettings.store_url,
      logoUrl: generalSettings.store_logo,
      address: [
        generalSettings.address_line1,
        generalSettings.address_line2,
        generalSettings.address_area,
        generalSettings.address_city,
        generalSettings.address_division,
        generalSettings.address_postcode,
      ].filter(Boolean).join(', '),
      currency: generalSettings.currency || order.pricing.currency || 'BDT',
      currencySymbol: generalSettings.currency_symbol || '৳',
    });
    
    // Return PDF as download
    return new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${order.orderId}.pdf"`,
      },
    });
  } catch (error: unknown) {
    console.error('Generate invoice error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}