import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

import VerifiedBadge from "../VerifiedBadge";

const ProfileInfo = ({ user }) => {
  const [approvedApp, setApprovedApp] = useState(null);
  const [uploadsCount, setUploadsCount] = useState(0);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const headers = { Authorization: t ? `Bearer ${t}` : undefined };
    (async () => {
      try {
        const res = await fetch("http://localhost:3000/api/applications/mine", { headers, credentials: "include" });
        const data = await res.json();
        const approved = Array.isArray(data) ? data.find(a => a.status === "approved") : null;
        setApprovedApp(approved || null);
      } catch {}
    })();
    (async () => {
      try {
        const res = await fetch("http://localhost:3000/api/upload/mine", { headers, credentials: "include" });
        const data = await res.json();
        setUploadsCount(Array.isArray(data) ? data.length : 0);
      } catch {}
    })();
  }, []);

  const fullName = approvedApp
    ? `${approvedApp.lastName || ""}, ${approvedApp.firstName || ""}${approvedApp.middleInitial ? " " + approvedApp.middleInitial + "." : ""}`
    : user.name;
  const section = approvedApp ? `4 - ${approvedApp.section || ""}` : "—";
  const course = approvedApp ? approvedApp.course || "" : "—";
  const sy = approvedApp ? approvedApp.schoolYear || "" : "—";

  const username = user?.username || (user?.email ? user.email.split("@")[0] : "");
  const initials = (() => {
    const src = (fullName || "").replace(",", " ").trim();
    const parts = src.split(/\s+/).filter(Boolean);
    const chars = parts.slice(0, 2).map(p => p[0]?.toUpperCase()).join("");
    return chars || (user?.name ? user.name[0]?.toUpperCase() : "U");
  })();
  const role = user?.role || "guest";
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—";
  const lastLogin = user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : null;

  return (
    <motion.div
      className="p-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
      </div>
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-lg">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{fullName || '—'}</h3>
            <VerifiedBadge isVerified={!!(user?.isVerified || approvedApp)} size="sm" />
            {role === 'student' && (
              <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">Student</span>
            )}
            {role === 'guest' && (
              <>
                <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">Guest</span>
                <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700">Unverified</span>
              </>
            )}
            {approvedApp && (
              <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">Verified Student</span>
            )}
          </div>
          <div className="text-sm text-gray-600 mt-0.5 break-all">@{username}</div>
          <div className="text-sm text-gray-700">{user.email}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">Course</div>
          <div className="text-sm text-gray-900">{course || '—'}</div>
        </div>
        <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">Section</div>
          <div className="text-sm text-gray-900">{section || '—'}</div>
        </div>
        <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">School Year</div>
          <div className="text-sm text-gray-900">{sy || '—'}</div>
        </div>
      </div>

      <div className="mt-3">
        <div className="text-xs text-gray-500 mb-2">Account Stats</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-gray-200 bg-white">
            <div className="text-xs text-gray-500">Member since</div>
            <div className="text-sm text-gray-900">{memberSince}</div>
          </div>
          <div className="p-3 rounded-lg border border-gray-200 bg-white">
            <div className="text-xs text-gray-500">Last login</div>
            <div className="text-sm text-gray-900">{lastLogin || '—'}</div>
          </div>
          <div className="p-3 rounded-lg border border-gray-200 bg-white">
            <div className="text-xs text-gray-500">Uploads</div>
            <div className="text-sm text-gray-900">{uploadsCount}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileInfo;
