"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { api, dashboardApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

// Form validation schema without password field
const formSchema = z.object({
  // User fields
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email"),
 
  // Contact fields
  phone: z.string()
    .refine(val => /^\d*$/.test(val), {
      message: "Phone number must contain only digits",
    })
    .optional(),
 
  // Address fields
  street: z.string().optional(),
  purok: z.string().optional(),
  barangay: z.string().optional(),
  municipal: z.string().optional(),
});

interface AddSupplierFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function AddSupplierForm({ onSuccess, onCancel }: AddSupplierFormProps) {
  const [loading, setLoading] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
  const [generatedCredentials, setGeneratedCredentials] = useState({ username: "", password: "" })
 
  // Function to capitalize first letter of each word
  const capitalizeWords = (text: string) => {
    if (!text) return text;
    return text.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      street: "",
      purok: "",
      barangay: "",
      municipal: "",
    },
  })

  // Function to generate password based on name
  const generatePassword = (name: string) => {
    // Remove spaces and convert to lowercase
    const formattedName = name.toLowerCase().replace(/\s+/g, '');
    // Add "123" suffix
    return `${formattedName}123`;
  }

  // Fixed type annotation to accept string | undefined
  const handleCapitalization = (field: any, value: string | undefined, fieldName: string) => {
    if (!value) return;
   
    const capitalizedValue = capitalizeWords(value);
    field.onChange(capitalizedValue);
   
    // This explicitly updates the form value and triggers re-render
    form.setValue(fieldName as any, capitalizedValue, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    try {
      // Enforce capitalization once more before submission
      const capitalizedValues = {
        ...values,
        name: capitalizeWords(values.name),
        street: values.street ? capitalizeWords(values.street) : "",
        purok: values.purok ? capitalizeWords(values.purok) : "",
        barangay: values.barangay ? capitalizeWords(values.barangay) : "",
        municipal: values.municipal ? capitalizeWords(values.municipal) : "",
      };
     
      // Generate password from name
      const generatedPassword = generatePassword(values.name);
     
      // Step 1: Register a new user with supplier role
      const userData = {
        name: capitalizedValues.name,
        email: values.email,
        password: generatedPassword,
        role: 'supplier'
      };
     
      const userResponse = await api.post('/auth/register', userData);
      const userId = userResponse.data.user._id || userResponse.data.user.id;
     
      // Step 2: Create supplier profile linked to this user
      const supplierData = {
        user_id: userId,
        phone: values.phone,
        email: values.email,
        street: capitalizedValues.street,
        purok: capitalizedValues.purok,
        barangay: capitalizedValues.barangay,
        municipal: capitalizedValues.municipal
      };
     
      await dashboardApi.createSupplier(supplierData);
     
      // Store credentials to show in dialog
      setGeneratedCredentials({
        username: values.email,
        password: generatedPassword
      });
     
      // Show credentials dialog
      setShowCredentials(true);
     
      toast.success("Supplier registered successfully");
    } catch (error: any) {
      console.error('Error registering supplier:', error);
      toast.error(error.response?.data?.message || "Failed to register supplier");
    } finally {
      setLoading(false);
    }
  }

  const handleCloseCredentialsDialog = () => {
    setShowCredentials(false);
    onSuccess();
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">User Account Information</h3>
           
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter supplier name"
                      {...field}
                      onBlur={() => handleCapitalization(field, field.value, "name")}
                      // Also capitalize on input change with a delay
                      onChange={(e) => {
                        // First update with original value to maintain cursor position
                        field.onChange(e.target.value);
                        // Then schedule capitalization after a small delay
                        setTimeout(() => {
                          handleCapitalization(field, e.target.value, "name");
                        }, 100);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
           
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
           
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Phone number"
                      {...field}
                      onChange={(e) => {
                        // Only allow numeric input
                        const value = e.target.value.replace(/\D/g, '');
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Address Information</h3>
           
            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Street address"
                      {...field}
                      onBlur={() => handleCapitalization(field, field.value, "street")}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setTimeout(() => {
                          handleCapitalization(field, e.target.value, "street");
                        }, 100);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="purok"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purok</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Purok"
                        {...field}
                        onBlur={() => handleCapitalization(field, field.value, "purok")}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          setTimeout(() => {
                            handleCapitalization(field, e.target.value, "purok");
                          }, 100);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="barangay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barangay</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Barangay"
                        {...field}
                        onBlur={() => handleCapitalization(field, field.value, "barangay")}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          setTimeout(() => {
                            handleCapitalization(field, e.target.value, "barangay");
                          }, 100);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="municipal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Municipality</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Municipality"
                        {...field}
                        onBlur={() => handleCapitalization(field, field.value, "municipal")}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          setTimeout(() => {
                            handleCapitalization(field, e.target.value, "municipal");
                          }, 100);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Creating...</span>
                </div>
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </form>
      </Form>
      {/* Credentials Dialog */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supplier Created Successfully</DialogTitle>
            <DialogDescription>
              The supplier has been registered. Please save these login credentials:
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 border rounded-md bg-slate-50 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <span className="font-medium">Username:</span>
              <span>{generatedCredentials.username}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="font-medium">Password:</span>
              <span>{generatedCredentials.password}</span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseCredentialsDialog}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}