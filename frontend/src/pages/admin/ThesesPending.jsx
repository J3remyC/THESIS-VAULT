import React, { useEffect, useState } from "react";

const ThesesPending = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = () => {
    const t = localStorage.getItem("token");
    return { Authorization: t ? `Bearer ${t}` : undefined };
  };

  const load = async () => {
    setLoading(true);
    const res = await fetch(`http://localhost:3000/api/admin/theses/pending`, {
      headers: headers(),
      credentials: "include",
    });
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    await fetch(`http://localhost:3000/api/admin/theses/${id}/${action}`, {
      method: "PATCH",
      headers: headers(),
      credentials: "include",
    });
    load();
  };

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3">Pending Approval</h3>
      {loading ? (<div className="text-sm text-gray-400">Loading...</div>) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-400 border-b border-gray-800"><tr><th className="py-2 pr-4">Title</th><th className="py-2 pr-4">Department</th><th className="py-2 pr-4">Uploader</th><th className="py-2 pr-4">Actions</th></tr></thead>
            <tbody>
              {items.map(i => (
                <tr key={i._id} className="border-b border-gray-900/60">
                  <td className="py-2 pr-4">{i.title}</td>
                  <td className="py-2 pr-4">{i.department || '—'}</td>
                  <td className="py-2 pr-4">{i.uploadedBy?.name} <span className="text-xs text-gray-500">{i.uploadedBy?.email}</span></td>
                  <td className="py-2 pr-4 space-x-2">
                    <button onClick={() => act(i._id, 'approve')} className="px-2 py-1 text-xs rounded bg-emerald-700 hover:bg-emerald-600">Approve</button>
                    <button onClick={() => act(i._id, 'reject')} className="px-2 py-1 text-xs rounded bg-red-700 hover:bg-red-600">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ThesesPending;
