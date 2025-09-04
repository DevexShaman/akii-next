"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  UserPlus,
  Mic,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar = ({
  collapsed,
  setCollapsed,
  isOpen,
  setIsOpen,
}: SidebarProps) => {
  const pathname = usePathname();
  const wasMobileRef = useRef(null);
  const name = localStorage.getItem("username") || "";

  const navigationItems = [
    {
      name: "Student Form",
      href: "/dashboard",
      icon: User,
    },
    {
      name: "Teacher Form",
      href: "/teacher",
      icon: UserPlus,
    },
    {
      name: "Speech Practice",
      href: "/voiceassistant",
      icon: Mic,
    },
  ];

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      if (!wasMobileRef.current && isMobile) {
        setCollapsed(true);
      }
      wasMobileRef.current = isMobile;
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cursor-pointer fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`rounded-2xl mt-6 ml-2 fixed top-16 bottom-0 z-40 bg-gradient-to-b from-indigo-800 to-purple-900 shadow-2xl ${collapsed ? "w-20" : "w-64"
          }`}
        initial={{ width: 256 }}
        animate={{ width: collapsed ? 80 : 256 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <div className="flex flex-col h-full">
          {/* Collapse Button */}
          <div className="p-4 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCollapsed(!collapsed)}
              className="cursor-pointer p-2 rounded-full bg-white/10 text-white hover:bg-indigo-600 transition-colors shadow-md"
            >
              {collapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </motion.button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-2 flex-1">
            {navigationItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={item.href}>
                    <motion.div
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      className={clsx(
                        "flex items-center p-3 rounded-xl mb-2 transition-all duration-300 group border border-transparent",
                        isActive
                          ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg border-purple-400/30"
                          : "text-white/80 hover:bg-indigo-700/50 hover:text-white hover:border-indigo-400/30"
                      )}
                    >
                      <div className={clsx(
                        "p-2 rounded-lg transition-colors",
                        isActive
                          ? "bg-white/20"
                          : "bg-white/10 group-hover:bg-white/20"
                      )}>
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                      </div>
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="ml-3 font-medium"
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <motion.div
            className="p-4 border-t border-indigo-600/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center">
              <div className="bg-gradient-to-tr from-cyan-400 to-blue-500 w-10 h-10 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-semibold text-lg">
                  {name?.charAt(0).toUpperCase()}
                </span>
              </div>

              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="ml-3"
                  >
                    <p className="text-white text-sm font-medium truncate max-w-[140px]">
                      {name}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </motion.div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;