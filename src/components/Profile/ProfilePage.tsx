"use client";

import React from "react";

const ProfilePage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          User Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Email</p>
            <p className="text-sm text-gray-900">test@yopmail.com</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Username</p>
            <p className="text-sm text-gray-900">testuser</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
