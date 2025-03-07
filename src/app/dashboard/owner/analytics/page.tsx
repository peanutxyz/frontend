// app/dashboard/owner/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Download, DollarSign, Users, CreditCard, TrendingUp } from "lucide-react";
import { analyticsApi } from "@/lib/api";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell
} from "recharts";

// Define interfaces for owner analytics data
interface DailyFinancial {
  _id: string;
  revenue: number;
  transactions: number;
}

interface MonthlyFinancial {
  revenue: number;
  transactions: number;
}

interface LoanStats {
  _id: string;
  totalAmount: number;
  count: number;
}

interface OwnerAnalyticsData {
  financial: {
    monthly: MonthlyFinancial;
    daily: DailyFinancial[];
  };
  loans: LoanStats[];
}

// Date range interface
interface DateRange {
  start: Date;
  end: Date;
}

export default function OwnerAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<OwnerAnalyticsData | null>(null);
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
        const data = await analyticsApi.getOwnerAnalytics();
        setAnalytics(data);
        console.log("Owner analytics data:", data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
        console.error('Owner analytics fetch error:', err);
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
  
  // Calculate growth percentages
  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Process data for charts
  const prepareDailyRevenueData = () => {
    if (!analytics?.financial?.daily) return [];
    
    return analytics.financial.daily.map(day => ({
      date: new Date(day._id).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      revenue: day.revenue,
      transactions: day.transactions
    }));
  };
  
  const prepareLoanStatusData = () => {
    if (!analytics?.loans) return [];
    
    // Using the same colors as in admin dashboard for consistency
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];
    
    // Create an array with standardized statuses for consistent display
    const statuses = [
      {
        id: 'approved',
        name: 'Approved',
        color: COLORS[0]
      },
      {
        id: 'paid',
        name: 'Paid',
        color: COLORS[1]
      },
      {
        id: 'rejected',
        name: 'Cancelled',
        color: COLORS[2]
      }
    ];
    
    // Map the loan data to match these statuses
    return statuses.map(status => {
      const matchingLoan = analytics.loans.find(loan => loan._id === status.id);
      return {
        name: status.name,
        value: matchingLoan?.count || 0,
        amount: matchingLoan?.totalAmount || 0,
        color: status.color,
        percentage: matchingLoan ? calculatePercentage(matchingLoan.count) : 0
      };
    });
  };
  
  // Calculate percentage of a loan status
  const calculatePercentage = (count: number): number => {
    if (!analytics?.loans) return 0;
    const totalLoans = analytics.loans.reduce((sum, loan) => sum + loan.count, 0);
    if (totalLoans === 0) return 0;
    return Math.round((count / totalLoans) * 100);
  };

  // Calculate averages and totals
  const calculateAverageTransactionValue = (): number => {
    const monthly = analytics?.financial?.monthly;
    if (!monthly || monthly.transactions === 0) return 0;
    return monthly.revenue / monthly.transactions;
  };

  const calculateTotalActiveLoanAmount = (): number => {
    if (!analytics?.loans) return 0;
    return analytics.loans
      .filter(loan => loan._id === 'approved' || loan._id === 'pending')
      .reduce((sum, loan) => sum + (loan.totalAmount || 0), 0);
  };

  const calculateTotalActiveLoans = (): number => {
    if (!analytics?.loans) return 0;
    return analytics.loans
      .filter(loan => loan._id === 'approved' || loan._id === 'pending')
      .reduce((sum, loan) => sum + (loan.count || 0), 0);
  };

  // Get total transactions for display
  const getTotalTransactions = (): number => {
    return analytics?.financial?.monthly?.transactions || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Financial Overview</h1>
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
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards - Matched style to admin dashboard */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2">
                  <h3 className="text-2xl font-bold">
                    {formatCurrency(analytics?.financial?.monthly?.revenue)}
                  </h3>
                  <div className="flex items-center mt-1">
                    <p className="text-xs text-muted-foreground">
                      from {getTotalTransactions()} transactions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Monthly Transactions</p>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2">
                  <h3 className="text-2xl font-bold">
                    {getTotalTransactions()}
                  </h3>
                  <div className="flex items-center mt-1">
                    <p className="text-xs text-muted-foreground">
                      completed this month
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
                    {calculateTotalActiveLoans()}
                  </h3>
                  <div className="flex items-center mt-1">
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(calculateTotalActiveLoanAmount())} total value
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
                    {formatCurrency(calculateAverageTransactionValue())}
                  </h3>
                  <div className="flex items-center mt-1">
                    <p className="text-xs text-muted-foreground">
                      per transaction
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts - Using same style as admin dashboard */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily transaction totals for the current period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={prepareDailyRevenueData()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                        formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Revenue']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#4f46e5" 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
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
                        label={({ name, percentage }) => percentage > 0 ? `${name}: ${percentage}%` : ''}
                      >
                        {prepareLoanStatusData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string, entry: any) => [
                          value > 0 ? `${value} loans (${formatCurrency(entry.payload.amount)})` : 'No loans', 
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
              <CardDescription>Daily transaction trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={prepareDailyRevenueData()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenueTrend" x1="0" y1="0" x2="0" y2="1">
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
                      formatter={(value: number, name: string) => {
                        return [
                          name === 'revenue' 
                            ? `₱${value.toLocaleString()}` 
                            : value,
                          name === 'revenue' ? 'Revenue' : 'Transactions'
                        ];
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#4f46e5" 
                      fillOpacity={1} 
                      fill="url(#colorRevenueTrend)" 
                      name="revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="transactions"
                      stroke="#22c55e"
                      strokeWidth={2}
                      name="transactions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Transaction Summary</CardTitle>
              <CardDescription>Monthly transaction statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(analytics?.financial?.monthly?.revenue)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground">Transaction Count</h3>
                  <p className="text-2xl font-bold mt-1">{getTotalTransactions()}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground">Average Value</h3>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(calculateAverageTransactionValue())}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Loan Overview</CardTitle>
              <CardDescription>Status of all loans in the system</CardDescription>
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
                        {formatCurrency(calculateTotalActiveLoanAmount())}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Loan Performance</CardTitle>
              <CardDescription>Active vs. completed loans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={[
                      {
                        name: 'Active',
                        value: calculateTotalActiveLoans(),
                        amount: calculateTotalActiveLoanAmount()
                      },
                      {
                        name: 'Paid',
                        value: analytics?.loans?.find(l => l._id === 'paid')?.count || 0,
                        amount: analytics?.loans?.find(l => l._id === 'paid')?.totalAmount || 0
                      },
                      {
                        name: 'Cancelled',
                        value: analytics?.loans?.find(l => l._id === 'rejected')?.count || 0,
                        amount: analytics?.loans?.find(l => l._id === 'rejected')?.totalAmount || 0
                      }
                    ]}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
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
                    <Tooltip 
                      formatter={(value, name, props) => {
                        return name === 'Amount' 
                          ? [formatCurrency(value as number), name] 
                          : [value, name];
                      }}
                    />
                    <Legend />
                    <Bar 
                      yAxisId="left" 
                      dataKey="amount" 
                      fill="#4f46e5" 
                      name="Amount" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      yAxisId="right" 
                      dataKey="value" 
                      fill="#22c55e" 
                      name="Count" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}