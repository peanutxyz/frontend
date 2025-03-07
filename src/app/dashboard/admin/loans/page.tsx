// src/app/dashboard/admin/loans/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  X, 
  AlertCircle, 
  Calendar, 
  BanknoteIcon, 
  User, 
  Search, 
  Filter,
  ArrowUpRight,
  Loader2,
  CreditCard,
  Clock,
  Pencil,
  Trash
} from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled' | 'voided';
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
  start_date?: string;
}

export default function AdminLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [confirmActionDialog, setConfirmActionDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentAction, setCurrentAction] = useState<string>("");
  const [processingAction, setProcessingAction] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
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

  // Apply search and filtering
  useEffect(() => {
    let result = [...loans];
    
    // Apply status filter
    if (activeTab !== 'all') {
      result = result.filter(loan => loan.status === activeTab);
    }
    
    // Apply search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(loan => {
        // Search loan ID
        if (loan._id.toLowerCase().includes(lowerSearch)) return true;
        
        // Search supplier name
        const supplierName = loan.supplier_id?.user?.name?.toLowerCase() || '';
        if (supplierName.includes(lowerSearch)) return true;
        
        // Search purpose
        if (loan.purpose.toLowerCase().includes(lowerSearch)) return true;
        
        // Search amount (as string)
        if (loan.amount.toString().includes(lowerSearch)) return true;
        
        return false;
      });
    }
    
    setFilteredLoans(result);
  }, [loans, searchTerm, activeTab]);

  // Handle loan approval
  const handleApproveLoan = async (loanId: string) => {
    try {
      setProcessingAction(true);
      await dashboardApi.approveLoan(loanId);
      toast.success("Loan approved successfully");
      fetchLoans(); // Refresh the list
      setConfirmActionDialog(false);
    } catch (error) {
      console.error("Error approving loan:", error);
      toast.error("Failed to approve loan");
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle loan rejection
  const handleRejectLoan = async (loanId: string) => {
    try {
      setProcessingAction(true);
      await dashboardApi.rejectLoan(loanId);
      toast.success("Loan rejected successfully");
      fetchLoans(); // Refresh the list
      setConfirmActionDialog(false);
    } catch (error) {
      console.error("Error rejecting loan:", error);
      toast.error("Failed to reject loan");
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle loan cancellation
  const handleCancelLoan = async (loanId: string) => {
    try {
      setProcessingAction(true);
      await dashboardApi.cancelLoan(loanId);
      toast.success("Loan cancelled successfully");
      fetchLoans(); // Refresh the list
      setConfirmActionDialog(false);
    } catch (error) {
      console.error("Error cancelling loan:", error);
      toast.error("Failed to cancel loan");
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle loan voiding
  const handleVoidLoan = async (loanId: string) => {
    try {
      setProcessingAction(true);
      await dashboardApi.voidLoan(loanId);
      toast.success("Loan voided successfully");
      fetchLoans(); // Refresh the list
      setConfirmActionDialog(false);
    } catch (error) {
      console.error("Error voiding loan:", error);
      toast.error("Failed to void loan");
    } finally {
      setProcessingAction(false);
    }
  };

  // Show loan details dialog
  const showLoanDetails = (loan: Loan) => {
    setSelectedLoan(loan);
    setShowDetailsDialog(true);
  };

  // Show confirmation dialog for actions
  const confirmAction = (loan: Loan, action: string) => {
    setSelectedLoan(loan);
    setCurrentAction(action);
    setConfirmActionDialog(true);
  };

  // Execute the current action
  const executeAction = () => {
    if (!selectedLoan) return;
    
    switch (currentAction) {
      case "approve":
        handleApproveLoan(selectedLoan._id);
        break;
      case "reject":
        handleRejectLoan(selectedLoan._id);
        break;
      case "cancel":
        handleCancelLoan(selectedLoan._id);
        break;
      case "void":
        handleVoidLoan(selectedLoan._id);
        break;
    }
  };

  // Status badge color mapping
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 font-medium">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 font-medium">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 font-medium">Rejected</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 font-medium">Paid</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 font-medium">Cancelled</Badge>;
      case 'voided':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 font-medium">Voided</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get loan metrics
  const getLoanMetrics = () => {
    if (!loans.length) return { total: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0 };
    
    const pending = loans.filter(loan => loan.status === 'pending').length;
    const approved = loans.filter(loan => loan.status === 'approved').length;
    const rejected = loans.filter(loan => loan.status === 'rejected').length;
    const totalAmount = loans.reduce((sum, loan) => {
      return loan.status === 'approved' ? sum + loan.amount : sum;
    }, 0);
    
    return {
      total: loans.length,
      pending,
      approved,
      rejected,
      totalAmount
    };
  };

  const metrics = getLoanMetrics();

  // Format date utility function
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not available";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Get created date based on available fields
  const getCreatedDate = (loan: Loan) => {
    if (loan.created_at) {
      return formatDate(loan.created_at);
    } else if (loan.createdAt) {
      return formatDate(loan.createdAt);
    } else if (loan.start_date) {
      return formatDate(loan.start_date);
    }
    return "Not available";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Loan Management</h1>
          <p className="text-slate-500 mt-1">View and manage all supplier loan requests</p>
        </div>
      </motion.div>

      {/* Metrics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <Card className="border-slate-200 shadow-sm hover:shadow transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Total Loans</p>
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold">{metrics.total}</h3>
              <div className="flex items-center mt-1">
                <p className="text-xs text-slate-500">loan requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm hover:shadow transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Pending Approval</p>
              <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold">{metrics.pending}</h3>
              <div className="flex items-center mt-1">
                <p className="text-xs text-slate-500">requiring review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm hover:shadow transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Approved Amount</p>
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <BanknoteIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold">{formatCurrency(metrics.totalAmount)}</h3>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                <p className="text-xs text-green-500">{metrics.approved} active loans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm hover:shadow transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Rejected</p>
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                <X className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold">{metrics.rejected}</h3>
              <div className="flex items-center mt-1">
                <p className="text-xs text-slate-500">loans declined</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="px-6 pt-6 pb-0">
            <div className="flex flex-col space-y-4">
              <CardTitle>Loans</CardTitle>
              <CardDescription>View and manage all supplier loan requests</CardDescription>
              
              {/* Search and Filter Controls */}
              <div className="flex flex-col md:flex-row gap-4 pt-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search by name, purpose, amount..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 border-slate-300 focus:border-amber-500 focus:ring-amber-500"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Status Tabs */}
              <Tabs value={activeTab} onValueChange={(value) => {
                setActiveTab(value);
              }} className="mt-2">
                <TabsList className="bg-slate-100 p-0.5 border border-slate-200 rounded-md">
                  <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm rounded-md">
                    All Loans
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm rounded-md">
                    Pending
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm rounded-md">
                    Approved
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm rounded-md">
                    Rejected
                  </TabsTrigger>
                  <TabsTrigger value="paid" className="data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm rounded-md">
                    Paid
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                      <div className="h-px bg-slate-100" />
                    </div>
                  ))}
                </motion.div>
              ) : filteredLoans.length > 0 ? (
                // Desktop view (table)
                <div className="hidden md:block">
                  <div className="rounded-md border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-medium text-slate-500">Loan ID</TableHead>
                          <TableHead className="font-medium text-slate-500">Supplier</TableHead>
                          <TableHead className="font-medium text-slate-500">Amount</TableHead>
                          <TableHead className="font-medium text-slate-500">Purpose</TableHead>
                          <TableHead className="font-medium text-slate-500">Due Date</TableHead>
                          <TableHead className="font-medium text-slate-500">Status</TableHead>
                          <TableHead className="text-right font-medium text-slate-500">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {filteredLoans.map((loan, index) => (
                            <motion.tr
                              key={loan._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2, delay: index * 0.03 }}
                              className="hover:bg-slate-50 cursor-pointer"
                              onClick={() => showLoanDetails(loan)}
                            >
                              <TableCell className="font-medium text-slate-900">
                                {loan._id.substring(0, 8)}...
                              </TableCell>
                              <TableCell className="text-slate-600">
                                {loan.supplier_id?.user?.name || "Unknown Supplier"}
                              </TableCell>
                              <TableCell className="text-slate-600">{formatCurrency(loan.amount)}</TableCell>
                              <TableCell className="max-w-[200px] truncate text-slate-600">
                                {loan.purpose}
                              </TableCell>
                              <TableCell className="text-slate-600">
                                {formatDate(loan.due_date)}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(loan.status)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                  {loan.status === 'pending' && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors"
                                        onClick={() => confirmAction(loan, 'reject')}
                                      >
                                        <X className="h-3.5 w-3.5 mr-1" /> Reject
                                      </Button>
                                      <Button
                                        variant="default"
                                        size="sm"
                                        className="h-8 bg-green-600 hover:bg-green-700 transition-colors"
                                        onClick={() => confirmAction(loan, 'approve')}
                                      >
                                        <Check className="h-3.5 w-3.5 mr-1" /> Approve
                                      </Button>
                                    </>
                                  )}
                                  
                                  {(loan.status === 'approved' || loan.status === 'rejected') && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8"
                                        >
                                          <Pencil className="h-3.5 w-3.5 mr-1" /> Actions
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          className="text-yellow-600 focus:text-yellow-700 focus:bg-yellow-50"
                                          onClick={() => confirmAction(loan, 'cancel')}
                                        >
                                          Cancel Loan
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                          onClick={() => confirmAction(loan, 'void')}
                                        >
                                          <Trash className="h-3.5 w-3.5 mr-1" /> Void Loan
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 px-4"
                >
                  <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <AlertCircle className="h-12 w-12 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-1">No loans found</h3>
                  <p className="text-slate-500 text-center max-w-md">
                    {searchTerm || activeTab !== 'all' ?
                      "No matching loans found. Try adjusting your search or filters." :
                      "There are no loans in the system yet."}
                  </p>
                  {(searchTerm || activeTab !== 'all') && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSearchTerm('');
                        setActiveTab('all');
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile view (cards) - Only show when loans exist */}
            {!loading && filteredLoans.length > 0 && (
              <div className="md:hidden space-y-4 mt-4">
                <AnimatePresence>
                  {filteredLoans.map((loan, index) => (
                    <motion.div
                      key={loan._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden"
                      onClick={() => showLoanDetails(loan)}
                    >
                      <div className="p-4 border-b border-slate-100">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="bg-slate-100 text-slate-600 text-xs py-1 px-2 rounded-md font-medium">
                              {loan._id.substring(0, 8)}...
                            </span>
                          </div>
                          {getStatusBadge(loan.status)}
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-xs text-slate-500">Supplier</div>
                          <div className="text-sm font-medium">{loan.supplier_id?.user?.name || "Unknown Supplier"}</div>
                          
                          <div className="text-xs text-slate-500">Amount</div>
                          <div className="text-sm font-medium">{formatCurrency(loan.amount)}</div>
                          
                          <div className="text-xs text-slate-500">Due Date</div>
                          <div className="text-sm">{formatDate(loan.due_date)}</div>
                          
                          <div className="text-xs text-slate-500">Purpose</div>
                          <div className="text-sm truncate">{loan.purpose}</div>
                        </div>
                      </div>
                      <div className="p-4 pt-0" onClick={(e) => e.stopPropagation()}>
                        {loan.status === 'pending' && (
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-9 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                              onClick={() => confirmAction(loan, 'reject')}
                            >
                              <X className="h-3.5 w-3.5 mr-1.5" /> Reject
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1 h-9 bg-green-600 hover:bg-green-700"
                              onClick={() => confirmAction(loan, 'approve')}
                            >
                              <Check className="h-3.5 w-3.5 mr-1.5" /> Approve
                            </Button>
                          </div>
                        )}
                        
                        {(loan.status === 'approved' || loan.status === 'rejected') && (
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-9 text-yellow-600 border-yellow-200 hover:bg-yellow-50 hover:text-yellow-700"
                              onClick={() => confirmAction(loan, 'cancel')}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-9 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                              onClick={() => confirmAction(loan, 'void')}
                            >
                              <Trash className="h-3.5 w-3.5 mr-1.5" /> Void
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

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
              <div className="flex items-center space-x-4 p-3 bg-slate-50 rounded-md">
                <User className="text-amber-600 h-5 w-5" />
                <div>
                  <p className="text-sm text-slate-500">Supplier</p>
                  <p className="font-medium text-slate-900">{selectedLoan.supplier_id?.user?.name || "Unknown Supplier"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1 p-3 bg-slate-50 rounded-md">
                  <p className="text-sm text-slate-500">Amount</p>
                  <p className="font-medium text-slate-900">{formatCurrency(selectedLoan.amount)}</p>
                </div>
                
                <div className="flex flex-col space-y-1 p-3 bg-slate-50 rounded-md">
                  <p className="text-sm text-slate-500">Interest Rate</p>
                  <p className="font-medium text-slate-900">{selectedLoan.interest_rate}%</p>
                </div>
              </div>
              
              <div className="flex flex-col space-y-1 p-3 bg-slate-50 rounded-md">
                <p className="text-sm text-slate-500">Purpose</p>
                <p className="font-medium text-slate-900">{selectedLoan.purpose}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1 p-3 bg-slate-50 rounded-md">
                  <p className="text-sm text-slate-500">Due Date</p>
                  <p className="font-medium text-slate-900">{formatDate(selectedLoan.due_date)}</p>
                </div>
                
                <div className="flex flex-col space-y-1 p-3 bg-slate-50 rounded-md">
                  <p className="text-sm text-slate-500">Created On</p>
                  <p className="font-medium text-slate-900">{getCreatedDate(selectedLoan)}</p>
                </div>
              </div>
              
              <div className="flex flex-col space-y-1 p-3 bg-slate-50 rounded-md">
                <p className="text-sm text-slate-500">Status</p>
                <div className="mt-1">{getStatusBadge(selectedLoan.status)}</div>
              </div>
              
              {selectedLoan.status === 'pending' && (
                <div className="flex space-x-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      confirmAction(selectedLoan, 'reject');
                      setShowDetailsDialog(false);
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      confirmAction(selectedLoan, 'approve');
                      setShowDetailsDialog(false);
                    }}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              )}
              
              {(selectedLoan.status === 'approved' || selectedLoan.status === 'rejected') && (
                <div className="flex space-x-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1 text-yellow-600 border-yellow-200 hover:bg-yellow-50 hover:text-yellow-700"
                    onClick={() => {
                      confirmAction(selectedLoan, 'cancel');
                      setShowDetailsDialog(false);
                    }}
                  >
                    Cancel Loan
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      confirmAction(selectedLoan, 'void');
                      setShowDetailsDialog(false);
                    }}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Void Loan
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Dialog */}
      {selectedLoan && (
        <Dialog open={confirmActionDialog} onOpenChange={setConfirmActionDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {currentAction === 'approve' ? 'Approve Loan' :
                 currentAction === 'reject' ? 'Reject Loan' :
                 currentAction === 'cancel' ? 'Cancel Loan' :
                 currentAction === 'void' ? 'Void Loan' : 'Confirm Action'}
              </DialogTitle>
              <DialogDescription>
                {currentAction === 'approve' ? 'Are you sure you want to approve this loan?' :
                 currentAction === 'reject' ? 'Are you sure you want to reject this loan?' :
                 currentAction === 'cancel' ? 'Are you sure you want to cancel this loan?' :
                 currentAction === 'void' ? 'Are you sure you want to void this loan? This action cannot be undone.' : 'Confirm this action?'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 p-4 bg-slate-50 rounded-md space-y-2 text-sm">
              <div className="grid grid-cols-2">
                <span className="font-medium">Supplier:</span>
                <span>{selectedLoan.supplier_id?.user?.name || "Unknown Supplier"}</span>
              </div>
              
              <div className="grid grid-cols-2">
                <span className="font-medium">Amount:</span>
                <span>{formatCurrency(selectedLoan.amount)}</span>
              </div>
              
              <div className="grid grid-cols-2">
                <span className="font-medium">Due Date:</span>
                <span>{formatDate(selectedLoan.due_date)}</span>
              </div>
              
              <div className="grid grid-cols-2">
                <span className="font-medium">Status:</span>
                <span>{selectedLoan.status.charAt(0).toUpperCase() + selectedLoan.status.slice(1)}</span>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setConfirmActionDialog(false)} 
                disabled={processingAction}
              >
                Cancel
              </Button>
              <Button
                onClick={executeAction}
                disabled={processingAction}
                className={
                  currentAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 
                  currentAction === 'reject' ? 'bg-red-600 hover:bg-red-700' : 
                  currentAction === 'cancel' ? 'bg-yellow-600 hover:bg-yellow-700' : 
                  currentAction === 'void' ? 'bg-red-600 hover:bg-red-700' : 
                  'bg-primary'
                }
              >
                {processingAction ? (
                  <span className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Confirm ${currentAction.charAt(0).toUpperCase() + currentAction.slice(1)}`
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}