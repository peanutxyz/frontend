"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, DollarSign, TrendingUp, CreditCard, Star } from "lucide-react";
import { analyticsApi, dashboardApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useHydratedAuth } from "@/lib/auth";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend, AreaChart, Area, PieChart,
  Pie, Cell
} from "recharts";

// Define interfaces for supplier analytics data
interface TransactionHistory {
  _id: string;
  totalAmount: number;
  count: number;
}

interface SupplierMonthly {
  totalAmount: number;
  count: number;
}

interface CreditScoreData {
  score: number;
  history: Array<{
    date: string;
    score: number;
  }>;
  remarks: string;
  eligible_amount: number;  // Added from backend
  transaction_count: number;  // Added from backend
  average_transaction: number;  // Added from backend
  credit_percentage: number;  // Added from backend
}

interface LoanStatus {
  _id: string;
  totalAmount: number;
  count: number;
}

interface SupplierAnalyticsData {
  transactions: {
    monthly: SupplierMonthly;
    history: TransactionHistory[];
  };
  loans: LoanStatus[];
  creditScore: CreditScoreData;
}

interface DashboardCreditInfo {
  loanLimit: number;
}

export default function SupplierAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<SupplierAnalyticsData | null>(null);
  const [dashboardCredit, setDashboardCredit] = useState<DashboardCreditInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { auth } = useHydratedAuth();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching supplier analytics...");
      const data = await analyticsApi.getSupplierAnalytics();
      console.log("Supplier analytics data received:", {
        transactionHistoryCount: data?.transactions?.history?.length || 0,
        loansCount: data?.loans?.length || 0,
        hasMonthlyData: !!data?.transactions?.monthly,
        hasCreditScore: !!data?.creditScore,
        eligibleAmount: data?.creditScore?.eligible_amount || 0
      });
      
      // Also fetch dashboard data for correct loan limit
      try {
        const dashboardData = await dashboardApi.getSupplierStats();
        setDashboardCredit({
          loanLimit: dashboardData?.creditInfo?.loanLimit || 0
        });
      } catch (dashboardErr) {
        console.error('Error fetching dashboard credit info:', dashboardErr);
      }
      
      setAnalytics(data);
    } catch (err) {
      console.error('Supplier analytics fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Auto-refresh every 5 minutes
    const intervalId = setInterval(fetchAnalytics, 300000);
    return () => clearInterval(intervalId);
  }, []);

  const handleRefresh = () => {
    fetchAnalytics();
  };

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
        <Button onClick={handleRefresh} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">No analytics data available.</p>
          <Button onClick={handleRefresh} className="mt-4">
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      // For year-month format from MongoDB aggregation (YYYY-MM)
      if (dateString && dateString.length === 7) {
        const [year, month] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short'
        });
      }
      
      // For full date strings
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Date formatting error:', e, 'for date:', dateString);
      return dateString || 'Unknown';
    }
  };

  // Get credit score category and color
  const getScoreCategory = (score: number): string => {
    if (score <= 20) return "Poor";
    if (score <= 40) return "Fair";
    if (score <= 60) return "Good";
    if (score <= 80) return "Very Good";
    return "Excellent";
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case "Poor": return "#ef4444"; // red
      case "Fair": return "#f59e0b"; // amber
      case "Good": return "#3b82f6"; // blue
      case "Very Good": return "#8b5cf6"; // purple
      case "Excellent": return "#22c55e"; // green
      default: return "#6b7280"; // gray
    }
  };

  // Prepare data for charts
  const prepareTransactionHistoryData = () => {
    if (!analytics?.transactions?.history?.length) {
      console.log("No transaction history data available");
      return [];
    }
    
    return analytics.transactions.history.map(item => ({
      date: formatDate(item._id),
      amount: item.totalAmount || 0,
      count: item.count || 0
    }));
  };

  // Prepare loan status chart data
  const prepareLoanStatusData = () => {
    if (!analytics?.loans?.length) {
      console.log("No loan data available");
      return [];
    }
    
    // Using consistent colors with other dashboards
    const COLORS = ['#4f46e5', '#22c55e', '#f59e0b', '#ef4444'];
    
    // Map loan statuses with standardized names and colors
    const statusMap = {
      'approved': { name: 'Approved', color: COLORS[0] },
      'paid': { name: 'Paid', color: COLORS[1] },
      'rejected': { name: 'Cancelled', color: COLORS[2] },
      'pending': { name: 'Pending', color: COLORS[3] }
    };
    
    return analytics.loans.map((loan, index) => ({
      name: statusMap[loan._id as keyof typeof statusMap]?.name || loan._id,
      value: loan.count || 0,
      amount: loan.totalAmount || 0,
      color: statusMap[loan._id as keyof typeof statusMap]?.color || COLORS[index % COLORS.length]
    }));
  };

  // Calculate active loans
  const calculateActiveLoans = (): number => {
    if (!analytics?.loans?.length) return 0;
    
    return analytics.loans
      .filter(loan => loan._id === 'approved' || loan._id === 'pending')
      .reduce((sum, loan) => sum + (loan.count || 0), 0);
  };

  // Calculate active loan amount
  const calculateActiveLoanAmount = (): number => {
    if (!analytics?.loans?.length) return 0;
    
    return analytics.loans
      .filter(loan => loan._id === 'approved' || loan._id === 'pending')
      .reduce((sum, loan) => sum + (loan.totalAmount || 0), 0);
  };

  // Current credit score
  const currentCreditScore = analytics?.creditScore?.score || 0;
  const creditScoreCategory = getScoreCategory(currentCreditScore);
  const creditScoreColor = getCategoryColor(creditScoreCategory);
  
  // Use dashboard credit info if available, otherwise calculate from analytics
  const loanLimit = dashboardCredit?.loanLimit || Math.round(analytics?.creditScore?.eligible_amount || 0);

  const transactionHistoryData = prepareTransactionHistoryData();
  console.log("Transaction history data for charts:", transactionHistoryData.length, "items");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">My Performance</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Data</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Monthly Transactions</p>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2">
                  <h3 className="text-2xl font-bold">
                    {analytics.transactions.monthly?.count || 0}
                  </h3>
                  <div className="flex items-center mt-1">
                    <p className="text-xs text-muted-foreground">
                      transactions this month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
           
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Monthly Value</p>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2">
                  <h3 className="text-2xl font-bold">
                    {formatCurrency(analytics.transactions.monthly?.totalAmount)}
                  </h3>
                  <div className="flex items-center mt-1">
                    <p className="text-xs text-muted-foreground">
                      total transaction value
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
                    {calculateActiveLoans()}
                  </h3>
                  <div className="flex items-center mt-1">
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(calculateActiveLoanAmount())}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
           
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Credit Score</p>
                  <Star className="h-4 w-4 text-muted-foreground" style={{ color: creditScoreColor }} />
                </div>
                <div className="mt-2">
                  <h3 className="text-2xl font-bold" style={{ color: creditScoreColor }}>
                    {currentCreditScore}
                  </h3>
                  <div className="flex items-center mt-1">
                    <p className="text-xs text-muted-foreground">
                      {creditScoreCategory} rating
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rest of the component remains the same... */}
          {/* Transaction History Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Monthly transaction value and count</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionHistoryData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={transactionHistoryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2}/>
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
                            name === 'amount'
                              ? formatCurrency(value)
                              : value,
                            name === 'amount' ? 'Value' : 'Count'
                          ];
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#4f46e5"
                        fillOpacity={1}
                        fill="url(#colorAmount)"
                        name="amount"
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#22c55e"
                        strokeWidth={2}
                        name="count"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex justify-center items-center h-[300px] text-muted-foreground">
                  No transaction history available
                </div>
              )}
            </CardContent>
          </Card>
         
          {/* Loan Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Overview</CardTitle>
              <CardDescription>Current loan status</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.loans && analytics.loans.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="h-[250px]">
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
                          dataKey="value"
                          nameKey="name"
                        >
                          {prepareLoanStatusData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`${value} loans`, '']}
                        />
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
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No loan data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Analysis</CardTitle>
              <CardDescription>Monthly transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionHistoryData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={transactionHistoryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAmountHistory" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2}/>
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
                        formatter={(value) => [`₱${(value as number).toLocaleString()}`, 'Value']}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#4f46e5"
                        fillOpacity={1}
                        fill="url(#colorAmountHistory)"
                        name="Transaction Value"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex justify-center items-center h-[300px] text-muted-foreground">
                  No transaction history available
                </div>
              )}
            </CardContent>
          </Card>
         
          <Card>
            <CardHeader>
              <CardTitle>Transaction Statistics</CardTitle>
              <CardDescription>Monthly performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground">Total Value</h3>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(analytics.transactions.monthly?.totalAmount)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground">Transaction Count</h3>
                  <p className="text-2xl font-bold mt-1">{analytics.transactions.monthly?.count || 0}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground">Average Value</h3>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(
                      analytics.transactions.monthly?.count > 0
                        ? analytics.transactions.monthly.totalAmount / analytics.transactions.monthly.count
                        : 0
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loans" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Credit Score</CardTitle>
                <CardDescription>Your current credit rating and loan eligibility</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Credit Score Visualization */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative w-48 h-48">
                      {/* SVG code remains the same */}
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="transparent"
                          stroke="#e2e8f0"
                          strokeWidth="10"
                        />
                        {/* Score circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="transparent"
                          stroke={creditScoreColor}
                          strokeWidth="10"
                          strokeDasharray={`${(currentCreditScore / 100) * 283} 283`}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                        {/* Score text */}
                        <text
                          x="50"
                          y="45"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="16"
                          fontWeight="bold"
                        >
                          {currentCreditScore}
                        </text>
                        <text
                          x="50"
                          y="65"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="12"
                          fill={creditScoreColor}
                        >
                          {creditScoreCategory}
                        </text>
                      </svg>
                    </div>
                   
                    <div className="mt-4 text-center">
                      <h3 className="text-lg font-medium">Loan Limit</h3>
                      <p className="text-3xl font-bold mt-1">{formatCurrency(loanLimit)}</p>
                    </div>
                  </div>
               
                {/* Credit Score Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Credit Information</h3>
                 
                  <div className="space-y-2">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Credit Status</p>
                      <p className="text-xl font-bold mt-1" style={{ color: creditScoreColor }}>{creditScoreCategory}</p>
                    </div>
                   
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="text-xl font-bold mt-1">
                        {analytics.creditScore?.history && analytics.creditScore.history.length > 0
                          ? formatDate(analytics.creditScore.history[0].date)
                          : "Not Available"}
                      </p>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Based On</p>
                      <p className="text-xl font-bold mt-1">
                        {analytics.creditScore?.transaction_count || 0} transactions
                      </p>
                    </div>
                  </div>
                 
                  {analytics.creditScore?.remarks && (
                    <div className="bg-blue-50 text-blue-600 p-4 rounded-lg mt-4">
                      <h4 className="font-medium">Score Notes</h4>
                      <p className="mt-1 text-sm">{analytics.creditScore.remarks}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
         
          <Card>
            <CardHeader>
              <CardTitle>Loan Statistics</CardTitle>
              <CardDescription>Your loan history and current status</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.loans && analytics.loans.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {analytics.loans.map((loan, index) => (
                    <div key={index} className="bg-slate-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-muted-foreground capitalize">{loan._id} Loans</h3>
                      <p className="text-2xl font-bold mt-1">{loan.count}</p>
                      <p className="text-sm text-muted-foreground mt-1">{formatCurrency(loan.totalAmount)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No loan history available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}