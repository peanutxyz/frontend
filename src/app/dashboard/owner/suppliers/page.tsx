// src/app/dashboard/owner/suppliers/page.tsx

"use client"

import { useEffect, useState } from "react"
import { dashboardApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth"
import SupplierTable from "./SupplierTable"
import AddSupplierForm from "./AddSupplierForm"
import { toast } from "sonner"
import { Supplier } from "@/types";

export default function OwnerSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const { user } = useAuth((state) => state)

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const data = await dashboardApi.getSuppliers()
      setSuppliers(data)
    } catch (error) {
      toast.error("Failed to load suppliers")
      console.error("Error fetching suppliers:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  // Handler for refreshing the list after adding/editing/deleting
  const handleSupplierChange = () => {
    fetchSuppliers()
    setShowAddForm(false)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Supplier Management</h1>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Supplier
        </Button>
      </div>

      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Supplier</CardTitle>
            <CardDescription>Create a new supplier record</CardDescription>
          </CardHeader>
          <CardContent>
            <AddSupplierForm onSuccess={handleSupplierChange} onCancel={() => setShowAddForm(false)} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Suppliers</CardTitle>
          <CardDescription>Manage your suppliers and their information</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Suppliers</TabsTrigger>
              <TabsTrigger value="active">Active Suppliers</TabsTrigger>
              <TabsTrigger value="inactive">Inactive Suppliers</TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              <SupplierTable
                suppliers={suppliers.filter(s => s.is_active)}
                loading={loading}
                onSupplierChange={handleSupplierChange}
                isAdmin={false} // Owner is not admin
              />
            </TabsContent>
            <TabsContent value="inactive">
              <SupplierTable
                suppliers={suppliers.filter(s => !s.is_active)}
                loading={loading}
                onSupplierChange={handleSupplierChange}
                isAdmin={false} // Owner is not admin
              />
            </TabsContent>
            <TabsContent value="all">
              <SupplierTable
                suppliers={suppliers}
                loading={loading}
                onSupplierChange={handleSupplierChange}
                isAdmin={false} // Owner is not admin
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}