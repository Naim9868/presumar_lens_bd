// app/admin/shipping/shipments/[id]/page.tsx
import { ShipmentDetail } from "@/components/admin/shipping/ShipmentDetail";
import { getShipmentById } from "@/services/shipment.service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ShipmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const shipment = await getShipmentById(id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shipment Details</h1>
        <p className="text-muted-foreground">View and manage shipment information</p>
      </div>
      
      <ShipmentDetail shipment={shipment} />
    </div>
  );
}