"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PasswordResetRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      router.replace(`/forgotten-password/${token}`);
    } else {
      router.push("/forgetpassword");
    }
  }, [token, router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <p className="text-lg font-medium">Redirecting to password reset...</p>
      </div>
    </div>
  );
}
