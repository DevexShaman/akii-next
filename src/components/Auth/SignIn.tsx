"use client";

import React, { useState } from "react";
import {
  FiMail,
  FiLock,
  FiGithub,
  FiTwitter,
  FiFacebook,
  FiUser,
} from "react-icons/fi";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import AuthLayout from "./AuthLayout";
import AuthInput from "@/components/Auth/AuthInput";
import { loginUser } from "@/store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "@/store";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SignIn = () => {
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const router = useRouter();

  const validationSchema = Yup.object({
    username: Yup.string().required("Username is required"),
    password: Yup.string().required("Password is required"),
  });

  const handleSubmit = async (values: any) => {
    setLoading(true);
    // Simulate API call
    dispatch(loginUser(values))
      .then((data: any) => {
        setLoading(false);
        if (data.payload && !data.error && data.payload.access_token) {
          console.log("Login data:", values);
          toast.success("Login successful!");
          router.push("/dashboard");
        } else {
          toast.error("Error");
        }
      })
      .catch((err: any) => {
        setLoading(false);

        console.log(err);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AuthLayout title="Welcome back">
        <div className="auth-form">
          <h2 className="form-title">Sign In</h2>

          <Formik
            initialValues={{ username: "", password: "" }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleChange }) => (
              <Form>
                <AuthInput
                  icon={<FiUser />}
                  name="username"
                  type="text"
                  placeholder="Username"
                  value={values.email}
                  onChange={handleChange}
                  error={touched.email && errors.email}
                />

                <AuthInput
                  icon={<FiLock />}
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={values.password}
                  onChange={handleChange}
                  error={touched.password && errors.password}
                />

                <div className="flex items-center justify-between mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Remember me
                    </span>
                  </label>

                  <a href="#" className="text-sm text-blue-600 hover:underline">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ${
                    loading ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="flex justify-center space-x-4 mb-6">
                  <button
                    type="button"
                    className="p-2 border border-gray-300 rounded-full hover:bg-gray-50"
                  >
                    <FiGithub className="text-gray-700" size={20} />
                  </button>
                  <button
                    type="button"
                    className="p-2 border border-gray-300 rounded-full hover:bg-gray-50"
                  >
                    <FiTwitter className="text-blue-400" size={20} />
                  </button>
                  <button
                    type="button"
                    className="p-2 border border-gray-300 rounded-full hover:bg-gray-50"
                  >
                    <FiFacebook className="text-blue-600" size={20} />
                  </button>
                </div>
              </Form>
            )}
          </Formik>

          <div className="auth-footer">
            <p>
              Don't have an account?{" "}
              <Link href="/signup" className="text-blue-600">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </AuthLayout>
    </div>
  );
};

export default SignIn;
