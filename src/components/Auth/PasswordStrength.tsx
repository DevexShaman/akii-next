'use client'

import React from "react";

const PasswordStrength = ({ password }) => {
  const calculateStrength = () => {
    if (!password) return 0;

    let strength = 0;
    if (password.length > 5) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;

    return strength;
  };

  const getStrengthColor = () => {
    const strength = calculateStrength();
    if (strength < 50) return "bg-red-500";
    if (strength < 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="mb-4">
      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
        <div
          className={`h-2 rounded-full ${getStrengthColor()}`}
          style={{ width: `${calculateStrength()}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-600">
        {calculateStrength() < 50
          ? "Weak password"
          : calculateStrength() < 75
          ? "Medium strength"
          : "Strong password"}
      </p>
    </div>
  );
};

export default PasswordStrength;
