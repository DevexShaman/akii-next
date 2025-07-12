// components/Auth/GuestRoute.jsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useAuth from "@/hooks/useAuth";

const GuestRoute = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, loading, router]);

  if (loading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return children;
};

export default GuestRoute;