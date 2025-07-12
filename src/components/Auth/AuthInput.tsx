"use client";

import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

const AuthInput = ({
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="mb-5 relative">
      <div className="flex items-center border-b border-gray-300 py-2">
        <span className="text-gray-500 mr-3">{icon}</span>
        <input
          className={`appearance-none bg-transparent w-full text-gray-700 
          py-1 px-2 leading-tight focus:outline-none ${
            error ? "border-red-500" : ""
          }`}
          type={
            type === "password" ? (showPassword ? "text" : "password") : type
          }
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          {...props}
        />
        {type === "password" && (
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default AuthInput;
