import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import FloatingShape from "../components/FloatingShape";
import ProfileInfo from "../components/dashboard/ProfileInfo";
import MyUploads from "../components/dashboard/MyUploads";
import AccountActivity from "../components/dashboard/AccountActivity";

const DashBoardPage = () => {
  const { user, logout, uploadFile } = useAuthStore();
  const [file, setFile] = useState(null);
  const [uploadedURL, setUploadedURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [myFiles, setMyFiles] = useState([]);

  const handleLogout = () => logout();

  const fetchFiles = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/upload");
      const data = await res.json();
      const validFiles = data.filter((f) => f.url);
      setFiles(validFiles);
    } catch (error) {
      console.error("Failed to fetch files:", error);
    }
  };

  const fetchMyFiles = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/upload/mine", {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
        credentials: "include",
      });
      const data = await res.json();
      setMyFiles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch my files", e);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchMyFiles();
  }, []);

  return (
    <div className="fixed inset-0 text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900" />
      <FloatingShape color="bg-green-500" size="w-64 h-64" top="-5%" left="10%" delay={0} />
      <FloatingShape color="bg-emerald-500" size="w-48 h-48" top="70%" left="80%" delay={5} />
      <FloatingShape color="bg-lime-500" size="w-32 h-32" top="40%" left="10%" delay={2} />

      <div className="relative z-10 flex flex-col h-full">
        <Navbar />
        <div className="flex flex-1 min-h-0">
          <Sidebar />

          {/* Main content area */}
          <main className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-semibold">Dashboard</h2>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLogout}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-md text-sm font-medium"
            >
              Logout
            </motion.button>
          </div>

          {/* Each section as a full-width row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Row 1 - Profile Info */}
            <div className="w-full bg-gray-900/60 border border-gray-800 p-6 rounded-xl shadow-md">
              <ProfileInfo user={user} />
            </div>

            {/* Row 2 - My Uploads */}
            {user.role !== "guest" && (
              <div className="w-full bg-gray-900/60 border border-gray-800 p-6 rounded-xl shadow-md">
                <MyUploads
                  myFiles={myFiles}
                  onChanged={() => {
                    fetchMyFiles();
                    fetchFiles();
                  }}
                />
              </div>
            )}

            {/* Row 3 - Account Activity */}
            <div className="w-full bg-gray-900/60 border border-gray-800 p-6 rounded-xl shadow-md">
              <AccountActivity />
            </div>
          </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashBoardPage;
