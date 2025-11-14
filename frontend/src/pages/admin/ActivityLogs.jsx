import React, { useEffect, useState } from "react";

const ActivityLogs = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const headers = () => {
    const t = localStorage.getItem("token");
    return { Authorization: t ? `Bearer ${t}` : undefined };
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3000/api/admin/logs?page=${page}&limit=${limit}` , { headers: headers(), credentials: "include" });
        const data = await res.json();
        if (data && Array.isArray(data.items)) {
          setItems(data.items);
          setTotalPages(data.totalPages || 1);
        } else if (Array.isArray(data)) {
          // Backward compatibility if server still returns array
          setItems(data);
          setTotalPages(1);
        } else {
          setItems([]);
          setTotalPages(1);
        }
      } catch {
        setItems([]);
        setTotalPages(1);
      }
      setLoading(false);
    };
    load();
  }, [page]);

  if (loading) return <div className="p-4 text-sm text-gray-400">Loading logs...</div>;

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3">Activity Logs</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-400 border-b border-gray-800"><tr><th className="py-2 pr-4">Actor</th><th className="py-2 pr-4">Action</th><th className="py-2 pr-4">Details</th><th className="py-2 pr-4">When</th></tr></thead>
          <tbody>
            {items.map(l => (
              <tr key={l._id} className="border-b border-gray-900/60">
                <td className="py-2 pr-4">{l.actor?.name} <span className="text-xs text-gray-500">{l.actor?.email}</span></td>
                <td className="py-2 pr-4">{l.action}</td>
                <td className="py-2 pr-4">{l.detailText || (l.details ? JSON.stringify(l.details) : "")}</td>
                <td className="py-2 pr-4">{new Date(l.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-2 pt-3">
        <button
          className="px-3 py-1 bg-gray-800 text-gray-200 rounded disabled:opacity-50"
          onClick={() => setPage(p => Math.max(p - 1, 1))}
          disabled={page <= 1 || loading}
        >Prev</button>
        <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
        <button
          className="px-3 py-1 bg-gray-800 text-gray-200 rounded disabled:opacity-50"
          onClick={() => setPage(p => Math.min(p + 1, totalPages))}
          disabled={page >= totalPages || loading}
        >Next</button>
      </div>
    </div>
  );
};

export default ActivityLogs;
