// src/hooks/useAuth.js
"use client";

import { useState, useEffect } from "react";
import { AppDispatch, useAppSelector } from "@/store";
import { useDispatch } from "react-redux";
import { verifyAuth } from "@/store/slices/authSlice";

const useAuth = () => {
  const reduxAuth = useAppSelector((state) => state.auth.isAuthenticated);
   const [hasToken, setHasToken] = useState(false);

   const dispatch = useDispatch<AppDispatch>()
  console.log(reduxAuth)
   useEffect(()=>{dispatch(verifyAuth())},[])
  useEffect(() => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;
    setHasToken(!!token);
  }, []);

  return {loading:false, isAuthenticated:reduxAuth} || {loading:false, isAuthenticated:!!hasToken};
}

export default useAuth;
