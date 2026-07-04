// app/admin/shipping/shipments/page.tsx
import { ShipmentsTable } from "@/components/admin/shipping/ShipmentsTable";
import { ShipmentFilters } from "@/components/admin/shipping/ShipmentFilters";
import { getShipments } from "@/services/shipment.service";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    provider?: string;
    search?: string;
  }>;
}

export default async function ShipmentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = parseInt(params.limit || "10");
  
  const { shipments, total, totalPages } = await getShipments({
    page,
    limit,
    status: params.status,
    provider: params.provider,
    search: params.search,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shipments</h1>
          <p className="text-muted-foreground">Manage all your shipments</p>
        </div>
        <div className="flex gap-2">
          {/* Add Bulk Actions Button */}
        </div>
      </div>

      <ShipmentFilters />
      <ShipmentsTable 
        shipments={shipments} 
        currentPage={page}
        totalPages={totalPages}
        total={total}
      />
    </div>
  );
}