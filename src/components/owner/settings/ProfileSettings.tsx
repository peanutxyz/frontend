// src/components/owner/settings/ProfileSettings.tsx

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { dashboardApi } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Define types inline to avoid import issues
interface User {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: 'admin' | 'owner' | 'supplier';
  contact_number?: string;
  phone?: string;
  address?: string;
  position?: string;
  avatar?: string;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().optional(),
  address: z.string().optional(),
  position: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileSettings() {
  const auth = useAuth() as any; // Use type assertion to bypass type checking
  const user = auth.user;
  const updateUser = auth.updateUser;
  const [isLoading, setIsLoading] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
 
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.contact_number || user?.phone || "",
      address: user?.address || "",
      position: user?.role || user?.position || "",
    },
  });
 
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        email: user.email || "",
        phone: user.contact_number || user.phone || "",
        address: user.address || "",
        position: user.role || user.position || "",
      });
      setAvatar(user.avatar || null);
    }
  }, [user, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsLoading(true);
     
      // Map form data to match backend expected fields
      const userData = {
        name: data.name,
        email: data.email,
        contact_number: data.phone, // Map to contact_number
        address: data.address,
        // Don't include position as it's mapped from role
      };
     
      await dashboardApi.updateProfile(userData);
     
      // Update user state with the new data
      if (updateUser && user) {
        updateUser({
          ...user,
          ...userData,
          phone: data.phone, // For frontend use
          // Preserve role
          role: user.role || user.position
        });
      }
     
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !updateUser || !user) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("avatar", file);
     
      const response = await dashboardApi.uploadAvatar(formData);
      setAvatar(response.avatarUrl);
      
      updateUser({
        ...user,
        avatar: response.avatarUrl
      });
      
      toast.success("Profile picture updated");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload profile picture");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          Manage your personal information and how it appears on your profile.
        </p>
      </div>
     
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatar || ""} alt={user?.name || "User"} />
            <AvatarFallback className="text-2xl">{user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
         
          <Label htmlFor="avatar" className="cursor-pointer text-sm text-primary hover:underline">
            Change Photo
          </Label>
          <Input
            id="avatar"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
            disabled={isLoading}
          />
        </div>
       
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
             
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
             
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Your phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
             
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input placeholder="Your position" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
           
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Your address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
           
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}