// src/components/admin/CustomerStats.tsx
'use client';

import { Users, UserCheck, UserX, DollarSign, TrendingUp } from 'lucide-react';

interface CustomerStatsProps {
  stats: {
    totalCustomers: number;
    returningCustomers: number;
    guestCustomers: number;
    avgOrderValue: number;
    customerLifetimeValue: number;
  };
}

export default function CustomerStats({ stats }: CustomerStatsProps) {
  const statCards = [
    {
      label: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Returning Customers',
      value: stats.returningCustomers.toLocaleString(),
      icon: UserCheck,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: 'Guest Customers',
      value: stats.guestCustomers.toLocaleString(),
      icon: UserX,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      label: 'Avg Order Value',
      value: `$${stats.avgOrderValue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
    {
      label: 'Customer Lifetime Value',
      value: `$${stats.customerLifetimeValue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                <Icon className={`w-5 h-5 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}