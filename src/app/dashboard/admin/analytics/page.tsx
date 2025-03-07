// app/dashboard/admin/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Download, TrendingUp, Users, DollarSign, CreditCard, ArrowUpRight } from "lucide-react";
import { analyticsApi } from "@/lib/api";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell
} from "recharts";

// Define proper interfaces for our analytics data
interface Transaction {
  _id: string;
  totalAmount: number;
  count: number;
}

interface LoanStatus {
  _id: string;
  count: number;
  totalAmount: number;
}

interface TransactionStats {
  monthly: {
    totalAmount: number;
    count: number;
    averageAmount: number;
  };
  trend: Transaction[];
}

interface LoanStats {
  status: LoanStatus[];
  monthly: {
    totalAmount: number;
    count: number;
  };
}

interface SupplierStats {
  total: number;
  active: number;
}

interface CreditMetrics {
  distribution: {
    _id: string;
    count: number;
  }[];
}

interface AnalyticsData {
  transactions: TransactionStats;
  loans: LoanStats;
  suppliers: SupplierStats;
  creditMetrics?: CreditMetrics;
}

// Date range interface
interface DateRange {
  start: Date;
  end: Date;
}

export default function AdminAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date()
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await analyticsApi.getAdminAnalytics();
        setAnalytics(data);
        console.log("Analytics data:", data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    
    // Auto-refresh every 5 minutes
    const intervalId = setInterval(fetchAnalytics, 300000);
    return () => clearInterval(intervalId);
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">Error: {error}</span>
        </div>
        <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (value: number | undefined): string => {
    return `₱${parseFloat(`${value || 0}`).toLocaleString()}`;
  };
  
  // Prepare data for charts from API response
  const prepareTransactionTrendData = () => {
    if (!analytics?.transactions?.trend) return [];
    
    return analytics.transactions.trend.map(item => ({
      date: new Date(item._id).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      amount: item.totalAmount,
      count: item.count
    }));
  };
  
  const prepareLoanStatusData = () => {
    if (!analytics?.loans?.status) return [];
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
    
    return analytics.loans.status.map((item, index) => ({
      name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
      value: item.count,
      amount: item.totalAmount,
      color: COLORS[index % COLORS.length]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Business Analytics</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Last 30 Days</span>
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span>Download Report</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2">
                  <h3 className="text-2xl font-bold">
                    {formatCurrency(analytics?.transactions?.monthly?.totalAmount)}
                  </h3>
                  <div className="flex items-center mt-1">
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                    <p className="text-xs text-green-500">
                      +{analytics?.transactions?.monthly?.count || 0} transactions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Active Suppliers</p>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2">
                  <h3 className="text-2xl font-bold">
                    {analytics?.suppliers?.active || 0}
                  </h3>
                  <div className="flex items-center mt-1">
                    <p className="text-xs text-muted-foreground">
                      of {analytics?.suppliers?.total || 0} total suppliers
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Active Loans</p>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2">
                  <h3 className="text-2xl font-bold">
                    {analytics?.loans?.monthly?.count || 0}
                  </h3>
                  <div className="flex items-center mt-1">
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(analytics?.loans?.monthly?.totalAmount)} total value
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Average Transaction</p>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2">
                  <h3 className="text-2xl font-bold">
                    {formatCurrency(analytics?.transactions?.monthly?.averageAmount)}
                  </h3>
                  <div className="flex items-center mt-1">
                    <p className="text-xs text-muted-foreground">
                      per transaction this month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily transaction totals for the current period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={prepareTransactionTrendData()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `₱${value.toLocaleString('en-US', { notation: 'compact' })}`}
                      />
                      <Tooltip
                        formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Total']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#4f46e5" 
                        fillOpacity={1} 
                        fill="url(#colorAmount)" 
                        name="Revenue"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Loan Status Distribution</CardTitle>
                <CardDescription>Current loans by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepareLoanStatusData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {prepareLoanStatusData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string, entry: any) => [
                          `${value} loans (${formatCurrency(entry.payload.amount)})`, 
                          entry.payload.name
                        ]} 
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Analysis</CardTitle>
              <CardDescription>Detailed breakdown of transaction data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareTransactionTrendData()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      yAxisId="left"
                      orientation="left"
                      tickFormatter={(value) => `₱${value.toLocaleString('en-US', { notation: 'compact' })}`}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => value}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      yAxisId="left" 
                      dataKey="amount" 
                      fill="#4f46e5" 
                      name="Transaction Amount" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      yAxisId="right" 
                      dataKey="count" 
                      fill="#22c55e" 
                      name="Transaction Count" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Loan Performance</CardTitle>
              <CardDescription>Status and distribution of all loans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepareLoanStatusData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="amount"
                        nameKey="name"
                      >
                        {prepareLoanStatusData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Loan Summary</h3>
                  <div className="space-y-2">
                    {prepareLoanStatusData().map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border-b">
                        <div className="flex items-center">
                          <div className="w-3 h-3 mr-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span>{item.name}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-medium">{formatCurrency(item.amount)}</span>
                          <span className="text-xs text-muted-foreground">{item.value} loans</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4">
                    <div className="flex justify-between">
                      <span className="font-medium">Total Outstanding:</span>
                      <span className="font-bold">
                        {analytics?.loans?.status
                          ? formatCurrency(
                              analytics.loans.status
                                .filter(s => s._id !== 'paid' && s._id !== 'rejected')
                                .reduce((sum, item) => sum + (item.totalAmount || 0), 0)
                            )
                          : formatCurrency(0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Analytics</CardTitle>
              <CardDescription>Supplier performance and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium mb-4">Supplier Status</h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Active', value: analytics?.suppliers?.active || 0, color: '#22c55e' },
                            { 
                              name: 'Inactive', 
                              value: (analytics?.suppliers?.total || 0) - (analytics?.suppliers?.active || 0), 
                              color: '#6b7280' 
                            }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                        >
                          <Cell fill="#22c55e" />
                          <Cell fill="#6b7280" />
                        </Pie>
                        <Tooltip formatter={(value: number) => [value, 'Suppliers']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Credit Score Distribution</h3>
                  <div className="h-[200px]">
                    {analytics?.creditMetrics?.distribution ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analytics.creditMetrics.distribution}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="_id" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => [value, 'Suppliers']} />
                          <Bar dataKey="count" name="Suppliers">
                            {['Poor', 'Fair', 'Good', 'Excellent'].map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={
                                  index === 0 ? '#ef4444' : 
                                  index === 1 ? '#f59e0b' :
                                  index === 2 ? '#3b82f6' : '#22c55e'
                                } 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No credit score data available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>  
  );
}