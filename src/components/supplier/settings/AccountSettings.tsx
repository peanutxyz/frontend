// src/components/supplier/settings/AccountSettings.tsx

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { dashboardApi } from "@/lib/api";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define a local interface for User to avoid import issues
interface User {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  emailVerified?: boolean;
}

export default function AccountSettings() {
  const auth = useAuth() as any; // Use type assertion to bypass type checking
  const user = auth.user as User | null;
  
  const [autoLogout, setAutoLogout] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Set emailVerified from user when component mounts or user changes
    if (user) {
      // Use optional chaining to safely access properties
      setEmailVerified(!!user.emailVerified);
    }
  }, [user]);

  const handleAutoLogoutToggle = async (checked: boolean) => {
    setAutoLogout(checked);
    toast.success(`Auto logout ${checked ? 'enabled' : 'disabled'}`);
  };

  const handleTwoFactorToggle = async (checked: boolean) => {
    setTwoFactorEnabled(checked);
    toast.success(`Two-factor authentication ${checked ? 'enabled' : 'disabled'}`);
  };

  const handleVerifyEmail = async () => {
    try {
      setIsLoading(true);
      await dashboardApi.sendVerificationEmail();
      toast.success("Verification email sent. Please check your inbox.");
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast.error("Failed to send verification email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Account Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account preferences and security options.
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="auto-logout">Auto Logout After Inactivity</Label>
            <p className="text-sm text-muted-foreground">
              Automatically log out after 30 minutes of inactivity
            </p>
          </div>
          <Switch
            id="auto-logout"
            checked={autoLogout}
            onCheckedChange={handleAutoLogoutToggle}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="two-factor">Two-Factor Authentication</Label>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account
            </p>
          </div>
          <Switch
            id="two-factor"
            checked={twoFactorEnabled}
            onCheckedChange={handleTwoFactorToggle}
          />
        </div>
      </div>
      <div className="pt-4 border-t">
        <h4 className="text-base font-medium mb-4">Email Verification</h4>
       
        {emailVerified ? (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <AlertCircle className="h-4 w-4 text-green-800" />
            <AlertTitle>Email Verified</AlertTitle>
            <AlertDescription>
              Your email address has been verified.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-800" />
              <AlertTitle>Email Not Verified</AlertTitle>
              <AlertDescription>
                Please verify your email address to unlock all account features.
              </AlertDescription>
            </Alert>
           
            <Button
              variant="outline"
              onClick={handleVerifyEmail}
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Verify Email"}
            </Button>
          </div>
        )}
      </div>
      <div className="pt-4 border-t">
        <h4 className="text-base font-medium mb-4">Connected Accounts</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your account with other services
        </p>
       
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Connect Google
          </Button>
         
          <Button variant="outline" className="w-full justify-start">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Connect GitHub
          </Button>
        </div>
      </div>
    </div>
  );
}