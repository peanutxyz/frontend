// src/components/supplier/settings/AccountSettings.tsx

"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { dashboardApi } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function NotificationSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    notifyOnNewLoans: true,
    notifyOnNewTransactions: true,
    notifyOnStatusChanges: true,
    notifyOnSystemUpdates: false,
    frequency: "immediate"
  });

  const handleToggleChange = (key: keyof typeof notificationSettings) => (checked: boolean) => {
    setNotificationSettings({
      ...notificationSettings,
      [key]: checked
    });
  };

  const handleFrequencyChange = (value: string) => {
    setNotificationSettings({
      ...notificationSettings,
      frequency: value
    });
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      await dashboardApi.updateNotificationSettings(notificationSettings);
      toast.success("Notification settings saved successfully");
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error("Failed to save notification settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notification Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage how and when you receive notifications.
        </p>
      </div>
      
      <div className="space-y-4">
        <h4 className="text-base font-medium">Notification Channels</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch 
              id="email-notifications" 
              checked={notificationSettings.emailNotifications} 
              onCheckedChange={handleToggleChange("emailNotifications")} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications on your device
              </p>
            </div>
            <Switch 
              id="push-notifications" 
              checked={notificationSettings.pushNotifications} 
              onCheckedChange={handleToggleChange("pushNotifications")} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms-notifications">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via SMS
              </p>
            </div>
            <Switch 
              id="sms-notifications" 
              checked={notificationSettings.smsNotifications} 
              onCheckedChange={handleToggleChange("smsNotifications")} 
            />
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t space-y-4">
        <h4 className="text-base font-medium">Notification Types</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="new-loans">New Loan Requests</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new loan requests are submitted
              </p>
            </div>
            <Switch 
              id="new-loans" 
              checked={notificationSettings.notifyOnNewLoans} 
              onCheckedChange={handleToggleChange("notifyOnNewLoans")} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="new-transactions">New Transactions</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new transactions are created
              </p>
            </div>
            <Switch 
              id="new-transactions" 
              checked={notificationSettings.notifyOnNewTransactions} 
              onCheckedChange={handleToggleChange("notifyOnNewTransactions")} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="status-changes">Status Changes</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when the status of a loan or transaction changes
              </p>
            </div>
            <Switch 
              id="status-changes" 
              checked={notificationSettings.notifyOnStatusChanges} 
              onCheckedChange={handleToggleChange("notifyOnStatusChanges")} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="system-updates">System Updates</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about system updates and maintenance
              </p>
            </div>
            <Switch 
              id="system-updates" 
              checked={notificationSettings.notifyOnSystemUpdates} 
              onCheckedChange={handleToggleChange("notifyOnSystemUpdates")} 
            />
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t space-y-4">
        <h4 className="text-base font-medium">Notification Frequency</h4>
        
        <RadioGroup 
          value={notificationSettings.frequency} 
          onValueChange={handleFrequencyChange}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="immediate" id="immediate" />
            <Label htmlFor="immediate">Immediate</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="hourly" id="hourly" />
            <Label htmlFor="hourly">Hourly Digest</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="daily" id="daily" />
            <Label htmlFor="daily">Daily Digest</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="weekly" id="weekly" />
            <Label htmlFor="weekly">Weekly Digest</Label>
          </div>
        </RadioGroup>
        
        <p className="text-sm text-muted-foreground">
          Digest emails combine multiple notifications into a single email to reduce inbox clutter.
        </p>
      </div>
      
      <Button 
        onClick={saveSettings}
        disabled={isLoading}
        className="mt-6"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Notification Settings
      </Button>
    </div>
  );
}