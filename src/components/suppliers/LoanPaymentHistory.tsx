// src/components/suppliers/LoanPaymentHistory.tsx

"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"

interface LoanPaymentHistoryProps {
  loanId: string;
}

export default function LoanPaymentHistory({ loanId }: LoanPaymentHistoryProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/loans/${loanId}/payments`);
        setPayments(response.data.payments);
      } catch (error) {
        console.error("Error fetching loan payments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [loanId]);

  if (loading) {
    return <div>Loading payment history...</div>;
  }

  if (payments.length === 0) {
    return <div>No payments have been made on this loan yet.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Transaction</TableHead>
              <TableHead>Method</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment._id}>
                <TableCell>
                  {format(new Date(payment.paymentDate), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  ₱{payment.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  {payment.transaction ? `ID: ${payment.transaction._id.substring(0, 8)}...` : "N/A"}
                </TableCell>
                <TableCell>
                  <span className={payment.paymentMethod === "auto-debit" ? "text-green-600" : ""}>
                    {payment.paymentMethod === "auto-debit" ? "Auto-debit" : "Manual"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}