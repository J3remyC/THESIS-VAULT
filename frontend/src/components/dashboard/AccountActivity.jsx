import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const AccountActivity = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const paged = useMemo(() => {
    const start = page * pageSize;
    return logs.slice(start, start + pageSize);
  }, [logs, page]);

  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));

  const renderDetails = (details) => {
    if (!details) return "";
    if (details.title) return `“${details.title}”`;
    if (details.fileId && details.updates) return `Edited #${details.fileId}`;
    if (details.fileId) return `File #${details.fileId}`;
    if (typeof details === 'string') return details;
    return Object.entries(details)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
      .join(', ');
  };

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
              {paged.map((l) => (
                <tr key={l._id} className="border-b border-gray-900/60">
                  <td className="py-2 pr-4">{l.action}</td>
                  <td className="py-2 pr-4">{renderDetails(l.details)}</td>
                  <td className="py-2 pr-4">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center justify-end gap-2 text-xs text-gray-400">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className={`px-2 py-1 rounded ${page === 0 ? 'bg-gray-800 text-gray-500' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              Prev
            </button>
            <span>Page {page + 1} / {totalPages}</span>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className={`px-2 py-1 rounded ${page + 1 >= totalPages ? 'bg-gray-800 text-gray-500' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AccountActivity;
