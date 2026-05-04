// components/admin/AnalyticsChart.tsx
'use client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function AnalyticsChart({ data, type = 'revenue' }) {
  if (!data || data.length === 0) {
    return <div className="text-center py-12 text-gray-500">No data available</div>;
  }
  
  const formatCurrency = (value: number) => {
    return `৳${value.toLocaleString()}`;
  };
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      {type === 'revenue' ? (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="_id" />
          <YAxis tickFormatter={formatCurrency} />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
          <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} />
        </LineChart>
      ) : (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="_id" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#3B82F6" />
          <Bar dataKey="totalRevenue" fill="#10B981" />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}