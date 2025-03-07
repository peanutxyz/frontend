// src/app/dashboard/admin/layout.tsx
import { DashboardShell } from "@/components/shared/DashboardShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardShell role="admin">{children}</DashboardShell>;
}