// src/components/supplier/LoansList.tsx

"use client";

import { useState, useEffect } from "react";
import { dashboardApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle, CheckCircle, Clock, XCircle, Info } from "lucide-react";
import { useHydratedAuth } from "@/lib/auth";

interface Loan {
  _id: string;
  amount: number;
  interest_rate: number;
  total_amount_with_interest: number;
  total_paid: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  start_date: string;
  due_date: string;
  purpose: string;
  createdAt: string;
}

export function LoansList() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const { auth } = useHydratedAuth();

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      
      // First, get the supplier ID for the current user
      if (!auth.user?.id) {
        toast.error("User not authenticated");
        return;
      }
      
      const supplier = await dashboardApi.getSupplierByUser(auth.user.id);
      
      if (!supplier) {
        console.error("Supplier not found for current user");
        return;
      }
      
      // Then fetch loans for this supplier
      const loansResponse = await dashboardApi.getLoans({ supplier: supplier._id });
      
      console.log("Loans response:", loansResponse);
      
      let loansData = [];
      if (loansResponse && loansResponse.data) {
        loansData = loansResponse.data;
      } else if (Array.isArray(loansResponse)) {
        loansData = loansResponse;
      }
      
      setLoans(loansData);
    } catch (error) {
      console.error("Error fetching loans:", error);
      toast.error("Failed to load loans");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      case 'paid':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><CheckCircle className="h-3 w-3 mr-1" /> Paid</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRemainingAmount = (loan: Loan) => {
    return loan.total_amount_with_interest - (loan.total_paid || 0);
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : loans.length > 0 ? (
          <div className="space-y-6">
            {loans.map(loan => (
              <Card key={loan._id} className="overflow-hidden">
                <div className="border-l-4 border-l-primary">
                  <div className="p-4 flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">
                        {formatCurrency(loan.amount)} Loan 
                        <span className="ml-2">
                          {getStatusBadge(loan.status)}
                        </span>
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Requested on {formatDate(loan.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {loan.status === 'approved' || loan.status === 'paid' ? (
                          formatCurrency(getRemainingAmount(loan))
                        ) : (
                          formatCurrency(loan.total_amount_with_interest)
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {loan.status === 'approved' && getRemainingAmount(loan) > 0 && (
                          <>Due in {getDaysUntilDue(loan.due_date)} days</>
                        )}
                        {loan.status === 'pending' && (
                          <>Awaiting approval</>
                        )}
                        {loan.status === 'rejected' && (
                          <>Request declined</>
                        )}
                        {loan.status === 'paid' && (
                          <>Fully paid</>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">PURPOSE</div>
                      <div className="mt-1">{loan.purpose}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">INTEREST RATE</div>
                      <div className="mt-1">{loan.interest_rate}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">DUE DATE</div>
                      <div className="mt-1">{formatDate(loan.due_date)}</div>
                    </div>
                  </div>
                  
                  {loan.status === 'approved' && (
                    <div className="bg-white p-4 border-t">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-sm">
                          <Info className="h-4 w-4 mr-1 text-blue-500" />
                          <span>Repayment Progress</span>
                        </div>
                        <div className="text-right text-sm">
                          {formatCurrency(loan.total_paid || 0)} of {formatCurrency(loan.total_amount_with_interest)} 
                          ({Math.round(((loan.total_paid || 0) / loan.total_amount_with_interest) * 100)}%)
                        </div>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, Math.round(((loan.total_paid || 0) / loan.total_amount_with_interest) * 100))}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="flex flex-col items-center">
              <AlertCircle className="h-8 w-8 mb-2 text-gray-400" />
              <h3 className="text-lg font-medium">No Loans Found</h3>
              <p className="mt-1">You haven't requested any loans yet.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}