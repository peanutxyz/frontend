"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi } from "@/lib/api";
import { toast } from "sonner";

interface SupplierInfoFormProps {
  supplier: any;
  onUpdate?: () => void;
  readOnly?: boolean;
}

export function SupplierInfoForm({ supplier, onUpdate, readOnly = false }: SupplierInfoFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: supplier?.contact?.phone || '',
    email: supplier?.contact?.email || '',
    street: supplier?.address?.street || '',
    purok: supplier?.address?.purok || '',
    barangay: supplier?.address?.barangay || '',
    municipal: supplier?.address?.municipal || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (readOnly) return;
    
    try {
      setIsLoading(true);
      
      await dashboardApi.updateSupplier(supplier._id, formData);
      
      toast.success("Supplier information updated successfully");
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating supplier:", error);
      toast.error("Failed to update supplier information");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Contact Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={readOnly || isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={readOnly || isLoading}
                />
              </div>
            </div>
            
            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Address Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="street">Street/House No.</Label>
                <Input 
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  disabled={readOnly || isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="purok">Purok</Label>
                <Input 
                  id="purok"
                  name="purok"
                  value={formData.purok}
                  onChange={handleChange}
                  disabled={readOnly || isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="barangay">Barangay</Label>
                <Input 
                  id="barangay"
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleChange}
                  disabled={readOnly || isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="municipal">Municipal</Label>
                <Input 
                  id="municipal"
                  name="municipal"
                  value={formData.municipal}
                  onChange={handleChange}
                  disabled={readOnly || isLoading}
                />
              </div>
            </div>
          </div>
          
          {!readOnly && (
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Information"}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}