import { format } from 'date-fns';

declare module 'html2canvas';
declare module 'jspdf';

export async function generateInvoicePDF(order: any): Promise<Blob> {
  // This uses html2canvas and jsPDF for client-side PDF generation
  // For server-side, you can use puppeteer or pdf-lib
  
  const { default: html2canvas } = await import('html2canvas');
  const { default: jsPDF } = await import('jspdf');

  // Create the invoice HTML
  const invoiceElement = document.createElement('div');
  invoiceElement.innerHTML = `
    <div style="padding: 40px; font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 28px; margin: 0;">Invoice</h1>
        <p style="color: #666; font-size: 14px;">Order #${order.orderId}</p>
        <p style="color: #999; font-size: 12px;">${format(new Date(order.createdAt), 'PPP')}</p>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        <div>
          <h3 style="font-size: 14px; color: #666; margin-bottom: 5px;">Customer</h3>
          <p style="font-weight: 500;">${order.shipping.name}</p>
          <p style="color: #666; font-size: 12px;">${order.shipping.phone}</p>
          ${order.shipping.email ? `<p style="color: #666; font-size: 12px;">${order.shipping.email}</p>` : ''}
        </div>
        <div>
          <h3 style="font-size: 14px; color: #666; margin-bottom: 5px;">Delivery Address</h3>
          <p style="color: #666; font-size: 12px;">${order.shipping.address}</p>
          <p style="color: #666; font-size: 12px;">${order.shipping.area}, ${order.shipping.city}</p>
          ${order.shipping.division ? `<p style="color: #666; font-size: 12px;">${order.shipping.division}</p>` : ''}
        </div>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 10px; text-align: left; font-size: 12px;">Item</th>
            <th style="padding: 10px; text-align: center; font-size: 12px;">Qty</th>
            <th style="padding: 10px; text-align: right; font-size: 12px;">Price</th>
            <th style="padding: 10px; text-align: right; font-size: 12px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map((item: any) => `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px; font-size: 12px;">${item.snapshot.name}</td>
              <td style="padding: 10px; text-align: center; font-size: 12px;">${item.quantity}</td>
              <td style="padding: 10px; text-align: right; font-size: 12px;">${formatCurrency(item.price.sale)}</td>
              <td style="padding: 10px; text-align: right; font-size: 12px;">${formatCurrency(item.total)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 10px;"></td>
            <td style="padding: 10px; text-align: right; font-size: 12px; font-weight: 500;">Subtotal</td>
            <td style="padding: 10px; text-align: right; font-size: 12px;">${formatCurrency(order.pricing.subtotal)}</td>
          </tr>
          ${order.pricing.couponDiscount > 0 ? `
            <tr>
              <td colspan="2" style="padding: 10px;"></td>
              <td style="padding: 10px; text-align: right; font-size: 12px; color: green;">Discount</td>
              <td style="padding: 10px; text-align: right; font-size: 12px; color: green;">-${formatCurrency(order.pricing.couponDiscount)}</td>
            </tr>
          ` : ''}
          <tr>
            <td colspan="2" style="padding: 10px;"></td>
            <td style="padding: 10px; text-align: right; font-size: 12px; font-weight: 500;">Delivery</td>
            <td style="padding: 10px; text-align: right; font-size: 12px;">${formatCurrency(order.pricing.deliveryCharge)}</td>
          </tr>
          <tr style="border-top: 2px solid #000;">
            <td colspan="2" style="padding: 10px;"></td>
            <td style="padding: 10px; text-align: right; font-size: 16px; font-weight: bold;">Total</td>
            <td style="padding: 10px; text-align: right; font-size: 16px; font-weight: bold; color: #000;">${formatCurrency(order.pricing.total)}</td>
          </tr>
        </tfoot>
      </table>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #999;">
        <p>Thank you for your business!</p>
        <p>This is a system-generated invoice. No signature required.</p>
      </div>
    </div>
  `;

  document.body.appendChild(invoiceElement);
  
  const canvas = await html2canvas(invoiceElement, {
    scale: 2,
    useCORS: true,
    logging: false,
  });
  
  document.body.removeChild(invoiceElement);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [canvas.width / 2, canvas.height / 2],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
  return pdf.output('blob');
}

function formatCurrency(amount: number): string {
  return `৳${amount.toFixed(2)}`;
}