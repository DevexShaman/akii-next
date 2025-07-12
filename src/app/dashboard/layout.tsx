// src/app/dashboard/layout.tsx
"use client";

import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Layout from "@/components/Layout/Layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    
      <Layout>{children}</Layout>
    
  );
}
