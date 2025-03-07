// src/app/dashboard/supplier/transactions/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useHydratedAuth } from "@/lib/auth";
import { dashboardApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, TrendingUp, Clock } from "lucide-react";

// Import your actual implementation of TransactionsList component
import TransactionListPage from "@/components/dashboard/TransactionsList";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { auth } = useHydratedAuth();

  // Fix the useEffect dependency issue with a stable reference
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Use the specific endpoint for supplier transactions
      const response = await dashboardApi.getSupplierTransactions();
      console.log("Supplier transactions response:", response);
      
      setTransactions(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Error fetching supplier transactions:", error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Use separate useEffect with no dependencies to run once on mount
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  console.log("Final transactions state:", transactions);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hello!</h1>
        <p className="text-muted-foreground">
          View your transaction history and manage your deliveries
        </p>
      </div>

      {transactions.length > 0 ? (
        // If you have transactions, pass them to your TransactionsList component
        <TransactionListPage role="supplier" initialTransactions={transactions} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>No Transactions Yet</CardTitle>
              <CardDescription>
                You haven't made any transactions yet. Visit our location to sell your copra.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">Our Location</h3>
                  <p className="text-sm text-muted-foreground">
                    Bangbangan Copra Trading Center<br />
                    Purok 2, Beriran, Gubat, Sorsogon
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">Business Hours</h3>
                  <p className="text-sm text-muted-foreground">
                    Monday to Saturday: 8:00 AM - 8:00 PM<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">Best Days to Sell</h3>
                  <p className="text-sm text-muted-foreground">
                    Every Day is Perfect!
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">Build Your Credit Score</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete transactions to increase your credit score and unlock loan benefits.
                  </p>
                </div>
              </div>
              
              <Button className="w-full">
                Contact Us
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Why Sell With Us?</CardTitle>
              <CardDescription>
                Benefits of selling your copra at Bangbangan Copra Trading
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-md p-3">
                <h3 className="font-medium">Competitive Pricing</h3>
                <p className="text-sm text-muted-foreground">
                  We offer market-leading prices for quality copra
                </p>
              </div>
              
              <div className="border rounded-md p-3">
                <h3 className="font-medium">Fast Payment</h3>
                <p className="text-sm text-muted-foreground">
                  Get paid immediately upon delivery and quality inspection
                </p>
              </div>
              
              <div className="border rounded-md p-3">
                <h3 className="font-medium">Access to Credit</h3>
                <p className="text-sm text-muted-foreground">
                  Regular sellers can qualify for loans and cash advances
                </p>
              </div>
              
              <div className="border rounded-md p-3">
                <h3 className="font-medium">Technical Support</h3>
                <p className="text-sm text-muted-foreground">
                  Get advice on improving copra quality and production
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}