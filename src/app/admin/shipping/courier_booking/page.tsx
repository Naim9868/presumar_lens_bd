// app/admin/shipping/courier_booking/page.tsx
import { CourierBookingForm } from "@/components/admin/shipping/CourierBookingForm";
import { getOrdersForShipping } from "@/services/shipment.service";

export default async function CourierBookingPage() {
  const rawOrders = await getOrdersForShipping();

  // Strip Mongoose ObjectIds / non-plain values before crossing the server→client boundary
  const toPlain = (val: any): any => {
    if (val == null) return val;
    if (Array.isArray(val)) return val.map(toPlain);
    if (val instanceof Date) return val.toISOString();
    if (typeof val === "object") {
      // ObjectId (or any object with a toJSON method) — convert to hex string when possible
      if (typeof (val as any).toJSON === "function" || typeof (val as any).toString === "function") {
        const s = (val as any).toString();
        if (s && s !== "[object Object]" && s !== "[object Date]") return s;
      }
      const out: Record<string, any> = {};
      for (const k of Object.keys(val)) out[k] = toPlain(val[k]);
      return out;
    }
    return val;
  };

  const orders = toPlain(rawOrders);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Courier Bookings</h1>
        <p className="text-muted-foreground">Book shipments with your preferred courier</p>
      </div>

      <CourierBookingForm orders={orders} />
    </div>
  );
}