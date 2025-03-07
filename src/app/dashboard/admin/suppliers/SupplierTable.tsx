// src/app/dashboard/admin/suppliers/SupplierTable.tsx
"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Edit, MoreHorizontal, Trash2, PhoneCall, Mail, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { dashboardApi } from "@/lib/api"
import { toast } from "sonner"
import EditSupplierForm from "./EditSupplierForm"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Supplier } from "@/types";

interface SupplierTableProps {
  suppliers: Supplier[];
  loading: boolean;
  onSupplierChange: () => void;
  isAdmin: boolean;
}

export default function SupplierTable({ suppliers, loading, onSupplierChange, isAdmin }: SupplierTableProps) {
  const [deleteSupplier, setDeleteSupplier] = useState<string | null>(null)
  const [editSupplier, setEditSupplier] = useState<any | null>(null)

  const handleDelete = async () => {
    if (!deleteSupplier) return
   
    try {
      await dashboardApi.deleteSupplier(deleteSupplier)
      toast.success("Supplier deleted successfully")
      onSupplierChange()
    } catch (error) {
      toast.error("Failed to delete supplier")
      console.error("Error deleting supplier:", error)
    } finally {
      setDeleteSupplier(null)
    }
  }

  const toggleSupplierStatus = async (id: string, currentStatus: boolean) => {
    try {
      await dashboardApi.updateSupplier(id, { is_active: !currentStatus })
      toast.success(`Supplier ${currentStatus ? 'deactivated' : 'activated'} successfully`)
      onSupplierChange()
    } catch (error) {
      toast.error(`Failed to ${currentStatus ? 'deactivate' : 'activate'} supplier`)
      console.error("Error updating supplier status:", error)
    }
  }

  const syncSupplierBalance = async (id: string) => {
    try {
      await dashboardApi.syncSupplierBalance(id)
      toast.success("Balance synced successfully")
      onSupplierChange()
    } catch (error) {
      toast.error("Failed to sync balance")
      console.error("Error syncing balance:", error)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-10">Loading suppliers...</div>
  }

  if (suppliers.length === 0) {
    return <div className="text-center py-10 text-gray-500">No suppliers found</div>
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier._id}>
              <TableCell className="font-medium">{supplier.name}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {supplier.contact?.phone && (
                    <div className="flex items-center gap-1">
                      <PhoneCall className="h-3 w-3" /> {supplier.contact.phone}
                    </div>
                  )}
                  {supplier.contact?.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {supplier.contact.email}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {supplier.address?.street && (
                  <div>
                    {supplier.address.street},
                    {supplier.address.purok && ` Purok ${supplier.address.purok},`}
                    {supplier.address.barangay && ` Brgy. ${supplier.address.barangay},`}
                    {supplier.address.municipal && ` ${supplier.address.municipal}`}
                  </div>
                )}
              </TableCell>
              <TableCell>₱{supplier.current_balance.toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={supplier.is_active ? "default" : "secondary"}>
                  {supplier.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditSupplier(supplier)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => syncSupplierBalance(supplier._id)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Balance
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSupplierStatus(supplier._id, supplier.is_active)}>
                      <Badge variant={supplier.is_active ? "outline" : "default"} className="mr-2">
                        {supplier.is_active ? "Deactivate" : "Activate"}
                      </Badge>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem
                        onClick={() => setDeleteSupplier(supplier._id)}
                        className="text-red-600 focus:text-red-500"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSupplier} onOpenChange={(open) => !open && setDeleteSupplier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the supplier
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Edit Supplier Dialog */}
      <Dialog open={!!editSupplier} onOpenChange={(open) => !open && setEditSupplier(null)}>
        <DialogContent className="sm:max-w-[425px]">
          {editSupplier && (
            <EditSupplierForm
              supplier={editSupplier}
              onSuccess={() => {
                setEditSupplier(null)
                onSupplierChange()
              }}
              onCancel={() => setEditSupplier(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}