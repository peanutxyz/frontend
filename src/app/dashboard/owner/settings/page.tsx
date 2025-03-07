// src/app/dashboard/owner/settings/page.tsx
"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ProfileSettings from "@/components/owner/settings/ProfileSettings";
import AccountSettings from "@/components/owner/settings/AccountSettings";
import AppearanceSettings from "@/components/owner/settings/AppearanceSettings";
import NotificationSettings from "@/components/owner/settings/NotificationSettings";
import SecuritySettings from "@/components/owner/settings/SecuritySettings";
import { useProtectedRoute } from "@/lib/auth";

export default function OwnerSettingsPage() {
  // Protect this route for owner only
  useProtectedRoute(['owner']);
  
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