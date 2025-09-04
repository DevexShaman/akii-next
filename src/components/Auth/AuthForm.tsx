"use client";
import React, { useState, useEffect } from "react";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiCheck, FiInfo, FiMic } from "react-icons/fi";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import { registerUser, loginUser } from "@/store/slices/authSlice";
import { useAppDispatch } from "@/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormikHelpers } from "formik";
import { motion, AnimatePresence } from "framer-motion";

interface FormValues {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface LoginFormValues {
  username: string;
  password: string;
}

const AuthComponent = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Fix hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Validation schemas
  const signUpValidationSchema = Yup.object({
    email: Yup.string().email("Invalid email address").required("Email is required"),
    username: Yup.string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be less than 20 characters")
      .matches(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores")
      .required("Username is required"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(/[a-z]/, "Password must contain at least one lowercase letter")
      .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
      .matches(/[0-9]/, "Password must contain at least one number")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "Passwords must match")
      .required("Confirm password is required"),
  });

  const signInValidationSchema = Yup.object({
    username: Yup.string().required("Username or email is required"),
    password: Yup.string().required("Password is required"),
  });

  // Password strength calculator
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    return strength;
  };

  // Handle form submission
  const handleSubmit = async (
    values: FormValues | LoginFormValues,
    { setSubmitting }: FormikHelpers<any>
  ) => {
    setLoading(true);
    setApiError("");

    try {
      if (isSignUp) {
        const signUpValues = values as FormValues;
        const params = {
          email: signUpValues.email,
          password: signUpValues.password,
          confirm_password: signUpValues.confirmPassword,
          username: signUpValues.username,
        };

        const result = await dispatch(registerUser(params));
        if (registerUser.fulfilled.match(result)) {
          toast.success("Account created successfully!");
          // Redirect to sign in after successful registration
          setIsSignUp(false);
        } else if (registerUser.rejected.match(result)) {
          const errorMessage =
            result.payload?.message || "Error creating account";
          setApiError(errorMessage);
          toast.error(errorMessage);
        }
      } else {
        const signInValues = values as LoginFormValues;
        const result = await dispatch(loginUser(signInValues));

        if (loginUser.fulfilled.match(result)) {
          const data = result.payload;
          if (data && data.access_token) {
            toast.success("Login successful!");
            // Redirect to dashboard using window.location to avoid prerendering issues
            window.location.href = "/dashboard";
          }
        } else if (loginUser.rejected.match(result)) {
          const errorPayload = result.payload as {
            message?: string;
            code?: number;
          };

          if (errorPayload?.message === "Bad credentials") {
            setApiError("Invalid username or password");
            toast.error("Invalid username or password");
          } else if (errorPayload?.message) {
            setApiError(errorPayload.message);
            toast.error(errorPayload.message);
          } else {
            setApiError("Login failed. Please try again.");
            toast.error("Login failed. Please try again.");
          }
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  // Handle password change and update strength
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>, handleChange: (e: React.ChangeEvent<any>) => void) => {
    handleChange(e);
    setPasswordStrength(calculatePasswordStrength(e.target.value));
  };

  // Toggle between sign up and sign in
  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setApiError("");
    setPasswordStrength(0);
  };

  // Get password strength color
  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "bg-red-500";
    if (passwordStrength < 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Get password strength label
  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 80) return "Medium";
    return "Strong";
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0zMCAzMG0tMjggMGEyOCwyOCAwIDEsMSA1NiwwYTI4LDI4IDAgMSwxIC01NiwwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNykiIHN0cm9rZS13aWR0aD0iMC41IiBmaWxsPSJub25lIi8+PC9zdmc+')] opacity-20"></div>
                <motion.div 
          className="absolute top-1/4 left-1/4 text-blue-400 opacity-40"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <FiMic size={40} />
        </motion.div>
        
        <motion.div 
          className="absolute top-1/3 right-1/4 text-purple-400 opacity-40"
          animate={{
            y: [0, 15, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        >
        </motion.div>
        
        <motion.div 
          className="absolute bottom-1/4 left-1/3 text-cyan-400 opacity-40"
          animate={{
            y: [0, -15, 0],
            rotate: [0, 8, 0],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8"></path>
            <rect width="16" height="12" x="4" y="8" rx="2"></rect>
            <path d="M2 14h2"></path>
            <path d="M20 14h2"></path>
            <path d="M15 13v2"></path>
            <path d="M9 13v2"></path>
          </svg>
        </motion.div>

        {/* Animated circles */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full border border-blue-500 opacity-10"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full border border-purple-500 opacity-10"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />

        {/* Pulse effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"
          animate={{
            opacity: [0, 0.1, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 z-10">
        <div className="mx-auto w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 15,
                  delay: 0.2
                }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-blue-500/20 rounded-full opacity-75 blur-lg"></div>
                <div className="relative bg-gray-800/80 backdrop-blur-md p-4 rounded-2xl shadow-lg">
                  <motion.div 
                    className={`p-3 rounded-xl ${isSignUp ? "bg-gradient-to-r from-blue-500 to-cyan-500" : "bg-gradient-to-r from-purple-500 to-blue-500"}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isSignUp ? (
                      <FiUser className="h-8 w-8 text-white" />
                    ) : (
                      <FiLock className="h-8 w-8 text-white" />
                    )}
                  </motion.div>
                </div>
              </motion.div>
            </div>
            
            <motion.h1 
              className="text-3xl font-bold text-white mb-3"
              key={isSignUp ? "signup-title" : "signin-title"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isSignUp ? "Create Your Account" : "Welcome Back"}
            </motion.h1>
            
            <motion.p 
              className="text-blue-200 text-lg"
              key={isSignUp ? "signup-subtitle" : "signin-subtitle"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {isSignUp 
                ? "Join our AI speech platform and experience the future of voice technology." 
                : "Sign in to access your AI speech dashboard"}
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gray-800/80 backdrop-blur-md py-8 px-6 shadow-xl rounded-2xl border border-gray-700/50"
          >
            <div className="flex mb-6 bg-gray-700/50 p-1 rounded-xl">
              <motion.button
                type="button"
                onClick={() => setIsSignUp(true)}
                className={`cursor-pointer flex-1 py-3 px-4 text-center font-medium rounded-xl transition-all duration-300 ${
                  isSignUp
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md"
                    : "text-gray-300 hover:text-white"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Sign Up
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setIsSignUp(false)}
                className={`cursor-pointer flex-1 py-3 px-4 text-center font-medium rounded-xl transition-all duration-300 ${
                  !isSignUp
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                    : "text-gray-300 hover:text-white"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Sign In
              </motion.button>
            </div>

            <Formik
              initialValues={
                isSignUp
                  ? {
                      username: "",
                      email: "",
                      password: "",
                      confirmPassword: "",
                    }
                  : {
                      username: "",
                      password: "",
                    }
              }
              validationSchema={
                isSignUp ? signUpValidationSchema : signInValidationSchema
              }
              onSubmit={handleSubmit}
            >
              {({ values, errors, touched, handleChange, handleBlur }:any) => (
                <Form>
                  <AnimatePresence mode="wait">
                    {apiError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 p-4 bg-red-400/10 text-red-200 rounded-xl border border-red-400/20 flex items-start"
                      >
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium">{apiError}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-5">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUser className="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-blue-400" />
                        </div>
                        <input
                          name="username"
                          type="text"
                          placeholder={isSignUp ? "Choose a username" : "Username or email"}
                          value={values.username}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className="block w-full pl-10 pr-4 py-3.5 text-white placeholder-gray-400 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 group-hover:border-gray-500"
                        />
                      </div>
                      {touched.username && errors.username && (
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-2 text-sm text-red-300 flex items-center"
                        >
                          <FiInfo className="mr-1" /> {errors.username}
                        </motion.p>
                      )}
                    </motion.div>

                    {isSignUp && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                      >
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiMail className="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-blue-400" />
                          </div>
                          <input
                            name="email"
                            type="email"
                            placeholder="Email address"
                            value={values.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className="block w-full pl-10 pr-4 py-3.5 text-white placeholder-gray-400 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 group-hover:border-gray-500"
                          />
                        </div>
                        {touched.email && errors.email && (
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-2 text-sm text-red-300 flex items-center"
                          >
                            <FiInfo className="mr-1" /> {errors.email}
                          </motion.p>
                        )}
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: isSignUp ? 0.2 : 0.1 }}
                    >
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLock className="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-blue-400" />
                        </div>
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={values.password}
                          onChange={(e) => handlePasswordChange(e, handleChange)}
                          onBlur={handleBlur}
                          className="block w-full pl-10 pr-12 py-3.5 text-white placeholder-gray-400 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 group-hover:border-gray-500"
                        />
                        <motion.button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {showPassword ? (
                            <FiEyeOff className="cursor-pointer h-5 w-5 text-gray-400 hover:text-blue-400 transition-colors" />
                          ) : (
                            <FiEye className="cursor-pointer h-5 w-5 text-gray-400 hover:text-blue-400 transition-colors" />
                          )}
                        </motion.button>
                      </div>
                      
                      {isSignUp && values.password && (
                        <div className="mt-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-400">Password strength</span>
                            <span className={`text-xs font-medium ${getPasswordStrengthColor().replace('bg-', 'text-')}`}>
                              {getPasswordStrengthLabel()}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <motion.div 
                              className={`h-1.5 rounded-full ${getPasswordStrengthColor()}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${passwordStrength}%` }}
                              transition={{ duration: 0.5 }}
                            ></motion.div>
                          </div>
                        </div>
                      )}
                      
                      {touched.password && errors.password && (
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-2 text-sm text-red-300 flex items-center"
                        >
                          <FiInfo className="mr-1" /> {errors.password}
                        </motion.p>
                      )}
                    </motion.div>

                    {isSignUp && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                      >
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiLock className="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-blue-400" />
                          </div>
                          <input
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm password"
                            value={values.confirmPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className="block w-full pl-10 pr-12 py-3.5 text-white placeholder-gray-400 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 group-hover:border-gray-500"
                          />
                          <motion.button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {showConfirmPassword ? (
                              <FiEyeOff className="cursor-pointer h-5 w-5 text-gray-400 hover:text-blue-400 transition-colors" />
                            ) : (
                              <FiEye className="cursor-pointer h-5 w-5 text-gray-400 hover:text-blue-400 transition-colors" />
                            )}
                          </motion.button>
                        </div>
                        {touched.confirmPassword && errors.confirmPassword && (
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-2 text-sm text-red-300 flex items-center"
                          >
                            <FiInfo className="mr-1" /> {errors.confirmPassword}
                          </motion.p>
                        )}
                      </motion.div>
                    )}

                    {!isSignUp && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                        className="flex items-center justify-between"
                      >
                        <motion.label 
                          className="flex items-center cursor-pointer"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={() => setRememberMe(!rememberMe)}
                              className="sr-only"
                            />
                            <motion.div
                              className={`w-5 h-5 rounded border transition-colors duration-200 flex items-center justify-center ${
                                rememberMe
                                  ? "bg-blue-600 border-blue-600"
                                  : "bg-gray-700 border-gray-500"
                              }`}
                              animate={{ scale: rememberMe ? [1, 1.1, 1] : 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              {rememberMe && (
                                <FiCheck className="w-4 h-4 text-white" />
                              )}
                            </motion.div>
                          </div>
                          <span className="ml-2 text-sm text-gray-300">Remember me</span>
                        </motion.label>

                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Link
                            href="/forgetpassword"
                            className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Forgot password?
                          </Link>
                        </motion.div>
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: isSignUp ? 0.5 : 0.6 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <button
                        type="submit"
                        disabled={loading}
                        className={`cursor-pointer w-full flex justify-center items-center py-4 px-6 rounded-xl text-white font-medium text-lg shadow-lg transition-all duration-300 ${
                          loading
                            ? "bg-gray-600 cursor-not-allowed"
                            : isSignUp
                            ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl"
                            : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl"
                        }`}
                      >
                        {loading ? (
                          <>
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
                            {isSignUp ? "Creating Account..." : "Signing in..."}
                          </>
                        ) : (
                          <>
                            {isSignUp ? "Create Account" : "Sign In"}
                            <motion.span
                              animate={{ x: [0, 5, 0] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                              <FiArrowRight className="ml-2 h-5 w-5" />
                            </motion.span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  </div>
                </Form>
              )}
            </Formik>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="cursor-pointer mt-8 text-center text-gray-400 text-sm"
            >
              {isSignUp ? (
                <>
                  <p>
                    Already have an account?{" "}
                    <motion.button
                      type="button"
                      onClick={toggleAuthMode}
                      className="cursor-pointer font-medium text-blue-400 hover:text-blue-300 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Sign In
                    </motion.button>
                  </p>
                </>
              ) : (
                <p>
                  Don't have an account?{" "}
                  <motion.button
                    type="button"
                    onClick={toggleAuthMode}
                    className="cursor-pointer font-medium text-blue-400 hover:text-blue-300 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Sign up
                  </motion.button>
                </p>
              )}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="mt-8 text-center"
          >
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} VoiceAI. All rights reserved.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthComponent;