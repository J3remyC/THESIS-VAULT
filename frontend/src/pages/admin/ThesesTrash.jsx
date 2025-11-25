import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import VerifiedBadge from "../../components/VerifiedBadge";

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
      <h3 className="font-semibold mb-3 text-gray-900">Trash Bin</h3>
      <p className="text-xs text-gray-500 mb-3">Items here are auto-deleted after 24 hours. You can restore or permanently delete them.</p>
      {loading ? (<div className="text-sm text-gray-500">Loading...</div>) : (
        <>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-red-700">Rejected ({rejected.length})</h4>
              </div>
              {rejected.length === 0 ? (
                <div className="text-xs text-gray-500">No rejected items in trash.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rejected.map(i => (
                    <div key={i._id} className="p-4 rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer" onClick={()=>setSelected(i)}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-gray-900 line-clamp-2">{i.title}</div>
                          <div className="text-xs text-gray-500">{i.uploadedBy?.name} <VerifiedBadge isVerified={i.uploadedBy?.isVerified} size="xs" /> <span className="text-gray-500">{i.uploadedBy?.email}</span></div>
                          <div className="mt-1 text-xs text-gray-500">Trashed: {new Date(i.trashedAt).toLocaleString()} • {timeLeft(i.trashedAt)}</div>
                          {i.rejectionReason && <div className="text-xs text-red-700 mt-1">Reason: {i.rejectionReason}</div>}
                        </div>
                        <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">rejected</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">Deleted ({deleted.length})</h4>
              </div>
              {deleted.length === 0 ? (
                <div className="text-xs text-gray-500">No deleted items in trash.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deleted.map(i => (
                    <div key={i._id} className="p-4 rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer" onClick={()=>setSelected(i)}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-gray-900 line-clamp-2">{i.title}</div>
                          <div className="text-xs text-gray-500">{i.uploadedBy?.name} <VerifiedBadge isVerified={i.uploadedBy?.isVerified} size="xs" /> <span className="text-gray-500">{i.uploadedBy?.email}</span></div>
                          <div className="mt-1 text-xs text-gray-500">Trashed: {new Date(i.trashedAt).toLocaleString()} • {timeLeft(i.trashedAt)}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">deleted</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selected && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-6 z-50" onClick={()=>setSelected(null)}>
              <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-3xl p-6 shadow-2xl" onClick={(e)=>e.stopPropagation()}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xl font-semibold text-gray-900">Trashed Thesis</h4>
                  <button onClick={()=>setSelected(null)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"><X className="w-5 h-5 text-gray-700" /></button>
                </div>
                <div className="mb-4">
                  <div className="text-lg font-medium text-gray-900">{selected.title}</div>
                  <div className="text-xs text-gray-500">{selected.uploadedBy?.name} <VerifiedBadge isVerified={selected.uploadedBy?.isVerified} size="xs" /> <span className="text-gray-500">{selected.uploadedBy?.email}</span></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Description</div>
                    <div className="p-3 rounded bg-white border border-gray-200 min-h-[100px]">{selected.description || 'No description provided.'}</div>
                  </div>
                  <div className="space-y-2">
                    <div><span className="text-gray-500">Department:</span> {selected.department || '—'}</div>
                    <div><span className="text-gray-500">Year:</span> {selected.yearPublished || '—'}</div>
                    <div className="text-xs text-gray-500">Will auto-delete: {new Date(new Date(selected.trashedAt).getTime() + 24*60*60*1000).toLocaleString()}</div>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {selected.url && (
                        <a href={selected.url} target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-primary hover:brightness-110 text-xs text-white">View</a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button onClick={()=>restore(selected._id)} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm text-gray-900">Restore</button>
                  <button onClick={()=>purge(selected._id)} className="px-3 py-2 rounded bg-red-600 hover:bg-red-500 text-sm text-white">Delete Permanently</button>
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
