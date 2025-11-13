import React, { useEffect, useState } from "react";

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = () => {
    const t = localStorage.getItem("token");
    return { Authorization: t ? `Bearer ${t}` : undefined };
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/admin/logs", { headers: headers(), credentials: "include" });
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="p-4 text-sm text-gray-400">Loading logs...</div>;

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3">Activity Logs</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-400 border-b border-gray-800"><tr><th className="py-2 pr-4">Actor</th><th className="py-2 pr-4">Action</th><th className="py-2 pr-4">Details</th><th className="py-2 pr-4">When</th></tr></thead>
          <tbody>
            {logs.map(l => (
              <tr key={l._id} className="border-b border-gray-900/60">
                <td className="py-2 pr-4">{l.actor?.name} <span className="text-xs text-gray-500">{l.actor?.email}</span></td>
                <td className="py-2 pr-4">{l.action}</td>
                <td className="py-2 pr-4">{l.details ? JSON.stringify(l.details) : ""}</td>
                <td className="py-2 pr-4">{new Date(l.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLogs;
