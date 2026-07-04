// app/admin/shipping/delivery_zones/page.tsx
import { DeliveryZonesManager } from "@/components/admin/shipping/DeliveryZonesManager";

export default async function DeliveryZonesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Delivery Zones</h1>
        <p className="text-muted-foreground">Manage delivery zones and coverage areas</p>
      </div>
      
      <DeliveryZonesManager />
    </div>
  );
}