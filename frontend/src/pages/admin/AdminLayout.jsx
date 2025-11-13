import React from "react";
import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import FloatingShape from "../../components/FloatingShape";

const AdminLayout = () => {
  const { user } = useAuthStore();
  return (
    <div className="fixed inset-0 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900" />
      <FloatingShape color="bg-green-500" size="w-64 h-64" top="-5%" left="10%" delay={0} />
      <FloatingShape color="bg-emerald-500" size="w-48 h-48" top="70%" left="80%" delay={5} />
      <FloatingShape color="bg-lime-500" size="w-32 h-32" top="40%" left="10%" delay={2} />

      <div className="relative z-10 flex flex-col h-full">
        <Navbar />
        <div className="flex flex-1 min-h-0">
          <AdminSidebar user={user} />
          <div className="flex-1 min-w-0 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
