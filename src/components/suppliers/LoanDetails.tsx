// src/components/suppliers/LoanDetails.tsx

"use client"

import { useState, useEffect } from "react"
import { dashboardApi } from "@/lib/api"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"
import LoanPaymentHistory from "./LoanPaymentHistory"

interface LoanDetailsProps {
  loanId: string;
}

export default function LoanDetails({ loanId }: LoanDetailsProps) {
  const [loan, setLoan] = useState<any>(null);
  const [loanPayments, setLoanPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoanData = async () => {
      try {
        setLoading(true);
        
        // Fetch loan details
        const loanResponse = await dashboardApi.getLoanById(loanId);
        setLoan(loanResponse);
        
        // Fetch loan payment history
        const paymentsResponse = await dashboardApi.getLoanPayments(loanId);
        setLoanPayments(paymentsResponse.payments || []);
      } catch (error) {
        console.error("Error fetching loan details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoanData();
  }, [loanId]);

  if (loading) {
    return <div>Loading loan details...</div>;
  }

  if (!loan) {
    return <div>Loan not found</div>;
  }

  // Calculate repayment progress
  const totalAmountWithInterest = loan.total_amount_with_interest || loan.amount;
  const totalPaid = loan.total_paid || 0;
  const repaymentProgress = totalAmountWithInterest > 0
    ? (totalPaid / totalAmountWithInterest) * 100
    : 0;
    
  // Count auto-debit payments
  const autoDebitPayments = loanPayments.filter(p => p.payment_method === 'auto-debit');
  const hasAutoDebitPayments = autoDebitPayments.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Loan Details</CardTitle>
            <Badge
              variant={
                loan.status === 'approved' ? 'default' :
                loan.status === 'pending' ? 'outline' :
                loan.status === 'paid' ? 'secondary' : 'destructive'
              }
            >
              {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Loan Amount</p>
              <p className="text-lg font-semibold">₱{loan.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining Balance</p>
              <p className="text-lg font-semibold">
                ₱{(totalAmountWithInterest - totalPaid).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">Repayment Progress</p>
            <Progress value={repaymentProgress} className="h-2" />
            <p className="text-xs text-right mt-1">
              {repaymentProgress.toFixed(0)}% Complete
            </p>
          </div>
          
          {/* Interest information */}
          {loan.interest_rate > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Interest Rate</p>
                <p>{loan.interest_rate}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total with Interest</p>
                <p>₱{totalAmountWithInterest.toLocaleString()}</p>
              </div>
            </div>
          )}
          
          {/* Payment breakdown */}
          {totalPaid > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Principal Paid</p>
                <p>₱{(loan.principal_paid || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Interest Paid</p>
                <p>₱{(loan.interest_paid || 0).toLocaleString()}</p>
              </div>
            </div>
          )}
          
          {/* Auto-debit information */}
          {hasAutoDebitPayments && (
            <Alert variant="default" className="mt-2 bg-blue-50 text-blue-800 border-blue-200">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                This loan has {autoDebitPayments.length} automatic payment(s) from transactions.
              </AlertDescription>
            </Alert>
          )}
          
          <div>
            <p className="text-sm text-muted-foreground">Purpose</p>
            <p>{loan.purpose}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Request Date</p>
              <p>{format(new Date(loan.requestDate || loan.created_at || loan.createdAt), "MMM d, yyyy")}</p>
            </div>
            {loan.approvalDate && (
              <div>
                <p className="text-sm text-muted-foreground">Approval Date</p>
                <p>{format(new Date(loan.approvalDate), "MMM d, yyyy")}</p>
              </div>
            )}
          </div>
          
          {loan.lastPaymentDate && (
            <div>
              <p className="text-sm text-muted-foreground">Last Payment</p>
              <p>{format(new Date(loan.lastPaymentDate), "MMM d, yyyy")}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Duration: {loan.durationMonths || loan.duration || 1} months
          </p>
        </CardFooter>
      </Card>
      
      <LoanPaymentHistory loanId={loanId} />
    </div>
  );
}