// src/app/dashboard/owner/suppliers/EditSupplierForm.tsx

"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { dashboardApi } from "@/lib/api"
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
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"

const formSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  street: z.string().optional(),
  purok: z.string().optional(),
  barangay: z.string().optional(),
  municipal: z.string().optional(),
  current_balance: z.coerce.number().optional(),
})

interface EditSupplierFormProps {
  supplier: any
  onSuccess: () => void
  onCancel: () => void
}

export default function EditSupplierForm({ supplier, onSuccess, onCancel }: EditSupplierFormProps) {
  const [loading, setLoading] = useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: supplier.contact?.phone || "",
      email: supplier.contact?.email || "",
      street: supplier.address?.street || "",
      purok: supplier.address?.purok || "",
      barangay: supplier.address?.barangay || "",
      municipal: supplier.address?.municipal || "",
      current_balance: supplier.current_balance || 0,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    try {
      await dashboardApi.updateSupplier(supplier._id, values)
      toast.success("Supplier updated successfully")
      onSuccess()
    } catch (error) {
      toast.error("Failed to update supplier")
      console.error("Error updating supplier:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Supplier: {supplier.name}</DialogTitle>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number" {...field} />
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
                    <Input type="email" placeholder="Email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input placeholder="Street address" {...field} />
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
                    <Input placeholder="Purok" {...field} />
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
                    <Input placeholder="Barangay" {...field} />
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
                    <Input placeholder="Municipality" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="current_balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Balance</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  )
}