import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

const ThesesPending = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

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
      <h3 className="font-semibold mb-3 text-gray-900">Pending Approval</h3>
      {loading ? (<div className="text-sm text-gray-500">Loading...</div>) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(i => (
              <div key={i._id} className="p-4 rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer" onClick={()=>setSelected(i)}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-gray-900 line-clamp-2">{i.title}</div>
                    <div className="text-xs text-gray-500">{i.uploadedBy?.name} <span className="text-gray-500">{i.uploadedBy?.email}</span></div>
                    <div className="mt-1 text-xs text-gray-500">Dept: {i.department || '—'}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">pending</span>
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-6 z-50" onClick={()=>setSelected(null)}>
              <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-3xl p-6 shadow-2xl" onClick={(e)=>e.stopPropagation()}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xl font-semibold text-gray-900">Review Submission</h4>
                  <button onClick={()=>setSelected(null)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"><X className="w-5 h-5 text-gray-700" /></button>
                </div>
                <div className="mb-4">
                  <div className="text-lg font-medium text-gray-900">{selected.title}</div>
                  <div className="text-xs text-gray-500">{selected.uploadedBy?.name} <span className="text-gray-500">{selected.uploadedBy?.email}</span></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Description</div>
                    <div className="p-3 rounded bg-white border border-gray-200 min-h-[100px]">{selected.description || 'No description provided.'}</div>
                  </div>
                  <div className="space-y-2">
                    <div><span className="text-gray-500">Department:</span> {selected.department || '—'}</div>
                    <div><span className="text-gray-500">Year:</span> {selected.yearPublished || '—'}</div>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {selected.url && (
                        <a href={selected.url} target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-primary hover:brightness-110 text-xs text-white">View</a>
                      )}
                      {selected && (
                        <a href={`http://localhost:3000/api/upload/${selected._id}/download`} target="_blank" rel="noreferrer" download={selected.filename || undefined} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-xs text-gray-900">Download</a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button onClick={()=>{ act(selected._id, 'approve'); setSelected(null); }} className="px-3 py-2 rounded bg-primary hover:brightness-110 text-sm text-white">Approve</button>
                  <button onClick={()=>{ act(selected._id, 'reject'); setSelected(null); }} className="px-3 py-2 rounded bg-red-600 hover:bg-red-500 text-sm text-white">Reject</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ThesesPending;
