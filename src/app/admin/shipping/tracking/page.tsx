// app/admin/shipping/tracking/page.tsx
import { TrackingDashboard } from "@/components/admin/shipping/TrackingDashboard";
import { getAllShipments } from "@/services/shipment.service";

export default async function TrackingPage() {
  const shipments = await getAllShipments({ limit: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tracking</h1>
        <p className="text-muted-foreground">Track all your shipments in real-time</p>
      </div>
      
      <TrackingDashboard shipments={shipments} />
    </div>
  );
}