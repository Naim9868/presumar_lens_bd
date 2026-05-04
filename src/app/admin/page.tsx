'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Download,
  Filter,
  Calendar
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Mock data - replace with actual API calls
const salesData = [
  { name: 'Jan', sales: 4000, revenue: 24000 },
  { name: 'Feb', sales: 3000, revenue: 18000 },
  { name: 'Mar', sales: 5000, revenue: 30000 },
  { name: 'Apr', sales: 4500, revenue: 27000 },
  { name: 'May', sales: 6000, revenue: 36000 },
  { name: 'Jun', sales: 5500, revenue: 33000 },
  { name: 'Jul', sales: 7000, revenue: 42000 },
];

const categoryData = [
  { name: 'Prime Lenses', value: 35, color: '#f59e0b' },
  { name: 'Zoom Lenses', value: 40, color: '#3b82f6' },
  { name: 'Macro Lenses', value: 15, color: '#10b981' },
  { name: 'Wide Angle', value: 10, color: '#8b5cf6' },
];

const recentOrders = [
  { id: 'ORD-001', customer: 'John Doe', amount: 1299, status: 'delivered', date: '2024-01-15' },
  { id: 'ORD-002', customer: 'Jane Smith', amount: 899, status: 'shipped', date: '2024-01-14' },
  { id: 'ORD-003', customer: 'Mike Johnson', amount: 2499, status: 'pending', date: '2024-01-14' },
  { id: 'ORD-004', customer: 'Sarah Wilson', amount: 499, status: 'paid', date: '2024-01-13' },
  { id: 'ORD-005', customer: 'David Brown', amount: 1599, status: 'delivered', date: '2024-01-12' },
];

const topProducts = [
  { name: 'Canon 50mm f/1.8', sales: 145, revenue: 181250 },
  { name: 'Sony 24-70mm f/2.8', sales: 89, revenue: 222500 },
  { name: 'Nikon 35mm f/1.8', sales: 76, revenue: 95000 },
  { name: 'Fujifilm 23mm f/2', sales: 54, revenue: 54000 },
];

const statsCards = [
  {
    title: 'Total Revenue',
    value: '$124,567',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'bg-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-600 dark:text-green-400'
  },
  {
    title: 'Total Orders',
    value: '1,234',
    change: '+8.2%',
    trend: 'up',
    icon: ShoppingCart,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-600 dark:text-blue-400'
  },
  {
    title: 'Total Products',
    value: '456',
    change: '-2.4%',
    trend: 'down',
    icon: Package,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    textColor: 'text-purple-600 dark:text-purple-400'
  },
  {
    title: 'Total Customers',
    value: '3,456',
    change: '+15.3%',
    trend: 'up',
    icon: Users,
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    textColor: 'text-amber-600 dark:text-amber-400'
  },
];

const getStatusBadge = (status: string) => {
  const badges = {
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    shipped: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    paid: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  };
  return badges[status as keyof typeof badges] || badges.pending;
};

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? ArrowUpRight : ArrowDownRight;
          const trendColor = stat.trend === 'up' ? 'text-green-600' : 'text-red-600';
          
          return (
            <div
              key={index}
              className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                <span className={`ml-1 text-sm font-medium ${trendColor}`}>
                  {stat.change}
                </span>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  vs last month
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales Chart */}
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sales Overview
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Weekly sales and revenue trends
              </p>
            </div>
            <select className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm">
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#f59e0b" 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Category Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-lg bg-white dark:bg-gray-800 shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Orders
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Latest customer orders
                </p>
              </div>
              <button className="text-sm text-amber-600 hover:text-amber-700">
                View All
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {order.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ${order.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-lg bg-white dark:bg-gray-800 shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Top Products
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Best selling products this month
                </p>
              </div>
              <button className="text-sm text-amber-600 hover:text-amber-700">
                View All
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ${product.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${(product.sales / topProducts[0].sales) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {product.sales} units
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Quick Actions
            </h3>
            <p className="text-amber-100 mt-1">
              Perform common tasks quickly
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-white text-amber-600 rounded-lg hover:bg-amber-50 transition-colors">
              Add New Product
            </button>
            <button className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors">
              View Orders
            </button>
            <button className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors">
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}