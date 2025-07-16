"use client";
import React, { ReactNode } from "react";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

interface AuthLayoutProps {
  children: ReactNode;
  title?: string; // Add this line
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title }) => {
  return (
    <div className="auth-container">
      <div className="auth-illustration">
        <div className="text-white text-center p-8 bg-black bg-opacity-40 rounded-xl">
          <h1 className="text-4xl font-bold mb-4">Welcome!</h1>
          <p className="text-xl max-w-md">
            Join thousands of users managing their accounts securely
            {title && <h1 className="layout-title">{title}</h1>}
          </p>
        </div>
      </div>

      <div className="auth-form-container">
        <div className="w-full max-w-md">
          <Link
            href="/signin"
            className="inline-flex items-center text-blue-600 mb-6 hover:underline"
          >
            <FiArrowLeft className="mr-2" /> Back to sign in
          </Link>

          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
