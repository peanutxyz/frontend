// src/app/dashboard/admin/transactions/new/page.tsx

"use client";

import { useHydratedAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { NewTransactionForm } from "@/components/dashboard/NewTransactionForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewTransactionPage() {
  const { auth, isHydrated } = useHydratedAuth();
  const router = useRouter();
  const user = auth?.user;

  // Role-based access control
  useEffect(() => {
    if (isHydrated) {
      // Redirect if not logged in
      if (!auth.token) {
        router.push('/auth/login');
        return;
      }
      
      // Redirect if not admin or owner
      if (user?.role !== 'admin' && user?.role !== 'owner') {
        router.push(`/dashboard/${user?.role || ''}`);
      }
    }
  }, [isHydrated, auth, user, router]);

  // Handle successful transaction creation
  const handleSuccess = () => {
    router.push('/dashboard/admin/transactions');
  };

  if (!isHydrated || !user || (user.role !== 'admin' && user.role !== 'owner')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin/transactions">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create Transaction</h1>
      </div>
      <NewTransactionForm onSuccess={handleSuccess} />
    </div>
  );
}