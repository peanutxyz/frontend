// src/components/suppliers/LoanRequestForm.tsx

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { dashboardApi } from "@/lib/api";
import { useHydratedAuth } from "@/lib/auth";
import { creditScoreUtils } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, AlertCircle, Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Define types for transactions and credit data
interface Transaction {
  total_amount?: number;
  totalAmount?: number;
  amount?: number;
  [key: string]: any;
}

interface CreditData {
  score: number;
  isEligible: boolean;
  category: string;
  color: string;
  limit: number;
  transactionConsistency: number;
  totalSupplyScore: number;
  transactionCountScore: number;
  supplierId?: string;
  averageTransaction: number;
  transactionCount: number;
  creditPercentage: number;
}

const formSchema = z.object({
  amount: z.coerce
    .number(),
  purpose: z.string({
    required_error: "Please select a loan purpose"
  }).min(1, "Please select a loan purpose"),
  purposeDetails: z.string().optional()
});

const loanPurposes = [
  { value: "business_expense", label: "Business Expense" },
  { value: "debt_consolidation", label: "Debt Consolidation" },
  { value: "emergency", label: "Emergency" },
  { value: "medical", label: "Medical" },
  { value: "educational", label: "Educational" },
  { value: "travel", label: "Travel" },
  { value: "special_occasion", label: "Special Occasion" },
  { value: "general_expenses", label: "General Expenses / Other" },
  { value: "pay_bills", label: "Pay Bills" }
];

interface LoanRequestFormProps {
  onSuccess: () => void;
}

export function LoanRequestForm({ onSuccess }: LoanRequestFormProps) {
  const { auth: authState, isHydrated } = useHydratedAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [creditData, setCreditData] = useState<CreditData | null>(null);
  const [supplierId, setSupplierId] = useState<string | null>(null);
 
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      purpose: "",
      purposeDetails: ""
    },
  });

  // Function to calculate credit percentage - fixed at 40%
  // No longer depends on credit score at all
  const calculateCreditPercentage = (): number => {
    return 0.40; // Fixed 40% credit percentage for all suppliers with transactions
  };

  // Check credit score after hydration completes
  useEffect(() => {
    if (!isHydrated) {
      return;
    }
   
    const checkCreditScore = async () => {
      try {
        setChecking(true);
       
        // Get supplier stats
        const supplierStatsResponse = await dashboardApi.getSupplierStats();
        console.log("Full supplier stats response:", supplierStatsResponse);
       
        // Save raw data for debugging
        localStorage.setItem('debugSupplierStats', JSON.stringify(supplierStatsResponse?.data || {}));
       
        // Check for supplier ID in various places
        let foundSupplierId: string | null = null;
       
        if (supplierStatsResponse?.data?.supplierInfo?.id) {
          foundSupplierId = supplierStatsResponse.data.supplierInfo.id;
        } else if (supplierStatsResponse?.data?.supplierInfo?._id) {
          foundSupplierId = supplierStatsResponse.data.supplierInfo._id;
        } else if (supplierStatsResponse?.data?.supplier?.id) {
          foundSupplierId = supplierStatsResponse.data.supplier.id;
        } else if (supplierStatsResponse?.data?.supplier?._id) {
          foundSupplierId = supplierStatsResponse.data.supplier._id;
        } else if (supplierStatsResponse?.data?._id) {
          foundSupplierId = supplierStatsResponse.data._id;
        }
       
        // Set the supplier ID if found
        if (foundSupplierId) {
          setSupplierId(foundSupplierId);
          console.log("Set supplier ID to:", foundSupplierId);
        }
       
        // Process credit info if available
        const creditInfo = supplierStatsResponse?.data?.creditInfo;
        if (creditInfo) {
          const score = creditInfo.score;
          
          // Try to get transactions from response
          let transactions = [];
          if (supplierStatsResponse?.data?.transactions?.length > 0) {
            transactions = supplierStatsResponse.data.transactions;
            console.log("Found transactions:", transactions.length);
          } else {
            // Try fallback using direct API call
            try {
              const transactionsResponse = await dashboardApi.getSupplierTransactions();
              if (transactionsResponse && transactionsResponse.length > 0) {
                transactions = transactionsResponse;
              }
            } catch (e) {
              console.error("Error fetching transactions:", e);
            }
          }
          
          // Get transaction count FIRST - critical for eligibility
          const transactionCount = transactions.length || creditInfo.transaction_count || 0;
          console.log("Final transaction count:", transactionCount);
          
          // Fixed credit percentage at 40%
          const creditPercentage = 0.40;
          
          // Calculate average transaction and eligible amount
          let averageTransaction = creditInfo.average_transaction || 0;
          let eligibleAmount = 0;
          
          if (transactions.length > 0) {
            // Calculate total from transactions
            const totalAmount = transactions.reduce((sum: number, t: Transaction) => {
              return sum + (t.total_amount || t.totalAmount || t.amount || 0);
            }, 0);
            
            averageTransaction = totalAmount / transactions.length;
            
            // Calculate loan amount using fixed 40% credit percentage
            eligibleAmount = Math.round(averageTransaction * 0.40);
            console.log("Calculated from transactions:", eligibleAmount);
          } else if (creditInfo.average_transaction) {
            averageTransaction = creditInfo.average_transaction;
            eligibleAmount = Math.round(averageTransaction * 0.40);
          }
         
          // Force calculation if still not determined
          if (eligibleAmount <= 0 && averageTransaction > 0) {
            eligibleAmount = Math.round(averageTransaction * 0.40);
          }
         
          // Determine credit score category and color
          const category = creditScoreUtils.getScoreCategory(score);
          const color = creditScoreUtils.getCategoryColor(category);
         
          // Set credit data - eligibility is ONLY based on having transactions
          setCreditData({
            score,
            isEligible: transactionCount > 0, // Only care if there are transactions
            category,
            color,
            limit: eligibleAmount,
            transactionConsistency: creditInfo.transaction_consistency || 0,
            totalSupplyScore: creditInfo.total_supply_score || 0,
            transactionCountScore: creditInfo.transaction_count_score || 0,
            supplierId: foundSupplierId || undefined,
            averageTransaction,
            transactionCount,
            creditPercentage: 0.40
          });
         
          setChecking(false);
          return;
        }
       
        // Fallback using user ID if credit info not available
        let userId = authState.user?.id;
       
        if (!userId && typeof window !== 'undefined') {
          try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              userId = parsedUser.id;
            }
          } catch (e) {
            console.error("Failed to parse user from localStorage", e);
          }
        }
       
        if (!userId) {
          setCreditData({
            score: 0,
            isEligible: false, // No transactions, not eligible
            category: "No Score",
            color: "text-gray-500",
            limit: 0,
            transactionConsistency: 0,
            totalSupplyScore: 0,
            transactionCountScore: 0,
            averageTransaction: 0,
            transactionCount: 0,
            creditPercentage: 0.40
          });
          setChecking(false);
          return;
        }
       
        // Get supplier by user ID
        const supplier = await dashboardApi.getSupplierByUser(userId);
       
        if (!supplier) {
          setCreditData({
            score: 0,
            isEligible: false, // No supplier found, not eligible
            category: "No Score",
            color: "text-gray-500",
            limit: 0,
            transactionConsistency: 0,
            totalSupplyScore: 0,
            transactionCountScore: 0,
            averageTransaction: 0,
            transactionCount: 0,
            creditPercentage: 0.40
          });
          setChecking(false);
          return;
        }
       
        // Save supplier ID
        if (supplier._id) {
          setSupplierId(supplier._id);
        }
       
        // Fetch transactions for this supplier
        const supplierTransactions = await dashboardApi.getSupplierTransactions();
        let averageTransaction = 0;
        const transactionCount = supplierTransactions?.length || 0;
       
        if (supplierTransactions && supplierTransactions.length > 0) {
          const totalAmount = supplierTransactions.reduce((sum: number, t: Transaction) => {
            return sum + (t.total_amount || t.totalAmount || t.amount || 0);
          }, 0);
         
          averageTransaction = totalAmount / supplierTransactions.length;
        }
       
        // Get credit score
        const scoreData = await dashboardApi.getCreditScore(supplier._id);
       
        const score = scoreData.score || 20;
       
        // Fixed 40% credit percentage
        const creditPercentage = 0.40;
       
        // Calculate eligible amount
        let eligibleAmount = scoreData.eligible_amount;
        if (!eligibleAmount && averageTransaction > 0) {
          eligibleAmount = Math.round(averageTransaction * creditPercentage);
        }
       
        // Eligibility is only based on having transactions
        const isEligible = transactionCount > 0;
        
        const category = creditScoreUtils.getScoreCategory(score);
        const color = creditScoreUtils.getCategoryColor(category);
       
        setCreditData({
          score,
          isEligible,
          category,
          color,
          limit: eligibleAmount || 0,
          transactionConsistency: scoreData.transaction_consistency || 0,
          totalSupplyScore: scoreData.total_supply_score || 0,
          transactionCountScore: scoreData.transaction_count_score || 0,
          supplierId: supplier._id,
          averageTransaction,
          transactionCount,
          creditPercentage
        });
      } catch (error) {
        console.error("Error checking credit score:", error);
        setCreditData({
          score: 0,
          isEligible: false,
          category: "No Score",
          color: "text-gray-500",
          limit: 0,
          transactionConsistency: 0,
          totalSupplyScore: 0,
          transactionCountScore: 0,
          averageTransaction: 0,
          transactionCount: 0,
          creditPercentage: 0.40
        });
      } finally {
        setChecking(false);
      }
    };
   
    checkCreditScore();
  }, [isHydrated, authState]);

  // Helper function to get purpose label from value
  const getPurposeLabel = (purposeValue: string): string => {
    const purpose = loanPurposes.find(p => p.value === purposeValue);
    return purpose ? purpose.label : purposeValue;
  };

  // Set max amount
  const setMaxAmount = () => {
    const maxAmount = safeData.limit || 0;
    form.setValue("amount", maxAmount);
  };

  // Calculate due date (45 days from now)
  const calculateDueDate = (): string => {
    const date = new Date();
    date.setDate(date.getDate() + 45);
    return date.toISOString();
  };

  // Form submission handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!creditData?.isEligible) {
      toast.error("You need at least one completed transaction to be eligible for a loan");
      return;
    }
   
    setLoading(true);
   
    try {
      const effectiveSupplierId = supplierId || creditData.supplierId;
     
      if (!effectiveSupplierId) {
        toast.error("Could not find supplier information");
        setLoading(false);
        return;
      }
     
      // Format purpose text
      const purposeText = values.purpose === 'general_expenses' && values.purposeDetails
        ? `${getPurposeLabel(values.purpose)}: ${values.purposeDetails}`
        : getPurposeLabel(values.purpose);
      // Calculate a due date 45 days from now
      const dueDate = calculateDueDate();
     
      // Submit loan request with due date
      await dashboardApi.createLoan({
        supplier_id: effectiveSupplierId,
        amount: values.amount,
        purpose: purposeText,
        payment_percent: 100, // 100% deduction from next transaction
        due_date: dueDate // Add 45-day due date
      });
     
      toast.success("Loan request submitted successfully");
      onSuccess();
    } catch (error: any) {
      console.error("Loan creation error:", error);
      toast.error(error.response?.data?.message || "Failed to submit loan request");
    } finally {
      setLoading(false);
    }
  }

  // Loading state
  if (!isHydrated) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
        <span className="ml-2">Loading authentication...</span>
      </div>
    );
  }
 
  if (checking) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  // Use safe defaults if creditData is null
  const safeData = creditData || {
    score: 0,
    isEligible: false,
    category: "No Score",
    color: "text-gray-500",
    limit: 0,
    transactionConsistency: 0,
    totalSupplyScore: 0,
    transactionCountScore: 0,
    averageTransaction: 0,
    transactionCount: 0,
    creditPercentage: 0.40
  };
 
  // IMPORTANT: Debug what's happening with eligibility
  console.log("ELIGIBILITY DEBUG:", {
    isEligible: safeData.isEligible,
    transactionCount: safeData.transactionCount,
    creditPercentage: safeData.creditPercentage,
    limit: safeData.limit
  });
  
  // Main render
  return (
    <div className="space-y-6 w-full max-w-md mx-auto">
      {/* Credit Score Card */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Score: {creditData?.score || 0}</CardTitle>
          <CardDescription>Your credit eligibility is based only on having transaction history</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm sm:text-base">
          {/* Score components */}
          {creditData && creditData.transactionConsistency > 0 && (
            <>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Transaction Consistency</span>
                  <span className="text-sm font-medium">{creditData?.transactionConsistency ?? 0}%</span>
                </div>
                <Progress value={creditData?.transactionConsistency ?? 0} className="h-2" />
              </div>
             
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Total Supply Score</span>
                  <span className="text-sm font-medium">{creditData?.totalSupplyScore ?? 0}%</span>
                </div>
                <Progress value={creditData?.totalSupplyScore ?? 0} className="h-2" />
              </div>
             
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Transaction Count Score</span>
                  <span className="text-sm font-medium">{creditData?.transactionCountScore ?? 0}%</span>
                </div>
                <Progress value={creditData?.transactionCountScore ?? 0} className="h-2" />
              </div>
            </>
          )}
         
          <div className="pt-2 space-y-2 text-sm sm:text-base">
            <div className="flex justify-between">
              <span>Eligible Loan Amount:</span>
              <span className="font-medium">₱{(creditData?.limit ?? 0).toLocaleString()}</span>
            </div>
           
            {creditData && creditData.averageTransaction > 0 && (
              <div className="flex justify-between">
                <span>Transaction Average:</span>
                <span>₱{creditData?.averageTransaction?.toLocaleString() ?? "0"}</span>
              </div>
            )}
           
            <div className="flex justify-between">
              <span>Credit Status:</span>
              <span className={creditData?.color ?? "text-gray-500"}>
                {creditData?.category ?? "No Score"}
              </span>
            </div>
           
            <div className="flex justify-between">
              <span>Credit Percentage:</span>
              <span>40%</span>
            </div>
           
            {creditData && creditData.transactionCount > 0 && (
              <div className="flex justify-between">
                <span>Transaction Count:</span>
                <span>{creditData?.transactionCount ?? 0}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
     
      {/* Eligibility Alert */}
      {!safeData.isEligible ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not eligible for loans</AlertTitle>
          <AlertDescription>
            You need at least one completed transaction to be eligible for a loan. Your credit score does not affect eligibility.
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/dashboard/supplier/transactions'}
              >
                Go to Transactions
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>You're eligible for a loan</AlertTitle>
          <AlertDescription>
            <p>Fill out the form below to request a loan up to your current credit limit.</p>
            <p className="text-sm mt-2 text-amber-600">
              Note: Your loan will be automatically paid off from your next transaction(s). 100% of your future transaction amounts will be applied to your loan until fully paid.
            </p>
          </AlertDescription>
        </Alert>
      )}
     
      {/* Loan Request Form */}
      {safeData.isEligible ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Amount</FormLabel>
                  <div className="flex items-center gap-2 w-full">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                      <Input
                        className="pl-7 w-full"
                        value={field.value === 0 ? "" : field.value}
                        onChange={(e) => {
                          // Only allow numeric input
                          const rawValue = e.target.value.replace(/[^\d]/g, '');
                         
                          if (rawValue === "") {
                            field.onChange(0);
                          } else {
                            const value = parseInt(rawValue, 10);
                            if (!isNaN(value)) {
                              const limitedValue = Math.min(value, safeData.limit || 5000);
                              field.onChange(limitedValue);
                            }
                          }
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap"
                      onClick={setMaxAmount}
                    >
                      Max
                    </Button>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>Maximum: ₱{Number(safeData.limit || 5000).toLocaleString()}</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
           
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Purpose*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your loan purpose" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loanPurposes.map((purpose) => (
                        <SelectItem key={purpose.value} value={purpose.value}>
                          {purpose.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
           
            {/* Optional details field for General Expenses */}
            {form.watch("purpose") === "general_expenses" && (
              <FormField
                control={form.control}
                name="purposeDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide more details about your loan purpose"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
           
            {/* Repayment information */}
            <Alert variant="default" className="bg-muted/30">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <p className="font-medium">Repayment Information</p>
                <p className="mt-1">
                  Your next transaction(s) will be automatically applied to your outstanding loan balance.
                  100% of your transaction amount will go toward paying off your loan until it is fully paid.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Due Date: {new Date(calculateDueDate()).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'})} (45 days from today)
                </p>
              </AlertDescription>
            </Alert>
           
            <div className="flex justify-end">
              <Button type="submit" disabled={loading || !safeData.isEligible}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </form>
        </Form>
      ) : null}
    </div>
  );
}