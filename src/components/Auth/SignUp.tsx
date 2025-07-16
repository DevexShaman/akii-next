"use client";
import React, { useState } from "react";
import { FiUser, FiMail, FiLock } from "react-icons/fi";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import AuthLayout from "./AuthLayout";
import AuthInput from "@/components/Auth/AuthInput";
import PasswordStrength from "@/components/Auth/PasswordStrength";
import { registerUser } from "@/store/slices/authSlice";
import { useAppDispatch } from "@/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormikHelpers } from "formik";

interface FormValues {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const SignUp = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  // const { isLoading, error } = useAppSelector((state: any) => state.auth);

  const validationSchema = Yup.object({
    // name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    username: Yup.string().required("Username is required"),
    // phone: Yup.string().matches(/^[0-9]{10}$/, "Invalid phone number"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm password is required"),
  });

  const handleSubmit = async (
    values: FormValues,
    { setSubmitting }: FormikHelpers<FormValues>
  ) => {
    setLoading(true);

    const params = {
      email: values.email,
      password: values.password,
      confirm_password: values.confirmPassword,
      username: values.username,
    };

    try {
      const result = await dispatch(registerUser(params));
      if (registerUser.fulfilled.match(result)) {
        toast.success("Account created successfully!");
        router.push("/signin");
      } else {
        toast.error("Error creating account");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.log("error", error);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AuthLayout title="Create your account">
        <div className="auth-form">
          <h2 className="form-title">Sign Up</h2>

          <Formik
            initialValues={{
              username: "",
              email: "",
              // phone: "",
              password: "",
              confirmPassword: "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleChange }) => (
              <Form>
                <AuthInput
                  icon={<FiUser />}
                  name="username"
                  placeholder="Usrename"
                  value={values.username}
                  onChange={handleChange}
                  error={touched.username && errors.username}
                />

                <AuthInput
                  icon={<FiMail />}
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  value={values.email}
                  onChange={handleChange}
                  error={touched.email && errors.email}
                />

                {/* <AuthInput
                icon={<FiPhone />}
                name="phone"
                placeholder="Phone Number (Optional)"
                value={values.phone}
                onChange={handleChange}
                error={touched.phone && errors.phone}
              /> */}

                <AuthInput
                  icon={<FiLock />}
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={values.password}
                  onChange={handleChange}
                  error={touched.password && errors.password}
                />

                <PasswordStrength password={values.password} />

                <AuthInput
                  icon={<FiLock />}
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm Password"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  error={touched.confirmPassword && errors.confirmPassword}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ${
                    loading ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </Form>
            )}
          </Formik>

          <div className="auth-footer">
            <p>
              Already have an account? <Link href="/signin">Sign In</Link>
            </p>
            <p className="mt-2 text-xs">
              By signing up, you agree to our Terms and Privacy Policy
            </p>
          </div>
        </div>
      </AuthLayout>
    </div>
  );
};

export default SignUp;
