import React, { useEffect, useState } from "react";

const ThesesAll = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");

  const headers = () => {
    const t = localStorage.getItem("token");
    return { Authorization: t ? `Bearer ${t}` : undefined };
  };

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (department) params.set("department", department);
    if (status) params.set("status", status);
    const res = await fetch(`http://localhost:3000/api/admin/theses?${params.toString()}`, {
      headers: headers(),
      credentials: "include",
    });
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3">All Submissions</h3>
      <div className="flex gap-2 mb-3">
        <input className="p-2 rounded bg-gray-800 border border-gray-700" placeholder="Department filter" value={department} onChange={e=>setDepartment(e.target.value)} />
        <select className="p-2 rounded bg-gray-800 border border-gray-700" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">any status</option>
          <option value="approved">approved</option>
          <option value="pending">pending</option>
          <option value="rejected">rejected</option>
        </select>
        <button onClick={load} className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-sm">Apply</button>
      </div>
      {loading ? (<div className="text-sm text-gray-400">Loading...</div>) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-400 border-b border-gray-800"><tr><th className="py-2 pr-4">Title</th><th className="py-2 pr-4">Department</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Uploader</th></tr></thead>
            <tbody>
              {items.map(i => (
                <tr key={i._id} className="border-b border-gray-900/60">
                  <td className="py-2 pr-4">{i.title}</td>
                  <td className="py-2 pr-4">{i.department || '—'}</td>
                  <td className="py-2 pr-4">{i.status}</td>
                  <td className="py-2 pr-4">{i.uploadedBy?.name} <span className="text-xs text-gray-500">{i.uploadedBy?.email}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ThesesAll;
