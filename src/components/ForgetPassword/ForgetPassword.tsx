"use client";

import React, { useState } from "react";
import { FiMail, FiArrowLeft } from "react-icons/fi";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import AuthLayout from "@/app/(authenticated)/layout";
import AuthInput from "@/components/Auth/AuthInput";
import Link from "next/link";
import { motion } from "framer-motion";

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
  });

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: values.email }),
        }
      );

      if (response.ok) {
        toast.success(
          "If this email exists, you'll receive a password reset link"
        );
        setEmailSent(true);
      } else {
        toast.error("Failed to send reset email. Please try again.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* Gradient Background */}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-md w-full backdrop-blur-sm bg-white/20 rounded-3xl shadow-2xl p-10 border border-white/30"
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              whileHover={{ scale: 1.2 }}
              className="bg-white/30 p-4 rounded-full shadow-lg"
            >
              <div className="bg-indigo-600 p-4 rounded-full text-white shadow-md">
                <FiMail size={28} />
              </div>
            </motion.div>
          </div>

          {/* Heading */}
          {emailSent ? (
            <>
              <h2 className="text-3xl font-bold text-white mb-3 text-center drop-shadow-lg">
                Check Your Email
              </h2>
              <p className="text-white/80 mb-6 text-center text-sm drop-shadow-sm">
                We've sent a password reset link to your email address.
              </p>
              <div className="bg-white/20 border border-white/30 rounded-lg p-4 text-left">
                <p className="text-white/90 text-sm">
                  <span className="font-medium">Didn't receive the email?</span>{" "}
                  <br />
                  Check your spam folder or resend the link
                </p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-white mb-2 text-center drop-shadow-lg">
                Forgot Password
              </h2>
              <p className="text-white/80 mb-6 text-center text-sm drop-shadow-sm">
                Enter your email to reset your password
              </p>
            </>
          )}

          {/* Form */}
          {!emailSent && (
            <Formik
              initialValues={{ email: "" }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ values, errors, touched, handleChange }) => (
                <Form className="space-y-5">
                  <AuthInput
                    icon={<FiMail className="text-white/80" />}
                    name="email"
                    type="email"
                    placeholder="Email address"
                    value={values.email}
                    onChange={handleChange}
                    error={touched.email && errors.email}
                    className="bg-white/20 placeholder-white/70 text-white"
                  />

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3.5 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 ${
                      loading
                        ? "bg-indigo-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700"
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Sending...
                      </div>
                    ) : (
                      "Send Reset Link"
                    )}
                  </motion.button>
                </Form>
              )}
            </Formik>
          )}

          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-6"
          >
            <Link
              href="/auth/signin"
              className="inline-flex items-center text-white/90 hover:text-white font-medium transition-colors"
            >
              <FiArrowLeft className="mr-2" />
              Back to Sign In
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
