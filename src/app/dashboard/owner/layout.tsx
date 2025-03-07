// src/app/dashboard/owner/layout.tsx
import { DashboardShell } from "@/components/shared/DashboardShell";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardShell role="owner">{children}</DashboardShell>;
}