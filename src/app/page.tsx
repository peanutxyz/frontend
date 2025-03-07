// src/app/page.tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Image from "next/image";

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated() && user) {
      router.push(`/dashboard/${user.role}`);
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-full max-w-6xl mx-auto px-4 py-8 flex flex-col items-center">
        {/* Single Centered Logo */}
        <div className="w-40 h-40 md:w-48 md:h-48 mb-8 relative">
          <Image 
            src="/bangbangan-logo.png" 
            alt="Bangbangan Copra Trading Logo" 
            layout="fill" 
            objectFit="contain"
            priority
          />
        </div>
        
        {/* Main Heading */}
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-slate-800 text-center mb-4">
          Bangbangan Copra Trading
        </h1>
        
        {/* Subheading */}
        <p className="mx-auto max-w-xl text-slate-600 text-lg md:text-xl text-center mb-8">
          Procurement Management System with Customer Credit Assessment
        </p>
        
        {/* Get Started Button */}
        <Link href="/auth/login">
          <Button 
            size="lg" 
            className="bg-amber-800 hover:bg-amber-900 text-white px-8 py-6 text-lg rounded-lg transition-all hover:shadow-md"
          >
            Get Started
          </Button>
        </Link>
        
        {/* Login Link - Small text for alternate login */}
        <div className="mt-4">
          <Link href="/auth/login" className="text-slate-500 hover:text-slate-700 text-sm">
            Login
          </Link>
        </div>

        {/* Features Section */}
        <div className="w-full mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-2 text-slate-800">Supplier Management</h3>
            <p className="text-slate-600 text-sm">Track and manage suppliers, transactions, and inventory efficiently.</p>
          </div>
          
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-2 text-slate-800">Credit Assessment</h3>
            <p className="text-slate-600 text-sm">Evaluate and monitor customer credit scores and loan histories.</p>
          </div>
          
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-2 text-slate-800">Transaction Tracking</h3>
            <p className="text-slate-600 text-sm">Record and manage all copra trading transactions seamlessly.</p>
          </div>
        </div>
      </div>
      
      {/* Simple Footer */}
      <div className="w-full py-6 mt-auto">
        <p className="text-center text-slate-400 text-sm">
          © {new Date().getFullYear()} Bangbangan Copra Trading. All rights reserved.
        </p>
      </div>
    </div>
  );
}