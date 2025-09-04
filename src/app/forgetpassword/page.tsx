"use client";

import React, { useState } from "react";
import { FiMail, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
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
          body: JSON.stringify({
            email: values.email,
          }),
        }
      );

      if (response.ok) {
        toast.success(
          "If this email exists in our system, you'll receive a password reset link"
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
    <div className="min-h-screen flex bg-gray-50">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 p-12 flex-col justify-between">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-white"
        >
          <h1 className="text-4xl font-bold mb-4">Reset Your Password</h1>
          <p className="text-indigo-100 text-lg max-w-md">
            No worries, we'll help you get back into your account in no time.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex justify-center"
        >
          <svg width="80%" viewBox="0 0 480 360" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" fillRule="evenodd">
              <path d="M305 194h90v118H0V194h90a90 90 0 0 1 90-90 90 90 0 0 1 90 90 90 90 0 0 1 35 0z" fill="#7E69B9" opacity=".3"/>
              <path d="M395 194h90v118H90V194h90a90 90 0 0 1 90-90 90 90 0 0 1 90 90 90 90 0 0 1 35 0z" fill="#5D48A4" opacity=".3"/>
              <path d="M305 104a90 90 0 0 1 90 90v118H90V194a90 90 0 0 1 90-90 90 90 0 0 1 90 90 90 90 0 0 1 35 0z" fill="#431B93" opacity=".3"/>
              <circle fill="#FFF" cx="245" cy="145" r="45"/>
              <path d="M245 100a45 45 0 0 1 45 45 45 45 0 0 1-45 45 45 45 0 0 1-45-45 45 45 0 0 1 45-45z" fillOpacity=".05" fill="#000"/>
              <path d="M290 145a45 45 0 0 1-45 45 45 45 0 0 1-45-45 45 45 0 0 1 45-45 45 45 0 0 1 45 45z" fillOpacity=".15" fill="#000"/>
              <path d="M245 190a45 45 0 0 1-45-45 45 45 0 0 1 45-45 45 45 0 0 1 45 45 45 45 0 0 1-45 45z" fillOpacity=".1" fill="#000"/>
              <path d="M252 133a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" fill="#431B93"/>
              <path d="M270 145c0 13-11 24-25 24s-25-11-25-24 11-24 25-24 25 11 25 24z" fill="#FFF"/>
              <path d="M245 169c-13 0-24-11-24-24s11-24 24-24 24 11 24 24-11 24-24 24zm0-41c-9 0-17 8-17 17s8 17 17 17 17-8 17-17-8-17-17-17z" fill="#431B93"/>
              <path d="M252 133a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" fill="#431B93"/>
              <path d="M238 133a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" fill="#431B93"/>
            </g>
          </svg>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-white text-sm"
        >
          <p>© 2025 Your Brand. All rights reserved</p>
        </motion.div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <Link href="/auth/signin" className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 font-medium transition-colors mb-6">
              <FiArrowLeft className="mr-2" />
              Back to Sign In
            </Link>

            <div className="flex justify-center mb-6">
              <div className="bg-indigo-100 p-4 rounded-full">
                <div className="bg-indigo-600 text-white p-4 rounded-full">
                  {emailSent ? <FiCheckCircle size={28} /> : <FiMail size={28} />}
                </div>
              </div>
            </div>

            {emailSent ? (
              <>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Check Your Email
                </h2>
                <p className="text-gray-600 mb-6">
                  We've sent a password reset link to your email address
                </p>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-left mb-6"
                >
                  <p className="text-blue-800">
                    <span className="font-medium">Didn't receive the email?</span>
                    <br />
                    Check your spam folder or try again with the correct email address.
                  </p>
                </motion.div>
                <div className="mt-8">
                  <button
                    onClick={() => setEmailSent(false)}
                    className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    Try another email address
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Forgot Password?
                </h2>
                <p className="text-gray-600 mb-6">
                  Enter your email address and we'll send you a reset link
                </p>
                
                <Formik
                  initialValues={{ email: "" }}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  {({ values, errors, touched, handleChange }) => (
                    <Form>
                      <AuthInput
                        icon={<FiMail />}
                        name="email"
                        type="email"
                        placeholder="Email address"
                        value={values.email}
                        onChange={handleChange}
                        error={touched.email && errors.email}
                      />

                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="mb-6"
                      >
                        <button
                          type="submit"
                          disabled={loading}
                          className={`w-full bg-indigo-600 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-300 shadow hover:shadow-md ${
                            loading
                              ? "opacity-80 cursor-not-allowed"
                              : "hover:bg-indigo-700"
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
                        </button>
                      </motion.div>
                    </Form>
                  )}
                </Formik>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-sm text-gray-500 mt-12 pt-6 border-t border-gray-200"
          >
            <p>Need help? <a href="#" className="text-indigo-600 hover:text-indigo-800 font-medium">Contact support</a></p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;