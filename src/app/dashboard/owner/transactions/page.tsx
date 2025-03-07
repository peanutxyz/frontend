// src/app/dashboard/owner/transactions/page.tsx

"use client";

import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Edit,
  Search,
  Filter,
  Info,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  RefreshCw,
  Calendar,
  DollarSign,
  Package,
  Users
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Transaction {
  _id: string;
  transaction_number?: string;
  reference_number?: string;
  supplier: any;
  quantity: number;
  total_kilo: number;
  less_kilo: number;
  unit_price: number;
  total_price: number;
  total_amount: number;
  loan_deduction?: number;
  amount_after_deduction?: number;
  paid_amount: number;
  status: string;
  transaction_date: string;
}

// Added unit_price to sort fields
type SortField = 'date' | 'amount' | 'quantity' | 'reference' | 'unit_price';
type SortDirection = 'asc' | 'desc';

export default function OwnerTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Search and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState("all");

  // Fields for updating transaction
  const [quantity, setQuantity] = useState<number | string>('');
  const [lessKilo, setLessKilo] = useState<number | string>('');
  const [unitPrice, setUnitPrice] = useState<number | string>('');

  // Calculated fields
  const totalKilo = Math.max(0, Number(quantity || 0) - Number(lessKilo || 0));
  const totalPrice = totalKilo * Number(unitPrice || 0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchTransactions = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await dashboardApi.getTransactions();
      
      if (response && response.data) {
        setTransactions(response.data);
      } else if (Array.isArray(response)) {
        setTransactions(response);
      } else {
        console.error("Unexpected transactions data structure:", response);
        setTransactions([]);
      }
      
      if (showRefresh) {
        toast.success("Transactions refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Apply filtering and sorting to transactions
  useEffect(() => {
    let result = [...transactions];
    
    // Apply status filter from tabs or dropdown
    if (activeTab !== 'all' && activeTab !== statusFilter) {
      setStatusFilter(activeTab);
    }
    if (statusFilter !== 'all') {
      result = result.filter(transaction =>
        transaction.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    // Apply search (prioritize supplier name searching)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(transaction => {
        // Search supplier name (prioritized)
        const supplierName = getSupplierName(transaction.supplier).toLowerCase();
        if (supplierName.includes(lowerSearch)) {
          return true;
        }
        
        // Transaction references
        const reference = (transaction.transaction_number || '').toLowerCase();
        const refNumber = (transaction.reference_number || '').toLowerCase();
        
        // Amounts as strings
        const totalAmount = transaction.total_amount.toString();
        const unitPrice = transaction.unit_price.toString();
        
        return (
          reference.includes(lowerSearch) ||
          refNumber.includes(lowerSearch) ||
          totalAmount.includes(lowerSearch) ||
          unitPrice.includes(lowerSearch)
        );
      });
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let compareValueA: any;
      let compareValueB: any;
      
      switch (sortField) {
        case 'date':
          compareValueA = new Date(a.transaction_date).getTime();
          compareValueB = new Date(b.transaction_date).getTime();
          break;
        case 'amount':
          compareValueA = a.total_amount;
          compareValueB = b.total_amount;
          break;
        case 'quantity':
          compareValueA = a.total_kilo || a.quantity;
          compareValueB = b.total_kilo || b.quantity;
          break;
        case 'unit_price': // Added case for unit price
          compareValueA = a.unit_price;
          compareValueB = b.unit_price;
          break;
        case 'reference':
          compareValueA = a.reference_number || a.transaction_number || '';
          compareValueB = b.reference_number || b.transaction_number || '';
          break;
        default:
          compareValueA = new Date(a.transaction_date).getTime();
          compareValueB = new Date(b.transaction_date).getTime();
      }
      
      if (sortDirection === 'asc') {
        return compareValueA > compareValueB ? 1 : -1;
      } else {
        return compareValueA < compareValueB ? 1 : -1;
      }
    });
    
    setFilteredTransactions(result);
  }, [transactions, searchTerm, sortField, sortDirection, statusFilter, activeTab]);

  useEffect(() => {
    if (isMounted) {
      fetchTransactions();
    }
  }, [isMounted]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return "bg-green-100 text-green-800 border-green-200";
      case 'pending': return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 'cancelled': return "bg-red-100 text-red-800 border-red-200";
      case 'voided': return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
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
    
    // Return the amount directly without formatting
    return amount;
  };

  const handleUpdateClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    
    // Set initial values for the form
    setQuantity(transaction.quantity);
    setLessKilo(transaction.less_kilo || 0);
    setUnitPrice(transaction.unit_price);
    setUpdateDialogOpen(true);
  };

  const handleUpdateTransaction = async () => {
    if (!selectedTransaction) return;
    
    try {
      setProcessingAction(true);
      
      // Calculate new values
      const newTotalKilo = Math.max(0, Number(quantity || 0) - Number(lessKilo || 0));
      const newTotalPrice = newTotalKilo * Number(unitPrice || 0);
      
      // Prepare update data
      const updateData = {
        quantity: Number(quantity || 0),
        less_kilo: Number(lessKilo || 0),
        unit_price: Number(unitPrice || 0),
        total_kilo: newTotalKilo,
        total_price: newTotalPrice,
        total_amount: newTotalPrice,
        paid_amount: newTotalPrice
      };
      
      // Send update request
      await dashboardApi.updateTransaction(selectedTransaction._id, updateData);
      
      toast.success("Transaction updated successfully");
      setUpdateDialogOpen(false);
      
      // Refresh the transactions list
      fetchTransactions();
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Failed to update transaction");
    } finally {
      setProcessingAction(false);
    }
  };

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Status filter options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'voided', label: 'Voided' }
  ];

  // Column sort headers with compact indicators
  const SortableHeader = ({ field, label }: { field: SortField, label: string }) => (
    <div
      className="flex items-center cursor-pointer group transition-all duration-200"
      onClick={() => handleSort(field)}
    >
      <span>{label}</span>
      <div className="ml-1">
        {sortField === field ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5 text-amber-600" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-amber-600" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-30 group-hover:opacity-70 transition-opacity" />
        )}
      </div>
    </div>
  );

  // Function to summarize transactions for dashboard metrics
  const getSummaryMetrics = () => {
    if (!transactions.length) return { total: 0, completed: 0, pending: 0, totalAmount: 0, supplierCount: 0 };
    
    const completed = transactions.filter(t => t.status === 'completed').length;
    const pending = transactions.filter(t => t.status === 'pending').length;
    const totalAmount = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
    
    // Get unique supplier count
    const uniqueSuppliers = new Set();
    transactions.forEach(t => {
      if (t.supplier) {
        if (typeof t.supplier === 'string') {
          uniqueSuppliers.add(t.supplier);
        } else if (t.supplier._id) {
          uniqueSuppliers.add(t.supplier._id);
        }
      }
    });
    
    return {
      total: transactions.length,
      completed,
      pending,
      totalAmount,
      supplierCount: uniqueSuppliers.size
    };
  };

  const metrics = getSummaryMetrics();

  if (!isMounted) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Transaction Records</h1>
          <p className="text-slate-500 mt-1">Overview of all copra trading transactions</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchTransactions(true)}
            disabled={refreshing}
            className="border-slate-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
         
          <Link href="/dashboard/owner/transactions/new">
            <Button className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 transition-colors">
              <Plus className="h-4 w-4" />
              New Transaction
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Card className="border-slate-200 shadow-sm hover:shadow transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Transactions</p>
                  <h3 className="text-2xl font-bold mt-1">{metrics.total}</h3>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Card className="border-slate-200 shadow-sm hover:shadow transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Active Suppliers</p>
                  <h3 className="text-2xl font-bold mt-1">{metrics.supplierCount}</h3>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Card className="border-slate-200 shadow-sm hover:shadow transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Value</p>
                  <h3 className="text-2xl font-bold mt-1">{formatCurrency(metrics.totalAmount)}</h3>
                </div>
                <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Card className="border-slate-200 shadow-sm hover:shadow transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Last Updated</p>
                  <h3 className="text-lg font-bold mt-1">{new Date().toLocaleDateString()}</h3>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="px-6 pt-6 pb-0">
            <div className="flex flex-col space-y-4">
              <CardTitle>Transaction History</CardTitle>
              
              {/* Search and Filter Controls */}
              <div className="flex flex-col md:flex-row gap-4 pt-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search by name, reference, amount..."
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
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 border-slate-300">
                      <Filter className="h-4 w-4" />
                      <span className="capitalize">{statusFilter === 'all' ? 'All Statuses' : statusFilter}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {statusOptions.map(option => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => {
                          setStatusFilter(option.value);
                          setActiveTab(option.value);
                        }}
                        className={statusFilter === option.value ? "bg-amber-50 text-amber-700 font-medium" : ""}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Status Tabs */}
              <Tabs value={activeTab} onValueChange={(value) => {
                setActiveTab(value);
                setStatusFilter(value);
              }} className="mt-2">
                <TabsList className="bg-slate-100 p-0.5 border border-slate-200 rounded-md">
                  <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md">
                    Completed
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md">
                    Pending
                  </TabsTrigger>
                  <TabsTrigger value="voided" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md">
                    Voided
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
              ) : filteredTransactions.length > 0 ? (
                <motion.div
                  key="table"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-x-auto -mx-6"
                >
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          <SortableHeader field="reference" label="Reference" />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Supplier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          <SortableHeader field="quantity" label="Quantity" />
                        </th>
                        {/* Added Unit Price column */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          <SortableHeader field="unit_price" label="Unit Price" />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          <SortableHeader field="amount" label="Total" />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            <span>Amount Paid</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 ml-1 text-slate-400" />
                                </TooltipTrigger>
                                <TooltipContent className="bg-white shadow-lg border border-slate-200 text-slate-700">
                                  <p className="text-xs">Amount paid to supplier after loan deductions</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          <SortableHeader field="date" label="Date" />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <AnimatePresence>
                        {filteredTransactions.map((transaction, index) => (
                          <motion.tr
                            key={transaction._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, delay: index * 0.03 }}
                            className="hover:bg-slate-50"
                          >
                            <td className="px-6 py-4 text-sm font-medium text-slate-900 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="bg-slate-100 text-slate-600 text-xs py-1 px-2.5 rounded-md font-medium">
                                  {transaction.transaction_number || transaction.reference_number || transaction._id.substring(0, 8)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                              {getSupplierName(transaction.supplier)}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                              {transaction.total_kilo || transaction.quantity} kg
                            </td>
                            {/* Added Unit Price cell */}
                            <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                              {formatCurrency(transaction.unit_price)}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                              {formatCurrency(transaction.total_amount || transaction.total_price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <span className="text-sm font-medium text-slate-900">
                                  {formatCurrency(calculateAmountPaid(transaction))}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                              {formatDate(transaction.transaction_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={`${getStatusColor(transaction.status)} border px-2.5 py-0.5 font-medium text-xs`}>
                                {transaction.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {transaction.status === 'completed' && (
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  className="flex space-x-2"
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                    onClick={() => handleUpdateClick(transaction)}
                                  >
                                    <Edit className="h-3.5 w-3.5 mr-1" /> Update
                                  </Button>
                                </motion.div>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 px-4"
                >
                  <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-1">No transactions found</h3>
                  <p className="text-slate-500 text-center max-w-md">
                    {searchTerm || statusFilter !== 'all' ?
                      "No matching transactions found. Try adjusting your search or filters." :
                      "Start by creating a new transaction using the button above."}
                  </p>
                  {(searchTerm || statusFilter !== 'all') && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setActiveTab('all');
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mobile View for Small Screens */}
      <div className="md:hidden">
        <h2 className="text-lg font-medium text-slate-900 mb-4">Transaction List</h2>
        <div className="space-y-4">
          <AnimatePresence>
            {filteredTransactions.map((transaction, index) => (
              <motion.div
                key={transaction._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="bg-slate-100 text-slate-600 text-xs py-1 px-2 rounded-md font-medium">
                        {transaction.transaction_number || transaction.reference_number || transaction._id.substring(0, 8)}
                      </span>
                    </div>
                    <Badge className={`${getStatusColor(transaction.status)} border px-2 py-0.5 font-medium text-xs`}>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-xs text-slate-500">Supplier</div>
                    <div className="text-sm font-medium">{getSupplierName(transaction.supplier)}</div>
                    
                    <div className="text-xs text-slate-500">Quantity</div>
                    <div className="text-sm">{transaction.total_kilo || transaction.quantity} kg</div>
                    
                    {/* Added Unit Price in mobile view */}
                    <div className="text-xs text-slate-500">Unit Price</div>
                    <div className="text-sm">{formatCurrency(transaction.unit_price)}</div>
                    
                    <div className="text-xs text-slate-500">Total Amount</div>
                    <div className="text-sm">{formatCurrency(transaction.total_amount || transaction.total_price)}</div>
                    
                    {transaction.loan_deduction && transaction.loan_deduction > 0 && (
                      <>
                        <div className="text-xs text-slate-500">Loan Deduction</div>
                        <div className="text-sm text-amber-600">{formatCurrency(transaction.loan_deduction)}</div>
                      </>
                    )}
                    
                    <div className="text-xs text-slate-500">Amount Paid</div>
                    <div className="text-sm font-medium">{formatCurrency(calculateAmountPaid(transaction))}</div>
                    
                    <div className="text-xs text-slate-500">Date</div>
                    <div className="text-sm">{formatDate(transaction.transaction_date)}</div>
                  </div>
                </div>
                {transaction.status === 'completed' && (
                  <div className="p-4 pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-9 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => handleUpdateClick(transaction)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1.5" /> Update Transaction
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredTransactions.length === 0 && !loading && (
            <div className="text-center py-10 px-4">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-500">
                {searchTerm || statusFilter !== 'all' ?
                  "No matching transactions found." :
                  "No transactions found."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Update Transaction Dialog */}
      <AlertDialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Update Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Update the transaction details below
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity (kg)
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.1"
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuantity(val === '' ? '' : Number(val));
                }}
                className="col-span-3 border-slate-300 focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="less_kilo" className="text-right">
                Less Kilo
              </Label>
              <Input
                id="less_kilo"
                type="number"
                min="0"
                step="0.1"
                value={lessKilo}
                onChange={(e) => {
                  const val = e.target.value;
                  setLessKilo(val === '' ? '' : Number(val));
                }}
                className="col-span-3 border-slate-300 focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unit_price" className="text-right">
                Unit Price (₱)
              </Label>
              <Input
                id="unit_price"
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => {
                  const val = e.target.value;
                  setUnitPrice(val === '' ? '' : Number(val));
                }}
                className="col-span-3 border-slate-300 focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
            {/* Summary Information */}
            <motion.div
              className="bg-slate-50 p-4 rounded-md mt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h4 className="text-sm font-medium mb-2">Transaction Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Net Weight:</div>
                <div className="text-right">{totalKilo} kg</div>
                
                <div>Unit Price:</div>
                <div className="text-right">₱{Number(unitPrice || 0).toLocaleString()}</div>
                
                <div className="font-semibold">New Total:</div>
                <div className="text-right font-semibold">₱{totalPrice.toLocaleString()}</div>
                
                <div className="font-semibold text-gray-500">Original Total:</div>
                <div className="text-right font-semibold text-gray-500">
                  ₱{selectedTransaction ? (selectedTransaction.total_amount || selectedTransaction.total_price).toLocaleString() : 0}
                </div>
                
                <div className="font-semibold text-gray-500">Difference:</div>
                {selectedTransaction && (
                  <div className={`text-right font-semibold ${totalPrice > (selectedTransaction.total_amount || selectedTransaction.total_price) ? 'text-green-600' : 'text-red-600'}`}>
                    ₱{Math.abs(totalPrice - (selectedTransaction.total_amount || selectedTransaction.total_price)).toLocaleString()}
                    {totalPrice > (selectedTransaction.total_amount || selectedTransaction.total_price) ? ' (increase)' : ' (decrease)'}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpdateTransaction}
              disabled={processingAction}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {processingAction ? (
                <span className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Update Transaction"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}