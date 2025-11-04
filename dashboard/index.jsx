import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Calendar, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RevenueAnalytics() {
  const [timeRange, setTimeRange] = useState("monthly");
  
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list(),
    initialData: [],
  });

  // Process data by time range
  const processData = () => {
    if (timeRange === "monthly") {
      const monthlyData = orders.reduce((acc, order) => {
        const month = order.month || new Date(order.order_date).toISOString().slice(0, 7);
        if (!acc[month]) {
          acc[month] = { period: month, revenue: 0, orders: 0, avgOrder: 0 };
        }
        acc[month].revenue += order.total_amount || 0;
        acc[month].orders += 1;
        return acc;
      }, {});
      
      return Object.values(monthlyData)
        .map(d => ({ ...d, avgOrder: d.revenue / d.orders }))
        .sort((a, b) => a.period.localeCompare(b.period));
    } else {
      const quarterlyData = orders.reduce((acc, order) => {
        const quarter = order.quarter || `Q${Math.ceil((new Date(order.order_date).getMonth() + 1) / 3)} ${new Date(order.order_date).getFullYear()}`;
        if (!acc[quarter]) {
          acc[quarter] = { period: quarter, revenue: 0, orders: 0, avgOrder: 0 };
        }
        acc[quarter].revenue += order.total_amount || 0;
        acc[quarter].orders += 1;
        return acc;
      }, {});
      
      return Object.values(quarterlyData)
        .map(d => ({ ...d, avgOrder: d.revenue / d.orders }))
        .sort((a, b) => a.period.localeCompare(b.period));
    }
  };

  const chartData = processData();

  // Calculate growth metrics
  const currentPeriod = chartData[chartData.length - 1];
  const previousPeriod = chartData[chartData.length - 2];
  const growthRate = previousPeriod 
    ? ((currentPeriod?.revenue - previousPeriod.revenue) / previousPeriod.revenue * 100).toFixed(1)
    : 0;

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Revenue Analytics</h1>
            <p className="text-gray-600">Track revenue trends and growth patterns</p>
          </div>
          <Tabs value={timeRange} onValueChange={setTimeRange}>
            <TabsList>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-600">Current Period Revenue</p>
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">
                ${currentPeriod?.revenue.toLocaleString() || 0}
              </h3>
              <p className="text-sm text-gray-500 mt-2">{currentPeriod?.period}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-green-600">
                {growthRate > 0 ? '+' : ''}{growthRate}%
              </h3>
              <p className="text-sm text-gray-500 mt-2">Period over period</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">
                ${currentPeriod?.avgOrder.toFixed(2) || 0}
              </h3>
              <p className="text-sm text-gray-500 mt-2">Current period</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Revenue Trend Analysis</CardTitle>
            <p className="text-sm text-gray-500">Revenue progression over time</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="period" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value) => `$${value.toLocaleString()}`}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fill="url(#colorRevenue2)" 
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders and AOV Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Orders & Average Order Value</CardTitle>
            <p className="text-sm text-gray-500">Order volume and average transaction size</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="period" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="orders" fill="#8b5cf6" name="Orders" radius={[8, 8, 0, 0]} />
                <Bar dataKey="avgOrder" fill="#10b981" name="Avg Order Value ($)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}