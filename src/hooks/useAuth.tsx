// src/hooks/useAuth.ts
"use client";

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@/store";
import { verifyAuth } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";

const useAuth = (skip = false, redirectOnAuth = false) => {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (redirectOnAuth && !loading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [loading, isAuthenticated, redirectOnAuth, router]);

  useEffect(() => {
    if (skip) {
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await dispatch(verifyAuth()).unwrap();
      } catch (err: any) {
        setError(err?.message || "Authentication failed");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [dispatch, skip]);

  return { loading, isAuthenticated, error };
};

export default useAuth;


