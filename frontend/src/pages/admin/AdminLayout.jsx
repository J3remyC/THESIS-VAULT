import React from "react";
import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const AdminLayout = () => {
  const { user } = useAuthStore();
  return (
    <div className="fixed inset-0 flex flex-col bg-gray-950 text-white">
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
  );
};

export default AdminLayout;
