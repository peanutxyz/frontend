// src/components/dashboard/CreditScoreCard.tsx

"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { dashboardApi } from "@/lib/api"
import { creditScoreUtils } from "@/lib/utils"
import { Info, RefreshCw } from "lucide-react"

interface CreditScoreCardProps {
  supplierId: string;
}

export default function CreditScoreCard({ supplierId }: CreditScoreCardProps) {
  const [creditInfo, setCreditInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const fetchCreditInfo = async () => {
    try {
      setLoading(true);
      console.log("Fetching credit score for supplier:", supplierId);
      const response = await dashboardApi.getDetailedCreditScore(supplierId);
      console.log("Credit score response:", response);
      setCreditInfo(response);
      setLastUpdated(new Date());
      setError(null);
    } catch (error: any) {
      console.error("Error fetching credit information:", error);
      setError(error.response?.data?.message || "Failed to load credit information");
    } finally {
      setLoading(false);
    }
  };

  // Add a manual recalculation function
  const recalculateScore = async () => {
    try {
      setRefreshing(true);
      console.log("Manually recalculating credit score for supplier:", supplierId);
      
      // Call your new recalculation endpoint
      const response = await dashboardApi.recalculateCreditScore(supplierId);
      console.log("Recalculation response:", response);
      
      setCreditInfo(response);
      setLastUpdated(new Date());
      setError(null);
    } catch (error: any) {
      console.error("Error recalculating credit score:", error);
      setError(error.response?.data?.message || "Failed to recalculate credit score");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCreditInfo();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchCreditInfo, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [supplierId]);

  if (loading && !creditInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Score</CardTitle>
          <CardDescription>Loading credit information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error && !creditInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Score</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={fetchCreditInfo} 
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // No transaction history yet
  if (!creditInfo || creditInfo.score === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Score</CardTitle>
          <CardDescription>
            No credit score available yet. Complete transactions to build your credit score.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={recalculateScore} 
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Extract credit info variables
  const {
    score,
    transaction_consistency,
    total_supply_score,
    transaction_count_score,
    eligible_amount,
    average_transaction,
    credit_percentage,
    transaction_count
  } = creditInfo;

  // Get score category and color
  const category = creditScoreUtils.getScoreCategory(score);
  const colorClass = creditScoreUtils.getCategoryColor(category);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <div>
            <CardTitle>Credit Score: {score}</CardTitle>
            <CardDescription>Based on transaction history</CardDescription>
          </div>
          <div className="text-right flex items-center">
            <span className={`text-lg font-bold ${colorClass}`}>{category}</span>
            <Button
              size="sm"
              variant="ghost"
              className="ml-2 h-8 w-8 p-0"
              onClick={recalculateScore}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Transaction count indicator */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Transaction Count</span>
            <span className="text-sm">{creditInfo.transaction_count || 0}</span>
          </div>
          {creditInfo.transaction_count === 0 && (
            <Alert variant="default" className="mt-2 bg-yellow-50 text-yellow-800 border-yellow-200">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Complete at least one transaction to become eligible for loans
              </AlertDescription>
            </Alert>
          )}
        </div>
   
        {transaction_count > 0 && (
          <>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Transaction Consistency</span>
                <span className="text-sm font-medium">{transaction_consistency}%</span>
              </div>
              <Progress value={transaction_consistency} className="h-2" />
            </div>
           
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Total Supply Score</span>
                <span className="text-sm font-medium">{total_supply_score}%</span>
              </div>
              <Progress value={total_supply_score} className="h-2" />
            </div>
           
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Transaction Count Score</span>
                <span className="text-sm font-medium">{transaction_count_score}%</span>
              </div>
              <Progress value={transaction_count_score} className="h-2" />
            </div>
           
            <div className="pt-4 space-y-2">
  <div className="flex justify-between">
    <span>Eligible Loan Amount:</span>
    <span className="font-medium">₱{(eligible_amount || 0).toLocaleString()}</span>
  </div>
  {average_transaction > 0 && (
    <div className="flex justify-between">
      <span>Transaction Average:</span>
      <span>₱{average_transaction.toLocaleString()}</span>
    </div>
  )}
  <div className="flex justify-between">
    <span>Credit Percentage:</span>
    <span>{((credit_percentage || 0) * 100).toFixed(0)}%</span>
  </div>
</div>
          </>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </CardFooter>
    </Card>
  );
}