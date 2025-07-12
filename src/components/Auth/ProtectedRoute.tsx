// components/Auth/ProtectedRoute.jsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useAuth from "@/hooks/useAuth";

const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  console.log(isAuthenticated)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/signin");
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;