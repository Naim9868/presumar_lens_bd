// app/admin/shipping/courier_booking/components/CourierBookingForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface CourierBookingFormProps {
  orders: Array<{
    _id: string;
    orderId: string;
    shipping: {
      name: string;
      phone: string;
      address: string;
      city: string;
    };
    pricing: {
      total: number;
    };
  }>;
}

export function CourierBookingForm({ orders }: CourierBookingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    data?: any;
  } | null>(null);
  const [cities, setCities] = useState<Array<{ id: number; name: string }>>([]);
  const [zones, setZones] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("STEADFAST");
  
  // Form state
  const [formData, setFormData] = useState({
    orderId: "",
    provider: "STEADFAST" as "STEADFAST" | "PATHAO" | "REDX",
    pathao_storeId: "",
    pathao_cityId: "",
    pathao_zoneId: "",
    pathao_deliveryType: "",
    pathao_itemWeight: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load cities when Pathao is selected
  useEffect(() => {
    if (selectedProvider === "PATHAO") {
      axios.get("/api/shipments/cities")
        .then((res) => setCities(res.data.data.cities))
        .catch(console.error);
    }
  }, [selectedProvider]);

  // Load zones when city is selected
  useEffect(() => {
    if (formData.pathao_cityId && selectedProvider === "PATHAO") {
      axios.get(`/api/shipments/zones/${formData.pathao_cityId}`)
        .then((res) => setZones(res.data.data.zones))
        .catch(console.error);
    }
  }, [formData.pathao_cityId, selectedProvider]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.orderId) {
      newErrors.orderId = "Please select an order";
    }
    
    if (!formData.provider) {
      newErrors.provider = "Please select a courier provider";
    }

    if (formData.provider === "PATHAO") {
      if (!formData.pathao_storeId) {
        newErrors.pathao_storeId = "Store ID is required";
      }
      if (!formData.pathao_cityId) {
        newErrors.pathao_cityId = "City is required";
      }
      if (!formData.pathao_zoneId) {
        newErrors.pathao_zoneId = "Zone is required";
      }
      if (!formData.pathao_deliveryType) {
        newErrors.pathao_deliveryType = "Delivery type is required";
      }
      if (!formData.pathao_itemWeight) {
        newErrors.pathao_itemWeight = "Item weight is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const payload: any = {
        orderId: formData.orderId,
        provider: formData.provider,
      };

      if (formData.provider === "PATHAO") {
        payload.pathao = {
          storeId: parseInt(formData.pathao_storeId),
          cityId: parseInt(formData.pathao_cityId),
          zoneId: parseInt(formData.pathao_zoneId),
          deliveryType: parseInt(formData.pathao_deliveryType),
          itemWeight: parseFloat(formData.pathao_itemWeight),
        };
      }

      const response = await axios.post("/api/shipments/book", payload);
      setResult({
        success: true,
        message: "Shipment booked successfully!",
        data: response.data.data.shipment,
      });
      
      // Reset form
      setFormData({
        orderId: "",
        provider: "STEADFAST",
        pathao_storeId: "",
        pathao_cityId: "",
        pathao_zoneId: "",
        pathao_deliveryType: "",
        pathao_itemWeight: "",
      });
      setSelectedProvider("STEADFAST");
      router.refresh();
    } catch (error: any) {
      setResult({
        success: false,
        message: error.response?.data?.message || "Failed to book shipment",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderDisplay = (order: any) => {
    return `#${order.orderId} - ${order.shipping.name} (৳${order.pricing.total})`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm max-w-2xl mx-auto">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold mb-1">Book New Shipment</h2>
        <p className="text-sm text-gray-600">
          Select an order and courier provider to book a shipment
        </p>
      </div>

      <div className="p-6">
        <form onSubmit={onSubmit}>
          {/* Order Selection */}
          <div className="mb-6">
            <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <select
              id="orderId"
              value={formData.orderId}
              onChange={(e) => handleChange("orderId", e.target.value)}
              className={`w-full px-3 py-2 border ${errors.orderId ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="">Select an order</option>
              {orders.map((order) => (
                <option key={order._id} value={order._id}>
                  {getOrderDisplay(order)}
                </option>
              ))}
            </select>
            {errors.orderId && (
              <p className="text-xs text-red-500 mt-1">{errors.orderId}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Select the order you want to ship
            </p>
          </div>

          {/* Provider Selection */}
          <div className="mb-6">
            <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
              Courier Provider
            </label>
            <select
              id="provider"
              value={formData.provider}
              onChange={(e) => {
                const value = e.target.value as "STEADFAST" | "PATHAO" | "REDX";
                handleChange("provider", value);
                setSelectedProvider(value);
              }}
              className={`w-full px-3 py-2 border ${errors.provider ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="STEADFAST">SteadFast</option>
              <option value="PATHAO">Pathao</option>
              <option value="REDX">RedX</option>
            </select>
            {errors.provider && (
              <p className="text-xs text-red-500 mt-1">{errors.provider}</p>
            )}
          </div>

          {/* Pathao Specific Fields */}
          {selectedProvider === "PATHAO" && (
            <div className="border border-gray-300 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold mb-4">Pathao Configuration</h4>
              
              <div className="mb-4">
                <label htmlFor="pathao_storeId" className="block text-sm font-medium text-gray-700 mb-1">
                  Store ID
                </label>
                <input
                  id="pathao_storeId"
                  type="text"
                  value={formData.pathao_storeId}
                  onChange={(e) => handleChange("pathao_storeId", e.target.value)}
                  placeholder="Enter store ID"
                  className={`w-full px-3 py-2 border ${errors.pathao_storeId ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors.pathao_storeId && (
                  <p className="text-xs text-red-500 mt-1">{errors.pathao_storeId}</p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="pathao_cityId" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <select
                  id="pathao_cityId"
                  value={formData.pathao_cityId}
                  onChange={(e) => handleChange("pathao_cityId", e.target.value)}
                  className={`w-full px-3 py-2 border ${errors.pathao_cityId ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="">Select city</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id.toString()}>
                      {city.name}
                    </option>
                  ))}
                </select>
                {errors.pathao_cityId && (
                  <p className="text-xs text-red-500 mt-1">{errors.pathao_cityId}</p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="pathao_zoneId" className="block text-sm font-medium text-gray-700 mb-1">
                  Zone
                </label>
                <select
                  id="pathao_zoneId"
                  value={formData.pathao_zoneId}
                  onChange={(e) => handleChange("pathao_zoneId", e.target.value)}
                  disabled={!formData.pathao_cityId}
                  className={`w-full px-3 py-2 border ${errors.pathao_zoneId ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed`}
                >
                  <option value="">
                    {formData.pathao_cityId ? "Select zone" : "Select city first"}
                  </option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id.toString()}>
                      {zone.name}
                    </option>
                  ))}
                </select>
                {errors.pathao_zoneId && (
                  <p className="text-xs text-red-500 mt-1">{errors.pathao_zoneId}</p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="pathao_deliveryType" className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Type
                </label>
                <select
                  id="pathao_deliveryType"
                  value={formData.pathao_deliveryType}
                  onChange={(e) => handleChange("pathao_deliveryType", e.target.value)}
                  className={`w-full px-3 py-2 border ${errors.pathao_deliveryType ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="">Select delivery type</option>
                  <option value="48">Normal (48hrs)</option>
                  <option value="12">Express (12hrs)</option>
                </select>
                {errors.pathao_deliveryType && (
                  <p className="text-xs text-red-500 mt-1">{errors.pathao_deliveryType}</p>
                )}
              </div>

              <div>
                <label htmlFor="pathao_itemWeight" className="block text-sm font-medium text-gray-700 mb-1">
                  Item Weight (kg)
                </label>
                <input
                  id="pathao_itemWeight"
                  type="number"
                  step="0.1"
                  value={formData.pathao_itemWeight}
                  onChange={(e) => handleChange("pathao_itemWeight", e.target.value)}
                  placeholder="0.5"
                  className={`w-full px-3 py-2 border ${errors.pathao_itemWeight ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors.pathao_itemWeight && (
                  <p className="text-xs text-red-500 mt-1">{errors.pathao_itemWeight}</p>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Booking...
              </span>
            ) : (
              "Book Shipment"
            )}
          </button>

          {result && (
            <div className={`mt-4 p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start">
                {result.success ? (
                  <svg className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                <div className="text-sm">
                  <p className={result.success ? 'text-green-800' : 'text-red-800'}>
                    {result.message}
                  </p>
                  {result.data && (
                    <div className="mt-2">
                      <span className="font-medium">Tracking ID:</span>
                      <span className="ml-2 bg-white px-2 py-1 rounded border border-gray-300 text-xs font-mono">
                        {result.data.trackingId}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}