// app/admin/shipping/delivery_zones/components/DeliveryZonesManager.tsx
"use client";

import { useState } from "react";

// This would normally come from your API
const mockZones = [
  { id: 1, name: "Dhaka North", city: "Dhaka", charge: 60, estimatedDays: "1-2", isActive: true },
  { id: 2, name: "Dhaka South", city: "Dhaka", charge: 60, estimatedDays: "1-2", isActive: true },
  { id: 3, name: "Chattogram City", city: "Chattogram", charge: 80, estimatedDays: "2-3", isActive: true },
  { id: 4, name: "Sylhet City", city: "Sylhet", charge: 100, estimatedDays: "3-4", isActive: false },
];

export function DeliveryZonesManager() {
  const [zones, setZones] = useState(mockZones);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<any>(null);

  const handleSave = (data: any) => {
    if (editingZone) {
      setZones(zones.map(z => z.id === editingZone.id ? { ...z, ...data } : z));
    } else {
      setZones([...zones, { ...data, id: Date.now() }]);
    }
    setIsDialogOpen(false);
    setEditingZone(null);
  };

  const handleDelete = (id: number) => {
    setZones(zones.filter(z => z.id !== id));
  };

  const toggleActive = (id: number) => {
    setZones(zones.map(z => z.id === id ? { ...z, isActive: !z.isActive } : z));
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Main Card */}
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "8px", 
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)", 
        marginBottom: "24px" 
      }}>
        {/* Card Header */}
        <div style={{ 
          padding: "20px 24px", 
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h2 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>Delivery Zones</h2>
          <button
            onClick={() => {
              setEditingZone(null);
              setIsDialogOpen(true);
            }}
            style={{
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span style={{ fontSize: "16px" }}>+</span>
            Add Zone
          </button>
        </div>

        {/* Card Content */}
        <div style={{ padding: "20px 24px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ textAlign: "left", padding: "12px 8px", fontSize: "14px", fontWeight: "500", color: "#6b7280" }}>Zone Name</th>
                <th style={{ textAlign: "left", padding: "12px 8px", fontSize: "14px", fontWeight: "500", color: "#6b7280" }}>City</th>
                <th style={{ textAlign: "left", padding: "12px 8px", fontSize: "14px", fontWeight: "500", color: "#6b7280" }}>Delivery Charge</th>
                <th style={{ textAlign: "left", padding: "12px 8px", fontSize: "14px", fontWeight: "500", color: "#6b7280" }}>Estimated Days</th>
                <th style={{ textAlign: "left", padding: "12px 8px", fontSize: "14px", fontWeight: "500", color: "#6b7280" }}>Status</th>
                <th style={{ textAlign: "right", padding: "12px 8px", fontSize: "14px", fontWeight: "500", color: "#6b7280" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "12px 8px", fontWeight: "500" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "#6b7280" }}>📍</span>
                      {zone.name}
                    </div>
                  </td>
                  <td style={{ padding: "12px 8px" }}>{zone.city}</td>
                  <td style={{ padding: "12px 8px" }}>৳{zone.charge}</td>
                  <td style={{ padding: "12px 8px" }}>{zone.estimatedDays}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <label style={{ position: "relative", display: "inline-block", width: "40px", height: "20px" }}>
                        <input
                          type="checkbox"
                          checked={zone.isActive}
                          onChange={() => toggleActive(zone.id)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: "absolute",
                          cursor: "pointer",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: zone.isActive ? "#3b82f6" : "#d1d5db",
                          transition: "0.3s",
                          borderRadius: "20px"
                        }}>
                          <span style={{
                            position: "absolute",
                            content: "",
                            height: "16px",
                            width: "16px",
                            left: zone.isActive ? "22px" : "2px",
                            bottom: "2px",
                            backgroundColor: "white",
                            transition: "0.3s",
                            borderRadius: "50%"
                          }} />
                        </span>
                      </label>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        backgroundColor: zone.isActive ? "#dbeafe" : "#f3f4f6",
                        color: zone.isActive ? "#1e40af" : "#6b7280"
                      }}>
                        {zone.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "right" }}>
                    <button
                      onClick={() => {
                        setEditingZone(zone);
                        setIsDialogOpen(true);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        padding: "4px 8px",
                        cursor: "pointer",
                        color: "#6b7280",
                        marginRight: "4px"
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(zone.id)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: "4px 8px",
                        cursor: "pointer",
                        color: "#dc2626"
                      }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Card */}
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "8px", 
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)" 
      }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "500", margin: 0, color: "#6b7280" }}>Zone Coverage Summary</h3>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
            gap: "16px" 
          }}>
            <div>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 4px 0" }}>Total Zones</p>
              <p style={{ fontSize: "24px", fontWeight: "700", margin: 0 }}>{zones.length}</p>
            </div>
            <div>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 4px 0" }}>Active Zones</p>
              <p style={{ fontSize: "24px", fontWeight: "700", margin: 0, color: "#16a34a" }}>
                {zones.filter(z => z.isActive).length}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 4px 0" }}>Cities Covered</p>
              <p style={{ fontSize: "24px", fontWeight: "700", margin: 0 }}>
                {new Set(zones.map(z => z.city)).size}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 4px 0" }}>Avg Delivery Charge</p>
              <p style={{ fontSize: "24px", fontWeight: "700", margin: 0 }}>
                ৳{Math.round(zones.reduce((sum, z) => sum + z.charge, 0) / zones.length)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog/Modal */}
      {isDialogOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "24px",
            width: "100%",
            maxWidth: "500px",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", margin: "0 0 20px 0" }}>
              {editingZone ? "Edit Delivery Zone" : "Add Delivery Zone"}
            </h2>
            <ZoneForm 
              zone={editingZone} 
              onSave={handleSave} 
              onCancel={() => setIsDialogOpen(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ZoneForm({ zone, onSave, onCancel }: any) {
  const [formData, setFormData] = useState(
    zone || {
      name: "",
      city: "",
      charge: "",
      estimatedDays: "",
      isActive: true,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      charge: parseFloat(formData.charge),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "16px" }}>
        <label htmlFor="name" style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "4px" }}>
          Zone Name
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Dhaka North"
          required
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "14px"
          }}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label htmlFor="city" style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "4px" }}>
          City
        </label>
        <input
          id="city"
          type="text"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          placeholder="e.g., Dhaka"
          required
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "14px"
          }}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label htmlFor="charge" style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "4px" }}>
          Delivery Charge (৳)
        </label>
        <input
          id="charge"
          type="number"
          value={formData.charge}
          onChange={(e) => setFormData({ ...formData, charge: e.target.value })}
          placeholder="e.g., 60"
          required
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "14px"
          }}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label htmlFor="estimatedDays" style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "4px" }}>
          Estimated Delivery Days
        </label>
        <input
          id="estimatedDays"
          type="text"
          value={formData.estimatedDays}
          onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
          placeholder="e.g., 1-2"
          required
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "14px"
          }}
        />
      </div>

      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
        <label style={{ position: "relative", display: "inline-block", width: "40px", height: "20px" }}>
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <span style={{
            position: "absolute",
            cursor: "pointer",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: formData.isActive ? "#3b82f6" : "#d1d5db",
            transition: "0.3s",
            borderRadius: "20px"
          }}>
            <span style={{
              position: "absolute",
              content: "",
              height: "16px",
              width: "16px",
              left: formData.isActive ? "22px" : "2px",
              bottom: "2px",
              backgroundColor: "white",
              transition: "0.3s",
              borderRadius: "50%"
            }} />
          </span>
        </label>
        <label style={{ fontSize: "14px", fontWeight: "500" }}>Active</label>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="submit"
          style={{
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          {zone ? "Update" : "Create"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            backgroundColor: "transparent",
            color: "#6b7280",
            border: "1px solid #d1d5db",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}