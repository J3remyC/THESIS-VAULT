import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const AccountActivity = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/api/upload/logs/mine", {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
          credentials: "include",
        });
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  return (
    <motion.div
      className="p-4 bg-gray-900/60 rounded-lg border border-gray-800"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h3 className="text-lg font-semibold mb-3">Account Activity</h3>
      {loading ? (
        <div className="text-sm text-gray-400">Loading activity...</div>
      ) : logs.length === 0 ? (
        <div className="text-sm text-gray-500">No recent activity.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-400 border-b border-gray-800">
              <tr>
                <th className="py-2 pr-4">Action</th>
                <th className="py-2 pr-4">Details</th>
                <th className="py-2 pr-4">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id} className="border-b border-gray-900/60">
                  <td className="py-2 pr-4">{l.action}</td>
                  <td className="py-2 pr-4">{l.details ? JSON.stringify(l.details) : ""}</td>
                  <td className="py-2 pr-4">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

export default AccountActivity;
