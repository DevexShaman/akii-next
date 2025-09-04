// Header.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, Menu, X, Sparkles, User } from "lucide-react";
import { useAppDispatch } from "@/store";
import { logoutUser } from "@/store/slices/authSlice";
import Button from "@/components/UI/Button";
import { motion, AnimatePresence } from "framer-motion";
import { SlOptionsVertical } from "react-icons/sl";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

const Header = ({ setSidebarOpen }: HeaderProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push("/auth/signin");
  };

  return (
    <header className="ml-2 mt-2 rounded-xl fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-700 via-purple-600 to-fuchsia-600 shadow-lg border-b border-white/10">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className=" flex items-center h-16">
          <div className="flex items-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="flex-shrink-0"
            >
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm shadow-md">
                <div className="w-8 h-8 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="ml-4 text-xl font-bold text-white tracking-tight"
            >
              <span className="bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent">AI SPEECH</span> MODULE
            </motion.h1>
          </div>
          <div className="ml-auto flex items-center">
            <div className="hidden md:flex items-center space-x-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/profile")}
                  className="cursor-pointer text-white hover:bg-white/25 rounded-full p-2 transition-all duration-300 shadow-sm"
                >
                  <User className="w-5 h-5" />
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/settings")}
                  className="cursor-pointer text-white hover:bg-white/25 rounded-full p-2 transition-all duration-300 shadow-sm"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  className="text-white hover:bg-white/25 rounded-full p-2 transition-all duration-300 shadow-sm"
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 cursor-pointer" />
                </Button>
              </motion.div>
            </div>

            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-white p-2 hover:bg-white/25 rounded-full transition-all duration-300"
              >
                {showMobileMenu ? (
                  <X className="h-6 w-6" />
                ) : (
                  <SlOptionsVertical className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-gradient-to-b from-purple-700 to-fuchsia-700 shadow-xl"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col items-end mob-view">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/profile")}
                  className="text-white hover:bg-white/25 rounded-lg p-3 my-1 transition-all duration-300 w-full justify-start"
                >
                  <User className="w-5 h-5 mr-2" /> Profile
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/settings")}
                  className="text-white hover:bg-white/25 rounded-lg p-3 my-1 transition-all duration-300 w-full justify-start"
                >
                  <Settings className="w-5 h-5 mr-2" /> Settings
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  className="text-white hover:bg-white/25 rounded-lg p-3 my-1 transition-all duration-300 w-full justify-start"
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-2" /> Logout
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;