// src/components/admin/settings/SecuritySettings.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { dashboardApi } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge"
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string().min(1, { message: "Confirm password is required" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function SecuritySettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [recentLogins, setRecentLogins] = useState([
    { date: "2025-03-06T13:45:22", device: "Chrome on Windows", location: "Manila, Philippines", ip: "192.168.1.1" },
    { date: "2025-03-05T10:12:05", device: "Safari on MacOS", location: "Cebu City, Philippines", ip: "192.168.1.2" },
  ]);
  
  const form = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof passwordFormSchema>) => {
    try {
      setIsLoading(true);
      await dashboardApi.changePassword(data);
      form.reset();
      toast.success("Password changed successfully");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password. Please check your current password.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Security Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account security and access settings.
        </p>
      </div>
      
      <div className="space-y-4">
        <h4 className="text-base font-medium">Change Password</h4>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Enter your current password" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Enter your new password" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Confirm your new password" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Password
            </Button>
          </form>
        </Form>
        
        <Alert className="bg-blue-50 text-blue-800 border-blue-200 mt-4">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Password Tips</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 text-sm mt-2 space-y-1">
              <li>Use at least 8 characters with a mix of letters, numbers, and symbols</li>
              <li>Avoid using personal information or common words</li>
              <li>Use different passwords for different accounts</li>
              <li>Change your password regularly</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
      
      <div className="pt-6 border-t">
        <h4 className="text-base font-medium mb-4">Session Management</h4>
        
        <div className="space-y-4">
          <div className="mb-2">
            <h5 className="text-sm font-medium">Recent Login Activity</h5>
            <p className="text-sm text-muted-foreground">
              Review your recent login activity to ensure account security.
            </p>
          </div>
          
          <div className="space-y-4">
            {recentLogins.map((login, index) => (
              <div key={index} className="p-4 border rounded-md">
                <div className="flex justify-between">
                  <div className="font-medium">{login.device}</div>
                  <div className="text-sm text-muted-foreground">{formatDateTime(login.date)}</div>
                </div>
                <div className="flex justify-between mt-1 text-sm">
                  <div>{login.location}</div>
                  <div>IP: {login.ip}</div>
                </div>
              </div>
            ))}
          </div>
          
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Active Sessions</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              <span>You currently have 1 active session on this device.</span>
              <Button variant="destructive" size="sm">
                Log Out All Devices
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
      
      <div className="pt-6 border-t">
        <h4 className="text-base font-medium mb-4">Login Methods</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <h5 className="font-medium">Email & Password</h5>
              <p className="text-sm text-muted-foreground">
                Primary login method
              </p>
            </div>
            <div>
              <Badge variant="secondary">Default</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}