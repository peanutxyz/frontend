// src/app/dashboard/owner/payments/page.tsx

"use client";

import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Eye, Search, User, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Same interface as AdminPaymentsPage
interface Payment {
  _id: string;
  loan: {
    _id: string;
    supplier: {
      _id: string;
      name: string;
      user: {
        name: string;
      }
    }
  };
  amount: number;
  payment_method: 'cash' | 'bank' | 'credit';
  reference_number: string;
  payment_date: string;
  processed_by: {
    name: string;
  };
  interest_portion: number;
  principal_portion: number;
  notes?: string;
  created_at: string;
}

export default function OwnerPaymentsPage() {
  // Same state variables as AdminPaymentsPage
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Fetch all payments
  const fetchPayments = async () => {
    try {
      setLoading(true);
      // Same API call as AdminPaymentsPage
      const data = await dashboardApi.getAllPayments();
      setPayments(data);
      setFilteredPayments(data);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Handle search - same as AdminPaymentsPage
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPayments(payments);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredPayments(
        payments.filter((payment) => 
          payment.reference_number.toLowerCase().includes(term) ||
          payment.loan?.supplier?.user?.name?.toLowerCase().includes(term) ||
          payment.processed_by?.name?.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, payments]);

  // Show payment details - same as AdminPaymentsPage
  const showPaymentDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetailsDialog(true);
  };

  // Format currency - same as AdminPaymentsPage
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date - same as AdminPaymentsPage
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Payment method badge - same as AdminPaymentsPage
  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Cash</Badge>;
      case 'bank':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Bank Transfer</Badge>;
      case 'credit':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Credit/Debit Card</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  return (
    // Same UI as AdminPaymentsPage
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Payments</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Payment Search</CardTitle>
          <CardDescription>Search by reference number, supplier name, or processor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
          <CardDescription>View all loan payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading payments...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No payments found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm ? "No payments match your search criteria." : "There are no payment records yet."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Processor</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell className="font-medium">
                        {payment.reference_number}
                      </TableCell>
                      <TableCell>
                        {payment.loan?.supplier?.user?.name || "Unknown Supplier"}
                      </TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        {getMethodBadge(payment.payment_method)}
                      </TableCell>
                      <TableCell>
                        {formatDate(payment.payment_date)}
                      </TableCell>
                      <TableCell>
                        {payment.processed_by?.name || "System"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showPaymentDetails(payment)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog - same as AdminPaymentsPage */}
      {selectedPayment && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
              <DialogDescription>
                Complete information about this payment
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Badge className="px-4 py-1 text-base">
                  {selectedPayment.reference_number}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDate(selectedPayment.created_at)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <User className="text-primary h-5 w-5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Supplier</p>
                    <p className="font-medium">
                      {selectedPayment.loan?.supplier?.user?.name || "Unknown Supplier"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="text-primary h-5 w-5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Date</p>
                    <p className="font-medium">
                      {formatDate(selectedPayment.payment_date)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Payment Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Amount:</span>
                    <span className="font-medium">{formatCurrency(selectedPayment.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Principal Portion:</span>
                    <span>{formatCurrency(selectedPayment.principal_portion)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Interest Portion:</span>
                    <span>{formatCurrency(selectedPayment.interest_portion)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Payment Method:</span>
                    <span>{getMethodBadge(selectedPayment.payment_method)}</span>
                  </div>
                </div>
              </div>
              
              {selectedPayment.notes && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Notes</h3>
                  <p className="text-sm">{selectedPayment.notes}</p>
                </div>
              )}
              
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Processed By:</span>
                  <span>{selectedPayment.processed_by?.name || "System"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Loan ID:</span>
                  <span className="font-mono text-xs">{selectedPayment.loan?._id}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}