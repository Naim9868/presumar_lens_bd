// app/admin/shipping/tracking/components/TrackingDashboard.tsx
"use client";

import { useState } from "react";
import { format } from "date-fns";
import axios from "axios";
import type { OrderShipment } from "@/types/order";

type ShipmentWithOrder = OrderShipment & {
  orderId?: string | { orderId: string };
};

const statusIcons = {
  BOOKED: "📦",
  PICKED: "🚚",
  IN_TRANSIT: "📍",
  DELIVERED: "✅",
  FAILED: "⏰",
};

const statusColors = {
  BOOKED: "bg-blue-100 text-blue-800",
  PICKED: "bg-yellow-100 text-yellow-800",
  IN_TRANSIT: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

export function TrackingDashboard({ shipments }: { shipments: ShipmentWithOrder[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredShipments = shipments.filter((s: ShipmentWithOrder) => {
    const orderIdStr =
      typeof s.orderId === "string" ? s.orderId : s.orderId?.orderId;
    return (
      s.trackingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orderIdStr?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleTrack = async (shipmentId: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/shipments/track/${shipmentId}`);
      setTrackingData(response.data.data);
      setSelectedShipment(response.data.data.shipment);
    } catch (error) {
      console.error("Failed to track shipment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Shipments List */}
      <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Shipments</h2>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by tracking ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="p-4 max-h-[600px] overflow-y-auto">
          <div className="space-y-2">
            {filteredShipments.map((shipment: ShipmentWithOrder) => {
              const shipmentStatus = shipment.status as keyof typeof statusIcons;
              const statusIcon = statusIcons[shipmentStatus] || "📦";
              return (
                <div
                  key={shipment._id}
                  className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleTrack(shipment._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{statusIcon}</span>
                      <span className="font-medium text-sm">
                        {shipment.trackingId || "N/A"}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[shipmentStatus] || "bg-gray-100 text-gray-800"}`}>
                      {shipment.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Order #{typeof shipment.orderId === "string" ? shipment.orderId : shipment.orderId?.orderId}
                  </div>
                  <div className="text-xs text-gray-400">
                    {shipment.provider} • {shipment.bookedAt ? format(new Date(shipment.bookedAt), "PP") : "N/A"}
                  </div>
                </div>
              );
            })}
            {filteredShipments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No shipments found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tracking Details */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Tracking Details</h2>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : selectedShipment ? (
            <div className="space-y-6">
              {/* Shipment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Tracking ID</p>
                  <p className="font-medium">{selectedShipment.trackingId || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Provider</p>
                  <p className="font-medium">{selectedShipment.provider}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedShipment.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}`}>
                    {selectedShipment.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Booked At</p>
                  <p className="font-medium">
                    {selectedShipment.bookedAt ? format(new Date(selectedShipment.bookedAt), "PPp") : "N/A"}
                  </p>
                </div>
              </div>

              {/* Tracking Timeline */}
              {selectedShipment.events && selectedShipment.events.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium mb-4">Tracking History</h4>
                  <div className="space-y-4">
                    {selectedShipment.events.map((event: any, index: number) => (
                      <div key={index} className="flex gap-4">
                        <div className="relative flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-600' : 'bg-gray-300'} mt-1.5`}></div>
                          {index < selectedShipment.events.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{event.status}</p>
                          {event.note && (
                            <p className="text-sm text-gray-500">{event.note}</p>
                          )}
                          {event.location && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {event.location}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(event.time), "PPp")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tracking URL */}
              {selectedShipment.trackingUrl && (
                <div className="border-t border-gray-200 pt-4">
                  <button
                    className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    onClick={() => window.open(selectedShipment.trackingUrl, "_blank")}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Track on {selectedShipment.provider}
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <span className="text-6xl mb-4">📦</span>
              <p className="text-center">Select a shipment to view tracking details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}