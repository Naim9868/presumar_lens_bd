import type { IOrder } from '@/models/Order';

interface InvoiceStore {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  address?: string;
  currency: string;
  currencySymbol: string;
}

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function money(value: number | undefined, symbol: string) {
  return `${symbol} ${(Number(value) || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function text(value: unknown) {
  return value == null ? '' : String(value);
}

export async function generateInvoicePDF(
  order: IOrder,
  store: InvoiceStore = {
    name: 'Prosumer Lens BD',
    currency: order.pricing.currency || 'BDT',
    currencySymbol: '৳',
  },
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const symbol = store.currencySymbol || store.currency;
  const date = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  let y = MARGIN;

  const footer = () => {
    const pageCount = pdf.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      pdf.setPage(page);
      pdf.setDrawColor(225, 228, 235);
      pdf.line(MARGIN, PAGE_HEIGHT - 17, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 17);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(115, 122, 135);
      pdf.text(`Thank you for choosing ${store.name}`, MARGIN, PAGE_HEIGHT - 10);
      pdf.text(`Page ${page} of ${pageCount}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: 'right' });
    }
  };

  const addPage = () => {
    pdf.addPage();
    y = MARGIN;
    pdf.setFillColor(31, 41, 55);
    pdf.rect(0, 0, PAGE_WIDTH, 8, 'F');
    y = 16;
    drawItemsHeader();
  };

  const drawItemsHeader = () => {
    pdf.setFillColor(245, 247, 250);
    pdf.roundedRect(MARGIN, y, CONTENT_WIDTH, 10, 2, 2, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(75, 85, 99);
    pdf.text('ITEM DESCRIPTION', MARGIN + 4, y + 6.5);
    pdf.text('QTY', 130, y + 6.5, { align: 'center' });
    pdf.text('UNIT PRICE', 157, y + 6.5, { align: 'right' });
    pdf.text('AMOUNT', PAGE_WIDTH - MARGIN - 4, y + 6.5, { align: 'right' });
    y += 13;
  };

  pdf.setFillColor(31, 41, 55);
  pdf.rect(0, 0, PAGE_WIDTH, 43, 'F');
  pdf.setFillColor(245, 158, 11);
  pdf.rect(0, 40, PAGE_WIDTH, 3, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(19);
  pdf.text(store.name, MARGIN, 19);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  const contact = [store.phone, store.email, store.website].filter(Boolean).join('  |  ');
  if (contact) pdf.text(contact, MARGIN, 27);
  if (store.address) {
    pdf.text(pdf.splitTextToSize(store.address, 125) as string[], MARGIN, 34);
  }
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.text('INVOICE', PAGE_WIDTH - MARGIN, 18, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(`#${order.orderId}`, PAGE_WIDTH - MARGIN, 26, { align: 'right' });
  pdf.text(date, PAGE_WIDTH - MARGIN, 33, { align: 'right' });
  y = 56;

  const infoBox = (x: number, title: string, lines: string[]) => {
    const wrapped = lines.flatMap(line => pdf.splitTextToSize(line, 76) as string[]);
    const height = Math.max(29, wrapped.length * 4.5 + 15);
    pdf.setFillColor(249, 250, 251);
    pdf.setDrawColor(229, 231, 235);
    pdf.roundedRect(x, y, 85, height, 2, 2, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128);
    pdf.text(title.toUpperCase(), x + 5, y + 8);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(31, 41, 55);
    pdf.text(wrapped, x + 5, y + 15, { lineHeightFactor: 1.35 });
    return height;
  };

  const customerLines = [
    text(order.shipping.name),
    text(order.shipping.phone),
    text(order.shipping.email),
  ].filter(Boolean);
  const addressLines = [
    text(order.shipping.address),
    [order.shipping.area, order.shipping.city, order.shipping.postcode].filter(Boolean).join(', '),
    order.shipping.landmark ? `Landmark: ${order.shipping.landmark}` : '',
  ].filter(Boolean);
  const boxHeight = Math.max(
    infoBox(MARGIN, 'Billed to', customerLines),
    infoBox(MARGIN + 93, 'Delivery address', addressLines),
  );
  y += boxHeight + 12;

  drawItemsHeader();
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(31, 41, 55);
  for (const item of order.items || []) {
    const name = text(item.snapshot?.name || 'Product');
    const sku = item.snapshot?.sku ? `SKU: ${item.snapshot.sku}` : '';
    const lines = pdf.splitTextToSize(name, 92) as string[];
    const rowHeight = Math.max(11, lines.length * 4.5 + (sku ? 4 : 0));
    if (y + rowHeight > PAGE_HEIGHT - 30) addPage();
    pdf.setDrawColor(235, 237, 241);
    pdf.line(MARGIN, y + rowHeight, PAGE_WIDTH - MARGIN, y + rowHeight);
    pdf.text(lines, MARGIN + 4, y + 5, { lineHeightFactor: 1.25 });
    if (sku) {
      pdf.setFontSize(7.5);
      pdf.setTextColor(107, 114, 128);
      pdf.text(sku, MARGIN + 4, y + rowHeight - 3);
      pdf.setFontSize(8.5);
      pdf.setTextColor(31, 41, 55);
    }
    pdf.text(String(item.quantity || 0), 130, y + 6, { align: 'center' });
    pdf.text(money(item.price?.sale, symbol), 157, y + 6, { align: 'right' });
    pdf.text(money(item.total, symbol), PAGE_WIDTH - MARGIN - 4, y + 6, { align: 'right' });
    y += rowHeight;
  }

  if (y + 63 > PAGE_HEIGHT - 28) addPage();
  y += 10;
  const summaryX = 124;
  const summaryWidth = PAGE_WIDTH - MARGIN - summaryX;
  pdf.setFillColor(249, 250, 251);
  pdf.roundedRect(summaryX, y, summaryWidth, 48, 2, 2, 'F');
  const summaryRow = (label: string, value: string, bold = false) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(bold ? 11 : 9);
    pdf.setTextColor(31, 41, 55);
    pdf.text(label, summaryX + 6, y + 10);
    pdf.text(value, PAGE_WIDTH - MARGIN - 5, y + 10, { align: 'right' });
    y += bold ? 12 : 8;
  };
  summaryRow('Subtotal', money(order.pricing?.subtotal, symbol));
  if (Number(order.pricing?.itemDiscount) > 0) summaryRow('Item discount', `- ${money(order.pricing.itemDiscount, symbol)}`);
  if (Number(order.pricing?.couponDiscount) > 0) summaryRow('Coupon discount', `- ${money(order.pricing.couponDiscount, symbol)}`);
  summaryRow('Delivery charge', money(order.pricing?.deliveryCharge, symbol));
  summaryRow('TOTAL', money(order.pricing?.total, symbol), true);

  y += 12;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(31, 41, 55);
  pdf.text('PAYMENT & ORDER STATUS', MARGIN, y);
  y += 7;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(`Payment method: ${text(order.paymentMethod)}`, MARGIN, y);
  pdf.text(`Payment status: ${text(order.paymentStatus)}`, MARGIN + 70, y);
  pdf.text(`Order status: ${text(order.status)}`, MARGIN + 140, y);
  y += 13;
  pdf.setFillColor(255, 247, 237);
  pdf.setTextColor(146, 64, 14);
  pdf.roundedRect(MARGIN, y, CONTENT_WIDTH, 15, 2, 2, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Thank you for your order!', MARGIN + 6, y + 6);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('Please keep this invoice for your records.', MARGIN + 6, y + 11);
  footer();

  return new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
}
