import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

const ThesesTrash = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const headers = () => {
    const t = localStorage.getItem("token");
    return { Authorization: t ? `Bearer ${t}` : undefined };
  };

  const load = async () => {
    setLoading(true);
    const res = await fetch(`http://localhost:3000/api/admin/theses/trash`, {
      headers: headers(),
      credentials: "include",
    });
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const restore = async (id) => {
    await fetch(`http://localhost:3000/api/admin/theses/${id}/restore`, {
      method: 'POST',
      headers: headers(),
      credentials: 'include',
    });
    setSelected(null);
    await load();
  };

  const purge = async (id) => {
    if (!window.confirm('Permanently delete this thesis? This cannot be undone.')) return;
    await fetch(`http://localhost:3000/api/admin/theses/${id}/purge`, {
      method: 'DELETE',
      headers: headers(),
      credentials: 'include',
    });
    setSelected(null);
    await load();
  };

  const timeLeft = (trashedAt) => {
    if (!trashedAt) return '—';
    const expires = new Date(new Date(trashedAt).getTime() + 24*60*60*1000);
    const diff = expires - Date.now();
    if (diff <= 0) return 'scheduled for deletion';
    const hrs = Math.floor(diff / (60*60*1000));
    const mins = Math.floor((diff % (60*60*1000)) / (60*1000));
    return `${hrs}h ${mins}m remaining`;
  };

  const rejected = items.filter(i => i.trashReason === 'rejected');
  const deleted = items.filter(i => i.trashReason === 'deleted' || !i.trashReason);

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3">Trash Bin</h3>
      <p className="text-xs text-gray-400 mb-3">Items here are auto-deleted after 24 hours. You can restore or permanently delete them.</p>
      {loading ? (<div className="text-sm text-gray-400">Loading...</div>) : (
        <>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-red-300">Rejected ({rejected.length})</h4>
              </div>
              {rejected.length === 0 ? (
                <div className="text-xs text-gray-500">No rejected items in trash.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rejected.map(i => (
                    <div key={i._id} className="p-4 rounded border border-gray-800 bg-gray-900/60 hover:bg-gray-900/70 cursor-pointer" onClick={()=>setSelected(i)}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-gray-200 line-clamp-2">{i.title}</div>
                          <div className="text-xs text-gray-400">{i.uploadedBy?.name} <span className="text-gray-500">{i.uploadedBy?.email}</span></div>
                          <div className="mt-1 text-xs text-gray-500">Trashed: {new Date(i.trashedAt).toLocaleString()} • {timeLeft(i.trashedAt)}</div>
                          {i.rejectionReason && <div className="text-xs text-red-300/90 mt-1">Reason: {i.rejectionReason}</div>}
                        </div>
                        <span className="px-2 py-0.5 rounded text-xs bg-red-700/30 text-red-300">rejected</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-300">Deleted ({deleted.length})</h4>
              </div>
              {deleted.length === 0 ? (
                <div className="text-xs text-gray-500">No deleted items in trash.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deleted.map(i => (
                    <div key={i._id} className="p-4 rounded border border-gray-800 bg-gray-900/60 hover:bg-gray-900/70 cursor-pointer" onClick={()=>setSelected(i)}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-gray-200 line-clamp-2">{i.title}</div>
                          <div className="text-xs text-gray-400">{i.uploadedBy?.name} <span className="text-gray-500">{i.uploadedBy?.email}</span></div>
                          <div className="mt-1 text-xs text-gray-500">Trashed: {new Date(i.trashedAt).toLocaleString()} • {timeLeft(i.trashedAt)}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-700/30 text-gray-300">deleted</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selected && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50" onClick={()=>setSelected(null)}>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl" onClick={(e)=>e.stopPropagation()}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xl font-semibold text-emerald-400">Trashed Thesis</h4>
                  <button onClick={()=>setSelected(null)} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700"><X className="w-5 h-5 text-gray-300" /></button>
                </div>
                <div className="mb-4">
                  <div className="text-lg font-medium text-gray-200">{selected.title}</div>
                  <div className="text-xs text-gray-400">{selected.uploadedBy?.name} <span className="text-gray-500">{selected.uploadedBy?.email}</span></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Description</div>
                    <div className="p-3 rounded bg-gray-900/60 border border-gray-800 min-h-[100px]">{selected.description || 'No description provided.'}</div>
                  </div>
                  <div className="space-y-2">
                    <div><span className="text-gray-400">Department:</span> {selected.department || '—'}</div>
                    <div><span className="text-gray-400">Year:</span> {selected.yearPublished || '—'}</div>
                    <div className="text-xs text-gray-500">Will auto-delete: {new Date(new Date(selected.trashedAt).getTime() + 24*60*60*1000).toLocaleString()}</div>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {selected.url && (
                        <a href={selected.url} target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-xs">View</a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button onClick={()=>restore(selected._id)} className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm">Restore</button>
                  <button onClick={()=>purge(selected._id)} className="px-3 py-2 rounded bg-red-700 hover:bg-red-600 text-sm">Delete Permanently</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ThesesTrash;
