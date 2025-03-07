// src/app/dashboard/owner/loans/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, AlertCircle, Calendar, BanknoteIcon, User, CreditCard } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";

interface Loan {
  _id: string;
  supplier_id: {
    _id: string;
    user: {
      name: string;
    };
  };
  amount: number;
  purpose: string;
  interest_rate: number;
  due_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
  start_date?: string;
  total_amount_with_interest: number;
  total_paid?: number;
}

export default function OwnerLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [loanPayments, setLoanPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  
  const { user } = useAuth();

  // Fetch loans
  const fetchLoans = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getLoans();
      setLoans(data);
      setFilteredLoans(data);
    } catch (error) {
      console.error("Error fetching loans:", error);
      toast.error("Failed to load loans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  // Fetch loan payments
  const fetchLoanPayments = async (loanId: string) => {
    try {
      setLoadingPayments(true);
      const data = await dashboardApi.getLoanPayments(loanId);
      setLoanPayments(data);
    } catch (error) {
      console.error("Error fetching loan payments:", error);
      toast.error("Failed to load payment history");
    } finally {
      setLoadingPayments(false);
    }
  };

  // Handle tab change to filter loans
  const handleTabChange = (value: string) => {
    if (value === 'all') {
      setFilteredLoans(loans);
    } else {
      setFilteredLoans(loans.filter(loan => loan.status === value));
    }
  };

  // Handle loan approval
  const handleApproveLoan = async (loanId: string) => {
    try {
      await dashboardApi.approveLoan(loanId);
      toast.success("Loan approved successfully");
      fetchLoans(); // Refresh the list
    } catch (error) {
      console.error("Error approving loan:", error);
      toast.error("Failed to approve loan");
    }
  };

  // Handle loan rejection
  const handleRejectLoan = async (loanId: string) => {
    try {
      await dashboardApi.rejectLoan(loanId);
      toast.success("Loan rejected successfully");
      fetchLoans(); // Refresh the list
    } catch (error) {
      console.error("Error rejecting loan:", error);
      toast.error("Failed to reject loan");
    }
  };

  // Show loan details dialog
  const showLoanDetails = (loan: Loan) => {
    setSelectedLoan(loan);
    setShowDetailsDialog(true);
    if (loan.status === 'approved' || loan.status === 'paid') {
      fetchLoanPayments(loan._id);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Status badge color mapping
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Loan Management</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Loans</CardTitle>
          <CardDescription>View and manage supplier loan requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="all">All Loans</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
            </TabsList>
           
            {["all", "pending", "approved", "rejected", "paid"].map((tabValue) => (
              <TabsContent key={tabValue} value={tabValue} className="mt-6">
                <LoanTable
                  loans={filteredLoans}
                  loading={loading}
                  onApprove={handleApproveLoan}
                  onReject={handleRejectLoan}
                  onShowDetails={showLoanDetails}
                  formatCurrency={formatCurrency}
                  getStatusBadge={getStatusBadge}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
     
      {/* Loan Details Dialog */}
      {selectedLoan && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Loan Details</DialogTitle>
              <DialogDescription>
                Review complete information about this loan
              </DialogDescription>
            </DialogHeader>
           
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <User className="text-primary h-5 w-5" />
                <div>
                  <p className="text-sm text-muted-foreground">Supplier</p>
                  <p className="font-medium">{selectedLoan.supplier_id?.user?.name || "Unknown Supplier"}</p>
                </div>
              </div>
             
              <div className="flex items-center space-x-2">
                <BanknoteIcon className="text-primary h-5 w-5" />
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">{formatCurrency(selectedLoan.amount)}</p>
                </div>
              </div>
             
              <div className="flex items-center space-x-2">
                <Calendar className="text-primary h-5 w-5" />
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">{new Date(selectedLoan.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
             
              <div>
                <p className="text-sm text-muted-foreground">Purpose</p>
                <p className="font-medium mt-1">{selectedLoan.purpose}</p>
              </div>
             
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(selectedLoan.status)}</div>
              </div>
             
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Interest Rate</p>
                  <p className="font-medium">{selectedLoan.interest_rate}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created On</p>
                  <p className="font-medium">
                    {selectedLoan.created_at ?
                      new Date(selectedLoan.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) :
                      selectedLoan.createdAt ?
                        new Date(selectedLoan.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) :
                        selectedLoan.start_date ?
                          new Date(selectedLoan.start_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) :
                          "Not available"}
                  </p>
                </div>
              </div>
             
              {selectedLoan.status === 'pending' && (
                <div className="flex space-x-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      handleRejectLoan(selectedLoan._id);
                      setShowDetailsDialog(false);
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleApproveLoan(selectedLoan._id);
                      setShowDetailsDialog(false);
                    }}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              )}
              
              {selectedLoan.status === 'approved' && (
                <div className="flex space-x-2 mt-4">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setShowPaymentDialog(true);
                    }}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Make Payment
                  </Button>
                </div>
              )}
              
              {(selectedLoan.status === 'approved' || selectedLoan.status === 'paid') && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-medium mb-4">Payment History</h3>
                  {loadingPayments ? (
                    <div className="text-center py-4">Loading payments...</div>
                  ) : loanPayments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {loanPayments.map((payment) => (
                        <div key={payment._id} className="border rounded-md p-3">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">
                              {formatCurrency(payment.amount)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(payment.payment_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">{payment.payment_method}</span>
                            <span>•</span>
                            <span>Ref: {payment.reference_number}</span>
                          </div>
                          {payment.notes && (
                            <p className="text-xs mt-2 italic">{payment.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      
    </div>
  );
}

// Loan Table Component
interface LoanTableProps {
  loans: Loan[];
  loading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onShowDetails: (loan: Loan) => void;
  formatCurrency: (amount: number) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}

function LoanTable({
  loans,
  loading,
  onApprove,
  onReject,
  onShowDetails,
  formatCurrency,
  getStatusBadge
}: LoanTableProps) {
  if (loading) {
    return <div className="text-center py-4">Loading loans...</div>;
  }

  if (loans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">No loans found</h3>
        <p className="text-sm text-muted-foreground mt-1">There are no loans matching the selected criteria.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Loan ID</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loans.map((loan) => (
            <TableRow key={loan._id}>
              <TableCell className="font-medium">
                {loan._id.substring(0, 8)}...
              </TableCell>
              <TableCell>
                {loan.supplier_id?.user?.name || "Unknown Supplier"}
              </TableCell>
              <TableCell>{formatCurrency(loan.amount)}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {loan.purpose}
              </TableCell>
              <TableCell>
                {new Date(loan.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </TableCell>
              <TableCell>
                {getStatusBadge(loan.status)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onShowDetails(loan)}
                  >
                    Details
                  </Button>
                 
                  {loan.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReject(loan._id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onApprove(loan._id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}