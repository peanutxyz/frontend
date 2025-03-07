// src/app/dashboard/supplier/loans/page.tsx

"use client";

import { dashboardApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, DollarSign, TimerIcon, Plus, AlertCircle } from "lucide-react";
import { LoanRequestForm } from "@/components/suppliers/LoanRequestForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Loan {
  _id: string;
  amount: number;
  total_amount_with_interest?: number;
  total_paid?: number;
  interest_rate?: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled' | 'voided';
  approvalDate?: string;
  createdAt?: string;
  due_date?: string;
  purpose?: string;
  remainingAmount?: number;
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setOpen(false);
    // Trigger a refresh of the loans list
    setRefreshKey(prev => prev + 1);
    toast.success("Loan request submitted successfully");
  };

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setIsLoading(true);
       
        // Use the specific supplier loans endpoint
        const loanData = await dashboardApi.getSupplierLoans();
        console.log('Loan data from API:', loanData);
       
        setLoans(loanData);
      } catch (error) {
        console.error('Error fetching loans:', error);
        toast.error("Failed to load loan history");
      } finally {
        setIsLoading(false);
      }
    };
   
    fetchLoans();
  }, [refreshKey]);

  // Check if there are any active (approved) loans
  const hasActiveLoans = loans.some(loan => loan.status === 'approved');

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'text-green-500';
      case 'pending': return 'text-yellow-500';
      case 'rejected': return 'text-red-500';
      case 'paid': return 'text-blue-500';
      case 'cancelled': return 'text-orange-500';
      case 'voided': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '₱0';
    return `₱${amount.toLocaleString()}`;
  };

  const formatProgress = (loan: Loan): number => {
    // Calculate based on total paid vs total amount with interest (or regular amount if no interest)
    const totalAmount = loan.total_amount_with_interest || loan.amount;
    const paid = loan.total_paid || 0;
   
    if (!totalAmount || totalAmount === 0) return 0;
    const progress = (paid / totalAmount) * 100;
    return Math.min(Math.round(progress), 100); // Ensure progress doesn't exceed 100%
  };

  const calculateRemaining = (loan: Loan): number => {
    const totalAmount = loan.total_amount_with_interest || loan.amount;
    const paid = loan.total_paid || 0;
    return Math.max(0, totalAmount - paid);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Loan History</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button 
                    className="flex items-center gap-2" 
                    disabled={hasActiveLoans}
                    onClick={() => !hasActiveLoans && setOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Request Loan
                  </Button>
                </div>
              </TooltipTrigger>
              {hasActiveLoans && (
                <TooltipContent>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <p>You cannot request a new loan until your existing loan is fully paid.</p>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Request a New Loan</DialogTitle>
              <DialogDescription>
                Fill out the form below to request a loan. Your credit eligibility is based on your transaction history.
              </DialogDescription>
            </DialogHeader>
            <LoanRequestForm onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>
     
      {hasActiveLoans && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800">Active Loan Exists</h3>
            <p className="text-amber-700 text-sm mt-1">
              You currently have an active loan that needs to be paid off before you can request a new one. 
              New loan requests will be available once your current loan is fully paid.
            </p>
          </div>
        </div>
      )}
     
      <div className="grid gap-6" key={refreshKey}>
        {loans && loans.length > 0 ? loans.map((loan) => (
          <Card key={loan._id} className="overflow-hidden">
            <CardHeader className="border-b bg-muted/40">
              <div className="flex items-center justify-between">
                <CardTitle>Loan #{loan._id?.slice(-6) || 'Unknown'}</CardTitle>
                <span className={`font-semibold capitalize ${getStatusColor(loan.status)}`}>
                  {loan.status || 'Unknown'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <p className="font-semibold">{formatCurrency(loan.amount)}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total with Interest</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <p className="font-semibold">{formatCurrency(loan.total_amount_with_interest || loan.amount)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Interest Rate: {loan.interest_rate || 0}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    <p className="font-semibold">{formatDate(loan.createdAt || loan.approvalDate)}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <div className="flex items-center gap-2">
                    <TimerIcon className="h-4 w-4 text-primary" />
                    <p className="font-semibold">{formatDate(loan.due_date)}</p>
                  </div>
                </div>
              </div>
             
              {/* Payment Progress */}
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Payment Progress</span>
                  <span>{formatProgress(loan)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{
                      width: `${formatProgress(loan)}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Paid: {formatCurrency(loan.total_paid)}</span>
                  <span>
                    Remaining: {formatCurrency(loan.remainingAmount !== undefined ? loan.remainingAmount : calculateRemaining(loan))}
                  </span>
                </div>
              </div>
             
              {/* Purpose */}
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Purpose: {loan.purpose || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>
        )) : (
          <Card className="p-6 text-center text-muted-foreground">
            No loans found
          </Card>
        )}
      </div>
    </div>
  );
}