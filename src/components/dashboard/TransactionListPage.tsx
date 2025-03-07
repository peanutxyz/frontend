// src/components/dashboard/TransactionsListPage.tsx

"use client";

import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
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

interface Transaction {
  _id: string;
  transaction_number?: string;
  reference_number?: string;
  supplier: any;
  quantity: number;
  total_kilo: number;
  unit_price: number;
  total_price: number;
  total_amount: number;
  loan_deduction?: number;
  amount_after_deduction?: number;
  paid_amount?: number;
  status: string;
  transaction_date: string;
}

export default function TransactionListPage({ role = "admin" }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [processingApproval, setProcessingApproval] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Use different endpoint based on role
      const response = role === "supplier" 
        ? await dashboardApi.getSupplierTransactions() 
        : await dashboardApi.getTransactions();
      
      console.log("Transactions response:", response);
     
      let transactionsData = [];
      if (response && response.data) {
        transactionsData = response.data;
      } else if (Array.isArray(response)) {
        transactionsData = response;
      } else {
        console.error("Unexpected transactions data structure:", response);
        transactionsData = [];
      }
     
      // Debug log to check supplier structure
      if (transactionsData.length > 0) {
        console.log("First transaction supplier:", transactionsData[0].supplier);
      }
     
      setTransactions(transactionsData);
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
    switch (status?.toLowerCase() || 'unknown') {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get supplier name from different possible structures
  const getSupplierName = (supplier: any) => {
    if (!supplier) return 'Unknown';
   
    // Check all possible structures
    if (typeof supplier === 'string') return supplier;
   
    if (supplier.name) return supplier.name;
   
    if (supplier.user && supplier.user.name) return supplier.user.name;
   
    // If populated as an object with _id only
    if (supplier._id && !supplier.name && !supplier.user) return 'Unknown';
   
    return 'Unknown';
  };

  // Helper to format currency
  const formatCurrency = (amount: number = 0) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const handleApproveClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setApprovalDialogOpen(true);
  };

  const handleApproveTransaction = async () => {
    if (!selectedTransaction) return;
   
    try {
      setProcessingApproval(true);
     
      // Update transaction status to completed and record payment
      await dashboardApi.updateTransaction(selectedTransaction._id, {
        status: "completed",
        paid_amount: selectedTransaction.total_amount || selectedTransaction.total_price
      });
     
      toast.success("Transaction approved and payment recorded");
      setApprovalDialogOpen(false);
     
      // Refresh the transactions list
      fetchTransactions();
    } catch (error) {
      console.error("Error approving transaction:", error);
      toast.error("Failed to approve transaction");
    } finally {
      setProcessingApproval(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transactions</h1>
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
          <CardTitle>Transaction List</CardTitle>
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
      <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Deduction</th>
      <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
      <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
      <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {transactions.map((transaction) => (
      <tr key={transaction._id} className="hover:bg-gray-50">
        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          {transaction.transaction_number || transaction.reference_number || transaction._id.substring(0, 8)}
        </td>
        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
          {getSupplierName(transaction.supplier)}
        </td>
        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
          {transaction.total_kilo || transaction.quantity} kg
        </td>
        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
          {formatCurrency(transaction.unit_price)}
        </td>
        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
          {formatCurrency(transaction.total_amount || transaction.total_price)}
        </td>
        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
          {formatCurrency(transaction.loan_deduction || 0)}
        </td>
        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatCurrency(transaction.amount_after_deduction || transaction.paid_amount || transaction.total_amount || transaction.total_price)}
        </td>
        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
          {formatDate(transaction.transaction_date)}
        </td>
        <td className="px-3 py-4 whitespace-nowrap">
          <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusClass(transaction.status)}`}>
            {transaction.status || 'Unknown'}
          </span>
        </td>
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

      {/* Approval Dialog */}
      <AlertDialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this transaction?
              {selectedTransaction && (
                <div className="mt-4 p-4 bg-slate-50 rounded-md space-y-2 text-sm">
                  <div className="grid grid-cols-2">
                    <span className="font-medium">Reference:</span>
                    <span>
                      {selectedTransaction.transaction_number || 
                       selectedTransaction.reference_number || 
                       selectedTransaction._id.substring(0, 8)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="font-medium">Supplier:</span>
                    <span>{getSupplierName(selectedTransaction.supplier)}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="font-medium">Amount:</span>
                    <span>
                      {formatCurrency(selectedTransaction.total_amount || selectedTransaction.total_price)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="font-medium">Quantity:</span>
                    <span>
                      {selectedTransaction.total_kilo || selectedTransaction.quantity} kg
                    </span>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingApproval}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveTransaction}
              disabled={processingApproval}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingApproval ? "Processing..." : "Approve Transaction"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}