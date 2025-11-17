import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const ProfileInfo = ({ user }) => {
  const [approvedApp, setApprovedApp] = useState(null);

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
  }, []);

  const fullName = approvedApp
    ? `${approvedApp.lastName || ""}, ${approvedApp.firstName || ""}${approvedApp.middleInitial ? " " + approvedApp.middleInitial + "." : ""}`
    : user.name;
  const section = approvedApp ? `4 - ${approvedApp.section || ""}` : "—";
  const course = approvedApp ? approvedApp.course || "" : "—";
  const sy = approvedApp ? approvedApp.schoolYear || "" : "—";

  return (
    <motion.div
      className="p-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <h3 className="text-lg font-semibold mb-3">Profile Information</h3>
      <p className="text-gray-300">Name: {fullName}</p>
      <p className="text-gray-300">Email: {user.email}</p>
      <p className="text-gray-300">Section: {section}</p>
      <p className="text-gray-300">Course: {course}</p>
      <p className="text-gray-300">School year: {sy}</p>
    </motion.div>
  );
};

export default ProfileInfo;
