"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { clsx } from "clsx";

const Sidebar = () => {
  const pathname = usePathname();
  const navigationItems = [
    {
      name: "Student Form",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Teacher Form",
      href: "/teacher",
      icon: LayoutDashboard,
    },
    {
      name: "Chat with us",
      href: "/chat",
      icon: LayoutDashboard,
    },
    {
      name: "Voice Assistant",
      href: "/voiceassistant",
      icon: LayoutDashboard,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center p-2 rounded-md",
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="ml-2">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
