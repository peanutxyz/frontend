// src/app/dashboard/admin/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { dashboardApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { Users, FileText, Wallet, Sliders, AlertTriangle, CircleDollarSign, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminDashboardPage() {
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
        const response = await dashboardApi.getAdminStats();
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
      toast.success("Loan limit updated successfully");
      
      // Clear the input field
      setRawLoanLimit("");
      
      // Refresh data
      const response = await dashboardApi.getAdminStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to update loan limit:', error);
      toast.error("Failed to update loan limit");
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
      <CardContent className="flex flex-row items-center p-6">
        <div className="flex flex-col flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-2">{value}</h3>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
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
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 p-6">
      {/* Header Section */}
      <div 
        className={`transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      >
        <h1 className="text-3xl font-bold tracking-tight mb-1">Executive Overview</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Comprehensive system analytics and operational management
        </p>
      </div>

      {/* Business Overview Section */}
      <div 
        className={`transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        style={{ transitionDelay: '100ms' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Business Metrics</h2>
          <span className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </span>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Suppliers"
            value={stats?.suppliers?.activeCount || 0}
            subtitle="Active suppliers in network"
            icon={Users}
            variant="success"
            delay={150}
          />
          <StatCard
            title="Transaction Volume"
            value={stats?.transactions?.count || 0}
            subtitle={`Total value: ₱${(stats?.transactions?.totalAmount || 0).toLocaleString()}`}
            icon={FileText}
            variant="info"
            delay={200}
          />
          <StatCard
            title="Average Transaction"
            value={`₱${stats?.transactions?.count ? 
              Math.round((stats?.transactions?.totalAmount || 0) / stats?.transactions?.count).toLocaleString() : 0}`}
            subtitle="Per transaction value"
            icon={TrendingUp}
            variant="success"
            delay={250}
          />
        </div>
      </div>

      {/* Loan Management Section */}
      <div 
        className={`transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        style={{ transitionDelay: '300ms' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Financial Portfolio</h2>
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs"
            disabled={loading}
          >
            <FileText className="h-3.5 w-3.5 mr-1" />
            Export Report
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Loans"
            value={stats?.loans?.activeLoans || 0}
            subtitle="Currently active loans"
            icon={Wallet}
            variant="info"
            delay={350}
          />
          <StatCard
            title="Portfolio Value"
            value={`₱${(stats?.loans?.totalLoanAmount || 0).toLocaleString()}`}
            subtitle="Total outstanding capital"
            icon={CircleDollarSign}
            delay={400}
          />
          <StatCard
            title="Credit Limit"
            value={`₱${(stats?.loanConfig?.defaultLoanLimit || 0).toLocaleString()}`}
            subtitle="Default financing threshold"
            icon={Sliders}
            variant="success"
            delay={450}
          />
          <StatCard
            title="Pending Approvals"
            value={stats?.loans?.pendingLoans || 0}
            subtitle="Awaiting authorization"
            icon={AlertTriangle}
            variant="warning"
            delay={500}
          />
        </div>
      </div>

      {/* Loan Limit Configuration */}
      <Card 
        className={`w-full transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        style={{ transitionDelay: '400ms' }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-amber-600" />
            Credit Threshold Configuration
          </CardTitle>
          <CardDescription>
            Establish the default maximum financing allocation for suppliers without custom credit assessments
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
                  Current Default Credit Threshold: <span className="text-blue-700 font-bold">
                    ₱{Number(stats?.loanConfig?.defaultLoanLimit || 0).toLocaleString()}
                  </span>
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  This threshold defines the maximum capital allocation for suppliers without custom credit assessment profiles.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Loans Information */}
      {stats?.loans?.recentLoans && stats.loans.recentLoans.length > 0 && (
        <Card 
          className={`transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          style={{ transitionDelay: '500ms' }}
        >
          <CardHeader>
            <CardTitle>Recent Financial Activity</CardTitle>
            <CardDescription>Latest financing applications and authorizations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    <th className="px-4 py-3"></th>
                    <th className="px-4 py-3">Loans</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date Issued</th>
                    <th className="px-4 py-3">Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.loans.recentLoans.map((loan: any, index: number) => (
                    <tr 
                      key={loan.id} 
                      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        isVisible ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{ transitionDelay: `${600 + (index * 50)}ms` }}
                    >
                      <td className="px-4 py-3 font-medium">{loan.supplier}</td>
                      <td className="px-4 py-3">₱{loan.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
  loan.status === 'approved' ? 'bg-green-100 text-green-800' :
  loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
  loan.status === 'paid' ? 'bg-blue-100 text-blue-800' :
  'bg-gray-100 text-gray-800'
}`}>
  {loan.status}
</span>
                      </td>
                      <td className="px-4 py-3 text-sm">{loan.date}</td>
                      <td className="px-4 py-3">₱{loan.remaining?.toLocaleString() || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}