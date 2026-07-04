// app/admin/shipping/shipments/[id]/components/ShipmentDetail.tsx
"use client";

import { format } from "date-fns";
import axios from "axios";
import type { OrderShipment } from "@/types/order";

interface ShipmentDetailProps {
  shipment: OrderShipment & {
    orderId?: string | { orderId: string };
    events?: Array<{
      status: string;
      time: string;
      note?: string;
      location?: string;
    }>;
  };
}

const statusColors: Record<string, string> = {
  BOOKED: "bg-blue-100 text-blue-800",
  PICKED: "bg-yellow-100 text-yellow-800",
  IN_TRANSIT: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

export function ShipmentDetail({ shipment }: ShipmentDetailProps) {
  const events = shipment.events ?? [];
  const handleTrack = async () => {
    try {
      const response = await axios.get(`/api/shipments/track/${shipment._id}`);
      // Refresh page or update state
      window.location.reload();
    } catch (error) {
      console.error("Failed to track:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Info */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Shipment Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Tracking ID</p>
              <p className="font-medium">{shipment.trackingId || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-medium">
                #{typeof shipment.orderId === "string" ? shipment.orderId : shipment.orderId?.orderId}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Provider</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md border border-gray-300 text-sm font-medium">
                {shipment.provider}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[shipment.status] || "bg-gray-100 text-gray-800"}`}>
                {shipment.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Booked At</p>
              <p className="font-medium">
                {shipment.bookedAt ? format(new Date(shipment.bookedAt), "PPp") : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Consignment ID</p>
              <p className="font-medium">{shipment.consignmentId || "N/A"}</p>
            </div>
          </div>

          {shipment.trackingUrl && (
            <button
              onClick={() => window.open(shipment.trackingUrl, "_blank")}
              className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Track on {shipment.provider}
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
        </div>
        <div className="p-6 space-y-4">
          <button
            onClick={handleTrack}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Tracking
          </button>
          <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2 transition-colors">
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            View Order
          </button>
          <button className="w-full bg-red-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center gap-2 transition-colors">
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel Shipment
          </button>
        </div>
      </div>

      {/* Tracking Timeline */}
      <div className="lg:col-span-3 bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Tracking History</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {events.length > 0 ? (
              events.map((event, index) => (
                <div key={index} className="flex gap-4">
                  <div className="relative flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? "bg-blue-600" : "bg-gray-300"
                    } mt-1.5`}></div>
                    {index < events.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{event.status}</p>
                      <span className="text-xs text-gray-500">
                        {format(new Date(event.time), "PPp")}
                      </span>
                    </div>
                    {event.note && (
                      <p className="text-sm text-gray-500 mt-1">{event.note}</p>
                    )}
                    {event.location && (
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <svg className="h-3 w-3 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No tracking events available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}