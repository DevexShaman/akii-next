"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Settings } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { logoutUser } from "@/store/slices/authSlice";
import Button from "@/components/UI/Button";

const Header = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push("/signin");
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900">
            Digital Archival System
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>{user?.full_name}</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {user?.role}
            </span>
          </div> */}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/profile")}
          >
            <Settings className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
