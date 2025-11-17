import React, { useEffect, useState } from "react";

const Applications = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [selected, setSelected] = useState(null);

  const headers = () => {
    const t = localStorage.getItem("token");
    return { Authorization: t ? `Bearer ${t}` : undefined, "Content-Type": "application/json" };
  };

  const load = async () => {
    setLoading(true);
    const qs = filter ? `?status=${encodeURIComponent(filter)}` : "";
    const res = await fetch(`http://localhost:3000/api/admin/applications${qs}` , { headers: headers(), credentials: 'include' });
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const act = async (id, action) => {
    await fetch(`http://localhost:3000/api/admin/applications/${id}/${action}`, { method: 'PATCH', headers: headers(), credentials: 'include' });
    setSelected(null);
    await load();
  };

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Student Applications</h3>
        <select className="p-2 rounded border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" value={filter} onChange={(e)=>setFilter(e.target.value)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-500 border-b border-gray-200 bg-gray-50"><tr>
              <th className="py-2 pr-4">Applicant</th>
              <th className="py-2 pr-4">Course</th>
              <th className="py-2 pr-4">Section</th>
              <th className="py-2 pr-4">School Year</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Actions</th>
            </tr></thead>
            <tbody>
              {items.map(a => (
                <tr key={a._id} className="border-b last:border-b-0 border-gray-200">
                  <td className="py-2 pr-4">{a.lastName}, {a.firstName} {a.middleInitial && (a.middleInitial + '.')} 
                    <div className="text-xs text-gray-500">{a.user?.email}</div>
                  </td>
                  <td className="py-2 pr-4">{a.course}</td>
                  <td className="py-2 pr-4">{a.section}</td>
                  <td className="py-2 pr-4">{a.schoolYear}</td>
                  <td className="py-2 pr-4"><span className={`px-2 py-0.5 rounded text-xs ${a.status==='approved'?'bg-emerald-100 text-emerald-700':a.status==='pending'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{a.status}</span></td>
                  <td className="py-2 pr-4 space-x-2">
                    <button onClick={()=>setSelected(a)} className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-800">View</button>
                    {a.status==='pending' && (
                      <>
                        <button onClick={()=>act(a._id,'approve')} className="px-2 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500 text-white">Approve</button>
                        <button onClick={()=>act(a._id,'reject')} className="px-2 py-1 text-xs rounded bg-red-600 hover:bg-red-500 text-white">Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-6 z-50" onClick={()=>setSelected(null)}>
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-xl p-6 shadow-2xl" onClick={(e)=>e.stopPropagation()}>
            <div className="text-lg font-semibold mb-2 text-gray-900">Application Details</div>
            <div className="text-sm text-gray-700 space-y-1">
              <div><span className="text-gray-500">Name:</span> {selected.lastName}, {selected.firstName} {selected.middleInitial && (selected.middleInitial + '.')}</div>
              <div><span className="text-gray-500">Email:</span> {selected.user?.email}</div>
              <div><span className="text-gray-500">Course:</span> {selected.course}</div>
              <div><span className="text-gray-500">Section:</span> {selected.section}</div>
              <div><span className="text-gray-500">School Year:</span> {selected.schoolYear}</div>
              <div><span className="text-gray-500">Status:</span> {selected.status}</div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              {selected.status==='pending' && (
                <>
                  <button onClick={()=>act(selected._id,'approve')} className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-sm text-white">Approve</button>
                  <button onClick={()=>act(selected._id,'reject')} className="px-3 py-2 rounded bg-red-600 hover:bg-red-500 text-sm text-white">Reject</button>
                </>
              )}
              <button onClick={()=>setSelected(null)} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
