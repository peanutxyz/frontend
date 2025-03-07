// src/app/dashboard/supplier/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi } from "@/lib/api";
import { useAuth, useHydratedAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { BadgeCheck, CreditCard, RefreshCw, Calculator, TrendingUp, CircleDollarSign, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, creditScoreUtils } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Updated interface with transaction count and averageTransaction
interface SupplierStats {
  overview: {
    totalEarnings: number;
    activeLoans: number;
    productsCount: number;
    pendingTransactions: number;
  };
  creditInfo: {
    score: number;
    status: string;
    lastUpdated: string;
    loanLimit: number;
    transactionCount?: number;
    averageTransaction?: number;
  };
  transactions?: { // Optional
    recent: Array<{
      reference: string;
      date: string;
      product: string;
      amount: number;
    }>;
  };
  supplierInfo?: {
    id: string;
    name: string;
  };
}

export default function SupplierDashboardPage() {
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { auth, isHydrated } = useHydratedAuth();
  const user = auth?.user;
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isVisible, setIsVisible] = useState(false);

  // Animation effect on load
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (isHydrated && !auth.token) {
      window.location.href = '/auth/login';
    }
  }, [isHydrated, auth]);

  // Function to fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      
      // Debug logs
      const token = localStorage.getItem('token');
      console.log('Auth token:', token ? 'Present' : 'Missing');
      console.log('Current user:', user);
      
      const response = await dashboardApi.getSupplierStats();
      console.log('API Response received:', response);
      
      // Create default data with correct structure
      const defaultData: SupplierStats = {
        overview: {
          totalEarnings: 0,
          activeLoans: 0,
          productsCount: 0,
          pendingTransactions: 0
        },
        creditInfo: {
          score: 0,
          status: 'No Score',
          lastUpdated: new Date().toISOString(),
          loanLimit: 0,
          transactionCount: 0,
          averageTransaction: 0
        },
        transactions: {
          recent: []
        }
      };
      
      // Merge response data with default data
      const data = response?.data;
      
      // Safely merge transactions ensuring defaultData.transactions exists
      const transactions = {
        recent: data?.transactions?.recent || defaultData.transactions?.recent || []
      };
      
      // Set stats with complete data structure
      setStats({
        overview: { ...defaultData.overview, ...(data?.overview || {}) },
        creditInfo: { ...defaultData.creditInfo, ...(data?.creditInfo || {}) },
        transactions: transactions,
        supplierInfo: data?.supplierInfo
      });
      
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard data');
      
      // Only set default data on initial load error, not on refresh errors
      if (isLoading) {
        setStats({
          overview: {
            totalEarnings: 0,
            activeLoans: 0,
            productsCount: 0,
            pendingTransactions: 0
          },
          creditInfo: {
            score: 0,
            status: 'No Score',
            lastUpdated: new Date().toISOString(),
            loanLimit: 0,
            transactionCount: 0
          },
          transactions: {
            recent: []
          }
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (isHydrated && user) {
      console.log('Fetching supplier stats...');
      fetchDashboardData();
    } else if (isHydrated) {
      // Set loading to false if hydrated but no user
      setIsLoading(false);
    }
  }, [isHydrated, user]);

  // Set up polling for real-time updates - refresh every 30 seconds
  useEffect(() => {
    // Only set up polling if user is authenticated
    if (!isHydrated || !user) return;
    
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing dashboard data...');
      fetchDashboardData();
    }, 30000); // 30 seconds
    
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [isHydrated, user]);

  // Handle manual refresh
  const handleRefresh = () => {
    if (isRefreshing) return;
    fetchDashboardData();
  };

  // Use the standardized creditScoreUtils functions
  const getCreditScoreColor = (score: number) => {
    const category = creditScoreUtils.getScoreCategory(score);
    return creditScoreUtils.getCategoryColor(category);
  };

  const getCreditScoreCategory = (score: number) => {
    return creditScoreUtils.getScoreCategory(score);
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, variant = "default", delay = 0 }: any) => (
    <Card 
      className={`hover:shadow-lg transition-all duration-300 overflow-hidden ${
        variant === "warning" ? "border-amber-400" : 
        variant === "success" ? "border-emerald-400" : 
        variant === "info" ? "border-blue-400" : ""
      } transform transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-full ${
            variant === "warning" ? "bg-amber-100" : 
            variant === "success" ? "bg-emerald-100" : 
            variant === "info" ? "bg-blue-100" :
            "bg-amber-100"
          }`}>
            <Icon className={`h-6 w-6 ${
              variant === "warning" ? "text-amber-600" : 
              variant === "success" ? "text-emerald-600" : 
              variant === "info" ? "text-blue-600" :
              "text-amber-600"
            }`} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-800"></div>
        <span className="ml-2 text-amber-800">Initializing...</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-800"></div>
        <span className="ml-2 text-amber-800">Loading dashboard...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg">Authentication required</p>
          <button
            className="mt-4 px-4 py-2 bg-amber-800 text-white rounded hover:bg-amber-900 transition-colors"
            onClick={() => window.location.href = '/auth/login'}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const score = stats?.creditInfo?.score || 0;
  const scoreCategory = getCreditScoreCategory(score);
  const scoreColor = getCreditScoreColor(score);
  const transactionCount = stats?.creditInfo?.transactionCount || 0;
  const isEligible = creditScoreUtils.isEligibleForLoan(score, transactionCount);
  const loanLimit = stats?.creditInfo?.loanLimit || 0;
  const averageTransaction = stats?.creditInfo?.averageTransaction || 0;

  return (
    <div className="space-y-8 p-6">
      {/* Header Section */}
      <div 
        className={`flex items-center justify-between transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <span className="text-amber-800 font-bold">{user.name?.charAt(0) || 'S'}</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Supplier's Portal</h1>
            <p className="text-muted-foreground">Welcome, {user?.name || 'Partner'}</p>
          </div>
        </div>
        
        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 border-amber-200 hover:bg-amber-50 transition-all duration-300"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''} text-amber-800`} />
          Refresh
        </Button>
      </div>

      {/* Last refreshed info */}
      <div 
        className={`text-xs text-muted-foreground text-right -mt-6 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        style={{ transitionDelay: `50ms` }}
      >
        Last updated: {lastRefreshed.toLocaleTimeString()}
      </div>

      {/* Credit Score Card - Main focus */}
      <Card 
        className={`bg-gradient-to-br from-amber-50 to-amber-100/50 hover:shadow-lg transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        style={{ transitionDelay: `100ms` }}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Credit Assessment</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-4xl font-bold ${scoreColor}`}>
                  {score}
                </span>
                <BadgeCheck className={`h-6 w-6 ${scoreColor}`} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Rating: {scoreCategory}
              </p>
              {!isEligible && (
                <p className="text-xs text-amber-700 mt-1 bg-amber-50 py-1 px-2 rounded-md inline-block">
                  Complete transactions to qualify for financing
                </p>
              )}
            </div>
            <div className="text-right">
  <p className="text-sm font-medium">Available Credit</p>
  <p className="text-2xl font-bold text-amber-800">
    {isEligible
      ? formatCurrency(Math.round(loanLimit))
      : "₱0"}
  </p>
  <p className="text-xs text-muted-foreground">
    Last assessed: {stats?.creditInfo?.lastUpdated ?
      new Date(stats.creditInfo.lastUpdated).toLocaleDateString() :
      'N/A'}
  </p>
  {transactionCount > 0 && (
    <p className="text-xs text-muted-foreground mt-1">
      Based on {transactionCount} transaction{transactionCount > 1 ? 's' : ''}
    </p>
  )}
</div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced stats section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Loan"
          value={stats?.overview?.activeLoans || 0}
          subtitle="Active capital allocations"
          icon={CreditCard}
          variant="info"
          delay={150}
        />
        
        <StatCard
  title="Average Transaction"
  value={formatCurrency(averageTransaction)}
  subtitle="Typical delivery value"
  icon={Calculator}
  variant="success"
  delay={200}
/>
        
        <StatCard
          title="Transaction History"
          value={transactionCount}
          subtitle="Completed deliveries"
          icon={TrendingUp}
          delay={250}
        />

      </div>
    </div>
  );
}