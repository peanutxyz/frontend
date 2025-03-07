// src/components/dashboard/CreditScoreAnalytics.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dashboardApi, analyticsApi } from "@/lib/api";
import { useHydratedAuth } from "@/lib/auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function CreditScoreAnalytics() {
  const [creditData, setCreditData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scoreHistory, setScoreHistory] = useState([]);
  const { auth } = useHydratedAuth();

  useEffect(() => {
    const fetchCreditData = async () => {
      try {
        setIsLoading(true);
        if (!auth.user?.id) {
          return;
        }
   
        const supplier = await dashboardApi.getSupplierByUser(auth.user.id);
       
        if (supplier) {
          // Fetch credit score
          const creditScoreResponse = await dashboardApi.getCreditScore(supplier._id);
         
          if (creditScoreResponse) {
            // Create a default breakdown if it doesn't exist
            const defaultBreakdown = {
              paymentHistory: { score: 30, weight: 0.4 },
              transactionHistory: { score: 30, weight: 0.3 },
              relationshipScore: { score: 30, weight: 0.2 },
              marketFactors: { score: 30, weight: 0.1 }
            };
   
            const score = creditScoreResponse.score || 0;
            // Ensure we use the eligible_amount from the API response
            const limit = creditScoreResponse.eligible_amount || 0;
           
            setCreditData({
              currentScore: score,
              breakdown: defaultBreakdown, 
              category: getScoreCategory(score),
              limit: limit  // Use the actual eligible amount instead of calculating it
            });
          }
        }
      } catch (error) {
        console.error("Error fetching credit data:", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchCreditData();
  }, [auth.user?.id]);

  const getScoreCategory = (score: number) => {
    if (score <= 40) return "Fair";
    if (score <= 60) return "Good";
    if (score <= 75) return "Excellent";
    return "Excellent";
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Poor": return "text-red-500";
      case "Fair": return "text-yellow-500";
      case "Good": return "text-blue-500";
      case "Excellent": return "text-green-500";
      default: return "text-gray-500";
    }
  };

  const calculateCreditLimit = (score: number) => {
    if (score <= 40) return 5000;
    if (score <= 70) return 15000;
    return 30000;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!creditData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            No credit data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const breakdownData = [
    { name: "Payment History", score: creditData.breakdown.paymentHistory.score, weight: creditData.breakdown.paymentHistory.weight * 100 },
    { name: "Transaction History", score: creditData.breakdown.transactionHistory.score, weight: creditData.breakdown.transactionHistory.weight * 100 },
    { name: "Relationship", score: creditData.breakdown.relationshipScore.score, weight: creditData.breakdown.relationshipScore.weight * 100 },
    { name: "Market Factors", score: creditData.breakdown.marketFactors.score, weight: creditData.breakdown.marketFactors.weight * 100 }
  ];

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Score Overview</TabsTrigger>
        <TabsTrigger value="history">Score History</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <Card>
          <CardHeader>
            <CardTitle>Credit Score Assessment</CardTitle>
            <CardDescription>
              Your credit score determines your borrowing capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32">
                    <circle
                      className="text-gray-200"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                      r="55"
                      cx="64"
                      cy="64"
                    />
                    <circle
                      className={`${
                        creditData.category === "Excellent"
                          ? "text-green-500"
                          : creditData.category === "Good"
                          ? "text-blue-500"
                          : creditData.category === "Fair"
                          ? "text-yellow-500"
                          : "text-red-500"
                      }`}
                      strokeWidth="10"
                      strokeDasharray={`${(creditData.currentScore / 100) * 345}, 345`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="55"
                      cx="64"
                      cy="64"
                      transform="rotate(-90 64 64)"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{creditData.currentScore}</span>
                    <span className={`text-sm font-medium ${getCategoryColor(creditData.category)}`}>
                      {creditData.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-slate-50 rounded-md">
                  <p className="text-sm text-gray-500">Loan Limit</p>
                  <p className="text-2xl font-bold">₱{creditData.limit.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-md">
                  <p className="text-sm text-gray-500">Credit Category</p>
                  <p className={`text-2xl font-bold ${getCategoryColor(creditData.category)}`}>
                    {creditData.category}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Score Breakdown</h3>
                
                {breakdownData.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="font-medium">{item.score}/100 ({item.weight}%)</span>
                    </div>
                    <Progress value={item.score} />
                  </div>
                ))}
              </div>

              <div className="text-sm text-gray-500 space-y-2">
                <p><strong>Payment History (40%):</strong> Reflects your past payment behavior with loans.</p>
                <p><strong>Transaction History (30%):</strong> Based on your transaction volume and consistency.</p>
                <p><strong>Relationship Score (20%):</strong> Considers the length and depth of your business relationship.</p>
                <p><strong>Market Factors (10%):</strong> Adjusts based on seasonal performance and market conditions.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="history">
        <Card>
          <CardHeader>
            <CardTitle>Credit Score History</CardTitle>
            <CardDescription>
              View your credit score changes over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scoreHistory.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={scoreHistory}
                    margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`;
                      }}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value) => [`${value}`, 'Credit Score']}
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return date.toLocaleDateString();
                      }}
                    />
                    <Legend />
                    <Bar dataKey="score" fill="#4f46e5" name="Credit Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No historical data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}