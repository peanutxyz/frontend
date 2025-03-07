// src/app/dashboard/supplier/layout.tsx
import { DashboardShell } from "@/components/shared/DashboardShell"

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardShell role="supplier">{children}</DashboardShell>
}