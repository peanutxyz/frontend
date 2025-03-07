// src/app/dashboard/owner/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { dashboardApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { CreditCard, AlertTriangle, CircleDollarSign, Sliders, ChartBar, Percent, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function OwnerDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rawLoanLimit, setRawLoanLimit] = useState<string>("");
  const [isUpdatingLimit, setIsUpdatingLimit] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animation trigger after initial load
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await dashboardApi.getOwnerStats();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleUpdateLoanLimit = async () => {
    try {
      if (!rawLoanLimit) return;
      
      setIsUpdatingLimit(true);
      // Convert the raw string to a number, removing any non-numeric characters
      const numericValue = parseInt(rawLoanLimit.replace(/[^\d]/g, ''));
      
      await dashboardApi.updateLoanLimit(numericValue);
      toast.success("Credit limit updated successfully");
      
      // Clear the input field
      setRawLoanLimit("");
      
      // Refresh data
      const response = await dashboardApi.getOwnerStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to update loan limit:', error);
      toast.error("Failed to update credit limit");
    } finally {
      setIsUpdatingLimit(false);
    }
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

  return (
    <div className="space-y-8 p-6">
      {/* Header Section */}
      <div 
        className={`transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      >
        <h1 className="text-3xl font-bold tracking-tight mb-1">Financial Operations</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Manage capital allocation and monitor portfolio performance
        </p>
      </div>

      {/* Stats Overview */}
      <div 
        className={`transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        style={{ transitionDelay: '100ms' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Portfolio Overview</h2>
          <span className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </span>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Debtor"
            value={stats?.loanStats?.activeLoans || 0}
            subtitle="Current portfolio size"
            icon={CreditCard}
            variant="info"
            delay={150}
          />
          <StatCard
            title="Total Loan"
            value={`₱${(stats?.loanStats?.totalLoanAmount || 0).toLocaleString()}`}
            subtitle="Total financing issued"
            icon={CircleDollarSign}
            variant="success"
            delay={200}
          />
          <StatCard
            title="Credit Threshold"
            value={`₱${(stats?.loanConfig?.defaultLoanLimit || 0).toLocaleString()}`}
            subtitle="Standard capital allocation"
            icon={Sliders}
            delay={250}
          />
          <StatCard
            title="Pending Approval"
            value={stats?.loanStats?.pendingLoans || 0}
            subtitle="Pending authorization"
            icon={AlertTriangle}
            variant="warning"
            delay={300}
          />
        </div>
      </div>

      {/* Credit Threshold Configuration */}
      <Card 
        className={`w-full transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        style={{ transitionDelay: '500ms' }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-amber-600" />
            Credit Threshold Management
          </CardTitle>
          <CardDescription>
            Configure default capital allocation limits for suppliers without custom credit assessments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                <Input
                  type="text"
                  className="pl-8 focus-visible:ring-amber-500"
                  value={rawLoanLimit}
                  onChange={(e) => {
                    // Only allow numeric input
                    const value = e.target.value.replace(/[^\d]/g, '');
                    setRawLoanLimit(value);
                  }}
                  placeholder="Enter threshold amount"
                  disabled={loading || isUpdatingLimit}
                />
              </div>
              <Button
                onClick={handleUpdateLoanLimit}
                disabled={isUpdatingLimit || loading || !rawLoanLimit}
                className="bg-amber-800 hover:bg-amber-900 transition-all duration-300"
              >
                {isUpdatingLimit ? "Processing..." : "Update Threshold"}
              </Button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     className="w-5 h-5 text-blue-600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </div>
              <div>
                <p className="font-medium text-blue-900">
                  Current Credit Allocation Threshold: <span className="text-blue-700 font-bold">
                    ₱{Number(stats?.loanConfig?.defaultLoanLimit || 0).toLocaleString()}
                  </span>
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  This threshold establishes the maximum financing allocation for suppliers without individual credit assessments.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}