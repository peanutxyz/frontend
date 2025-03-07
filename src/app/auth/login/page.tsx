// src/app/auth/login/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function LoginContent() {
  const router = useRouter();
  const setAuth = useAuth((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const response = await authApi.login(values.email, values.password);
      setAuth(response.token, response.user);
      toast.success("Login successful!");
     
      switch (response.user.role) {
        case 'admin':
          router.push('/dashboard/admin');
          break;
        case 'owner':
          router.push('/dashboard/owner');
          break;
        case 'supplier':
          router.push('/dashboard/supplier');
          break;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || "Login failed. Please try again.");
      form.setError("root", {
        message: "Invalid email or password",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <Card className="w-full max-w-md mx-auto shadow-md border border-slate-200">
        <div className="flex justify-center mt-6">
          <div className="w-24 h-24 relative">
            <Image 
              src="/bangbangan-logo.png" 
              alt="Bangbangan Copra Trading Logo" 
              layout="fill" 
              objectFit="contain"
              priority
            />
          </div>
        </div>
        
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-slate-800">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-slate-500">
            Bangbangan Copra Trading System
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your email"
                        {...field}
                        disabled={isLoading}
                        type="email"
                        autoComplete="email"
                        className="h-10 border-slate-200 focus:border-amber-500 focus:ring-amber-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          {...field}
                          disabled={isLoading}
                          autoComplete="current-password"
                          className="h-10 pr-10 border-slate-200 focus:border-amber-500 focus:ring-amber-500"
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.formState.errors.root && (
                <div className="text-sm text-red-500 text-center">
                  {form.formState.errors.root.message}
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full h-11 bg-amber-800 hover:bg-amber-900 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Logging in...</span>
                  </div>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-amber-800" />
      </div>
    );
  }
  
  return <LoginContent />;
}