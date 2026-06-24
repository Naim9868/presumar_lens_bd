// src/lib/order-export.ts
import { Order } from '@/types/order';

export function exportOrdersToCSV(orders: Order[]): void {
  const headers = [
    'Order ID', 'Date', 'Customer Name', 'Phone', 'City', 'Items', 'Subtotal',
    'Delivery', 'Discount', 'Total', 'Payment Method', 'Payment Status',
    'Status', 'Courier', 'Tracking ID', 'Source',
  ];

  const rows = orders.map((o) => [
    o.orderId,
    new Date(o.createdAt).toLocaleDateString('en-BD'),
    o.shipping.name,
    o.shipping.phone,
    o.shipping.city,
    o.items.map((i) => `${i.snapshot.name} x${i.quantity}`).join(' | '),
    o.pricing.subtotal,
    o.pricing.deliveryCharge,
    o.pricing.couponDiscount + o.pricing.itemDiscount + o.pricing.campaignDiscount,
    o.pricing.total,
    o.paymentMethod,
    o.paymentStatus,
    o.status,
    o.shipment?.provider ?? '',
    o.shipment?.trackingId ?? '',
    o.marketing?.source ?? 'direct',
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportOrdersToPDF(orders: Order[]): void {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Orders Export</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; }
        h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
        p { color: #666; margin-bottom: 16px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1a1a2e; color: white; padding: 8px 6px; text-align: left; font-size: 10px; }
        td { padding: 7px 6px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
        tr:nth-child(even) td { background: #f9fafb; }
        .status { padding: 2px 6px; border-radius: 99px; font-size: 10px; font-weight: 600; }
        .badge { display: inline-block; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>Orders Report</h1>
      <p>Generated: ${new Date().toLocaleString('en-BD')} — Total: ${orders.length} orders</p>
      <table>
        <thead>
          <tr>
            <th>Order ID</th><th>Date</th><th>Customer</th>
            <th>Items</th><th>Total</th><th>Payment</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${orders
            .map(
              (o) => `
            <tr>
              <td><strong>${o.orderId}</strong></td>
              <td>${new Date(o.createdAt).toLocaleDateString('en-BD')}</td>
              <td>${o.shipping.name}<br/><span style="color:#666">${o.shipping.phone}</span></td>
              <td>${o.items.map((i) => `${i.snapshot.name} ×${i.quantity}`).join('<br/>')}</td>
              <td><strong>৳${o.pricing.total.toLocaleString()}</strong></td>
              <td>${o.paymentMethod}<br/>${o.paymentStatus}</td>
              <td>${o.status}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
}

export function printInvoice(order: Order): void {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice — ${order.orderId}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 32px; max-width: 720px; margin: auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #1a1a2e; margin-bottom: 24px; }
        .logo { font-size: 22px; font-weight: 800; color: #1a1a2e; }
        .invoice-meta { text-align: right; }
        .invoice-meta h2 { font-size: 20px; font-weight: 700; color: #1a1a2e; }
        .invoice-meta p { color: #666; font-size: 11px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        .section h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #999; margin-bottom: 8px; }
        .section p { font-size: 12px; line-height: 1.7; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #1a1a2e; color: white; padding: 10px 12px; text-align: left; font-size: 11px; }
        th:last-child, td:last-child { text-align: right; }
        td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
        .totals { margin-left: auto; width: 280px; }
        .totals tr td:first-child { color: #555; }
        .totals tr.grand td { font-weight: 700; font-size: 14px; border-top: 2px solid #1a1a2e; padding-top: 8px; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #999; font-size: 11px; }
        @media print { @page { margin: 20mm; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">${process.env.NEXT_PUBLIC_STORE_NAME || 'Store'}</div>
        <div class="invoice-meta">
          <h2>INVOICE</h2>
          <p>#${order.orderId}</p>
          <p>Date: ${new Date(order.createdAt).toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p>Status: ${order.status}</p>
        </div>
      </div>

      <div class="grid">
        <div class="section">
          <h3>Bill To</h3>
          <p>
            <strong>${order.shipping.name}</strong><br/>
            ${order.shipping.phone}<br/>
            ${order.shipping.email ?? ''}<br/>
            ${order.shipping.address}<br/>
            ${order.shipping.area}, ${order.shipping.city}
            ${order.shipping.postcode ? ' - ' + order.shipping.postcode : ''}
          </p>
        </div>
        <div class="section">
          <h3>Payment Info</h3>
          <p>
            Method: <strong>${order.paymentMethod}</strong><br/>
            Status: <strong>${order.paymentStatus}</strong><br/>
            Delivery: ${order.delivery.type.replace('_', ' ')}<br/>
            ${order.coupon ? `Coupon: ${order.coupon.code}` : ''}
          </p>
        </div>
      </div>

      <table>
        <thead>
          <tr><th>Item</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
        </thead>
        <tbody>
          ${order.items.map((item) => `
            <tr>
              <td>${item.snapshot.name}</td>
              <td>${item.snapshot.sku ?? '—'}</td>
              <td>${item.quantity}</td>
              <td>৳${item.price.sale.toLocaleString()}</td>
              <td>৳${item.total.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <table class="totals">
        <tr><td>Subtotal</td><td>৳${order.pricing.subtotal.toLocaleString()}</td></tr>
        ${order.pricing.itemDiscount > 0 ? `<tr><td>Item Discount</td><td>-৳${order.pricing.itemDiscount.toLocaleString()}</td></tr>` : ''}
        ${order.pricing.couponDiscount > 0 ? `<tr><td>Coupon (${order.coupon?.code ?? ''})</td><td>-৳${order.pricing.couponDiscount.toLocaleString()}</td></tr>` : ''}
        <tr><td>Delivery Charge</td><td>৳${order.pricing.deliveryCharge.toLocaleString()}</td></tr>
        ${order.pricing.tax > 0 ? `<tr><td>Tax</td><td>৳${order.pricing.tax.toLocaleString()}</td></tr>` : ''}
        <tr class="grand"><td>Grand Total</td><td>৳${order.pricing.total.toLocaleString()}</td></tr>
      </table>

      <div class="footer">
        Thank you for your order! For support, contact ${process.env.NEXT_PUBLIC_STORE_EMAIL ?? 'support@store.com'}
      </div>
    </body>
    </html>
  `;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 600);
}