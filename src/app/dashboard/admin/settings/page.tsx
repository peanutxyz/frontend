// src/app/dashboard/admin/settings/page.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ProfileSettings from "@/components/admin/settings/ProfileSettings";
import AccountSettings from "@/components/admin/settings/AccountSettings";
import AppearanceSettings from "@/components/admin/settings/AppearanceSettings";
import NotificationSettings from "@/components/admin/settings/NotificationSettings";
import SecuritySettings from "@/components/admin/settings/SecuritySettings";
import { useProtectedRoute } from "@/lib/auth";

export default function AdminSettingsPage() {
  // Protect this route for admin only
  useProtectedRoute(['admin']);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <Card className="p-6">
          <TabsContent value="profile">
            <ProfileSettings />
          </TabsContent>
          
          <TabsContent value="account">
            <AccountSettings />
          </TabsContent>
          
          <TabsContent value="appearance">
            <AppearanceSettings />
          </TabsContent>
          
          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>
          
          <TabsContent value="security">
            <SecuritySettings />
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
}