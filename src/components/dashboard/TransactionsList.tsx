// src/components/dashboard/TransactionsList.tsx

"use client";

import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, X, Trash, Info } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

// Updated Transaction interface with loan deduction fields
interface Transaction {
  _id: string;
  transaction_number?: string;
  reference_number?: string;
  supplier: {
    _id: string;
    user: {
      name: string;
    };
  };
  quantity: number;
  total_kilo: number;
  unit_price: number;
  total_price: number;
  total_amount: number;
  loan_deduction?: number;
  amount_after_deduction?: number;
  paid_amount: number;
  status: string;
  transaction_date: string;
}

interface TransactionListPageProps {
  role?: string;
  initialTransactions?: Transaction[];
}

export default function TransactionListPage({ role = "admin", initialTransactions = [] }: TransactionListPageProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [loading, setLoading] = useState(initialTransactions.length === 0);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'cancel' | 'void'>('cancel');
  const [processingAction, setProcessingAction] = useState(false);

  const fetchTransactions = async () => {
    // Skip fetching if we already have transactions from props
    if (initialTransactions && initialTransactions.length > 0) {
      console.log("Using provided transactions:", initialTransactions);
      return;
    }

    try {
      setLoading(true);
      const response = await dashboardApi.getTransactions();
      console.log("Transactions response:", response);
      
      if (response && response.data) {
        setTransactions(response.data);
      } else if (Array.isArray(response)) {
        setTransactions(response);
      } else {
        console.error("Unexpected transactions data structure:", response);
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'voided':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleActionClick = (transaction: Transaction, action: 'cancel' | 'void') => {
    setSelectedTransaction(transaction);
    setDialogAction(action);
    setActionDialogOpen(true);
  };

  const handleProcessAction = async () => {
    if (!selectedTransaction) return;
    
    try {
      setProcessingAction(true);
      
      // Update transaction status based on the action
      const newStatus = dialogAction === 'cancel' ? 'cancelled' : 'voided';
      
      await dashboardApi.updateTransaction(selectedTransaction._id, {
        status: newStatus
      });
      
      toast.success(`Transaction ${dialogAction}ed successfully`);
      setActionDialogOpen(false);
      
      // Refresh the transactions list
      fetchTransactions();
    } catch (error) {
      console.error(`Error ${dialogAction}ing transaction:`, error);
      toast.error(`Failed to ${dialogAction} transaction`);
    } finally {
      setProcessingAction(false);
    }
  };

  
// Helper function to calculate the correct amount paid
const calculateAmountPaid = (transaction: Transaction) => {
  let amount;
 
  // If loan_deduction exists, subtract it from total_amount
  if (transaction.loan_deduction && transaction.loan_deduction > 0) {
    amount = transaction.total_amount - transaction.loan_deduction;
  }
  // If amount_after_deduction is set, use it
  else if (transaction.amount_after_deduction !== undefined) {
    amount = transaction.amount_after_deduction;
  }
  // If paid_amount is set (and not equal to total_amount), use it
  else if (transaction.paid_amount !== undefined && transaction.paid_amount !== transaction.total_amount) {
    amount = transaction.paid_amount;
  }
  // Default to total_amount if no deductions
  else {
    amount = transaction.total_amount;
  }
 
  // Simply return the raw amount and let formatCurrency handle the formatting
  return amount;
};

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">History</h1>
        {/* Only show the New Transaction button for admin and owner roles */}
        {role !== "supplier" && (
          <Link href={`/dashboard/${role}/transactions/new`}>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Transaction
            </Button>
          </Link>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                        {/* New columns for loan deductions */}
                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Deduction</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            <span>Amount Paid</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 ml-1 text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Amount paid to supplier after loan deductions</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        {/* Only show Actions column for admin and owner roles */}
                        {role !== "supplier" && (
                          <th scope="col" className="px-3 py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction._id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.transaction_number || transaction.reference_number || transaction._id.substring(0, 8)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.supplier?.user?.name || 'Unknown'}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.total_kilo || transaction.quantity} kg
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(parseFloat(transaction.unit_price.toFixed(2)))}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(parseFloat((transaction.total_amount || transaction.total_price).toFixed(2)))}
                          </td>
                          {/* Loan deduction column */}
                          <td className="px-3 py-4 whitespace-nowrap text-sm">
                            {transaction.loan_deduction && transaction.loan_deduction > 0 ? (
                              <span className="text-amber-600">
                                {formatCurrency(parseFloat(transaction.loan_deduction.toFixed(2)))}
                              </span>
                            ) : (
                              <span className="text-gray-500">₱0.00</span>
                            )}
                          </td>
                          {/* Amount paid after deductions */}
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(calculateAmountPaid(transaction))}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate ? formatDate(transaction.transaction_date) : new Date(transaction.transaction_date).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusClass(transaction.status)}`}>
                              {transaction.status}
                            </span>
                          </td>
                          {/* Only show Actions cell for admin and owner roles */}
                          {role !== "supplier" && (
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                              {transaction.status.toLowerCase() === 'completed' && (
                                <div className="flex space-x-2 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                                    onClick={() => handleActionClick(transaction, 'cancel')}
                                  >
                                    <X className="h-4 w-4 mr-1" /> Cancel
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => handleActionClick(transaction, 'void')}
                                  >
                                    <Trash className="h-4 w-4 mr-1" /> Void
                                  </Button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No transactions found
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogAction === 'cancel' ? 'Cancel' : 'Void'} Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {dialogAction} this transaction?
              <div className="mt-4 p-4 bg-slate-50 rounded-md space-y-2 text-sm">
                <div className="grid grid-cols-2">
                  <span className="font-medium">Transaction:</span>
                  <span>
                    {selectedTransaction?.transaction_number || selectedTransaction?.reference_number || selectedTransaction?._id.substring(0, 8)}
                  </span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="font-medium">Supplier:</span>
                  <span>{selectedTransaction?.supplier?.user?.name}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="font-medium">Total Amount:</span>
                  <span>
                    {selectedTransaction && formatCurrency
                      ? formatCurrency(parseFloat((selectedTransaction.total_amount || selectedTransaction.total_price).toFixed(2)))
                      : `₱${(selectedTransaction?.total_amount || selectedTransaction?.total_price || 0).toLocaleString()}`
                    }
                  </span>
                </div>
                {/* Add loan deduction info in the alert dialog */}
                {selectedTransaction?.loan_deduction && selectedTransaction.loan_deduction > 0 && (
                  <>
                    <div className="grid grid-cols-2">
                      <span className="font-medium">Loan Deduction:</span>
                      <span className="text-amber-600">
                        {formatCurrency(parseFloat(selectedTransaction.loan_deduction.toFixed(2)))}
                      </span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="font-medium">Amount Paid:</span>
                      <span>
                      {formatCurrency(selectedTransaction.total_amount - selectedTransaction.loan_deduction)}
                      </span>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-2">
                  <span className="font-medium">Quantity:</span>
                  <span>
                    {selectedTransaction && (selectedTransaction.total_kilo || selectedTransaction.quantity)} kg
                  </span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProcessAction}
              disabled={processingAction}
              className={`${dialogAction === 'cancel' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {processingAction ? "Processing..." : dialogAction === 'cancel' ? "Confirm Cancel" : "Confirm Void"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}