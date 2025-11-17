import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Edit3, Trash2, Save, X as IconX, FileText, Image as ImageIcon, File as FileIcon } from "lucide-react";

const MyUploads = ({ myFiles = [], onChanged }) => {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: "", author: "", course: "", yearPublished: "", department: "" });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const startEdit = (f) => {
    setEditingId(f._id);
    setForm({
      title: f.title || "",
      author: f.author || "",
      course: f.course || "",
      yearPublished: f.yearPublished || "",
      department: f.department || "",
    });
  };

  const saveEdit = async () => {
    try {
      await fetch(`http://localhost:3000/api/upload/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : undefined },
        credentials: "include",
        body: JSON.stringify(form),
      });
      setEditingId(null);
      onChanged && onChanged();
    } catch {}
  };

  const deleteItem = async (id) => {
    try {
      await fetch(`http://localhost:3000/api/upload/${id}` , {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
        credentials: "include",
      });
      setConfirmId(null);
      onChanged && onChanged();
    } catch {}
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return myFiles
      .filter((f) => !status || f.status === status)
      .filter((f) => {
        if (!q) return true;
        return (
          (f.title || "").toLowerCase().includes(q) ||
          (f.author || "").toLowerCase().includes(q) ||
          (f.filename || "").toLowerCase().includes(q) ||
          (f.course || "").toLowerCase().includes(q)
        );
      });
  }, [myFiles, query, status]);

  const timeLeft = (f) => {
    if (!f.trashedAt) return null;
    const now = Date.now();
    const t = new Date(f.trashedAt).getTime();
    const msLeft = 24 * 3600 * 1000 - (now - t);
    if (msLeft <= 0) return "pending deletion";
    const hours = Math.floor(msLeft / 3600000);
    const mins = Math.floor((msLeft % 3600000) / 60000);
    return `${hours}h ${mins}m left`;
  };

  const Badge = ({ f }) => {
    const ext = (f.format || (f.filename || "").split(".").pop() || "").toLowerCase();
    const isImg = ["png","jpg","jpeg","webp"].includes(ext);
    const isDoc = ["pdf","doc","docx"].includes(ext);
    const Icon = isImg ? ImageIcon : isDoc ? FileText : FileIcon;
    const label = ext || "file";
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-800 text-xs text-gray-300 border border-gray-700">
        <Icon size={14} />
        <span className="uppercase">{label}</span>
      </div>
    );
  };

  return (
    <motion.div
      className="p-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
    >
      <h3 className="text-lg font-semibold mb-3">My Uploads</h3>
      <div className="mb-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <input
            className="p-2 rounded bg-gray-800 border border-gray-700 text-sm"
            placeholder="Search uploads"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="p-2 rounded bg-gray-800 border border-gray-700 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="md:hidden grid grid-cols-1 gap-3">
        {filtered.map((f) => (
          <div key={f._id} className="p-4 rounded-lg border border-gray-800 bg-gray-900/60">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge f={f} />
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    f.status === 'approved' ? 'bg-emerald-600/30 text-emerald-300' :
                    f.status === 'rejected' ? 'bg-red-600/30 text-red-300' :
                    'bg-yellow-600/30 text-yellow-300'
                  }`}>{f.status}</span>
                  {f.trashed && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-gray-700/50 text-gray-200 border border-gray-700">
                      In Trash • {timeLeft(f) || 'auto-deletes in 1 day'}
                    </span>
                  )}
                </div>
                <div className="font-medium text-gray-200 mt-1 truncate">{f.title}</div>
                <div className="text-xs text-gray-500 truncate">{f.author} • {f.filename}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {f.url && (
                  <a href={f.url} target="_blank" rel="noreferrer" className="p-2 rounded bg-gray-800 hover:bg-gray-700">
                    <Eye size={16} />
                  </a>
                )}
                {editingId === f._id ? (
                  <>
                    <button onClick={saveEdit} className="p-2 rounded bg-emerald-700 hover:bg-emerald-600"><Save size={16} /></button>
                    <button onClick={()=>setEditingId(null)} className="p-2 rounded bg-gray-800 hover:bg-gray-700"><IconX size={16} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={()=>startEdit(f)} className="p-2 rounded bg-blue-800 hover:bg-blue-700"><Edit3 size={16} /></button>
                    <button onClick={()=>setConfirmId(f._id)} className="p-2 rounded bg-red-800 hover:bg-red-700"><Trash2 size={16} /></button>
                  </>
                )}
              </div>
            </div>

            {editingId === f._id && (
              <div className="grid grid-cols-1 gap-2 mt-3">
                <input className="p-2 rounded bg-gray-800 border border-gray-700" placeholder="Title" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} />
                <input className="p-2 rounded bg-gray-800 border border-gray-700" placeholder="Author" value={form.author} onChange={(e)=>setForm({...form,author:e.target.value})} />
                <input className="p-2 rounded bg-gray-800 border border-gray-700" placeholder="Course" value={form.course} onChange={(e)=>setForm({...form,course:e.target.value})} />
                <input className="p-2 rounded bg-gray-800 border border-gray-700" placeholder="Year" type="number" value={form.yearPublished} onChange={(e)=>setForm({...form,yearPublished:e.target.value})} />
                <input className="p-2 rounded bg-gray-800 border border-gray-700" placeholder="Department code (e.g., BSCS)" value={form.department} onChange={(e)=>setForm({...form,department:e.target.value})} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-400 border-b border-gray-800">
            <tr>
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Department</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f._id} className="border-b border-gray-900/60 hover:bg-gray-900/40">
                <td className="py-2 pr-4 align-top">
                  {editingId === f._id ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input className="p-2 rounded bg-gray-800 border border-gray-700" placeholder="Title" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} />
                      <input className="p-2 rounded bg-gray-800 border border-gray-700" placeholder="Author" value={form.author} onChange={(e)=>setForm({...form,author:e.target.value})} />
                      <input className="p-2 rounded bg-gray-800 border border-gray-700" placeholder="Course" value={form.course} onChange={(e)=>setForm({...form,course:e.target.value})} />
                      <input className="p-2 rounded bg-gray-800 border border-gray-700" placeholder="Year" type="number" value={form.yearPublished} onChange={(e)=>setForm({...form,yearPublished:e.target.value})} />
                      <input className="p-2 rounded bg-gray-800 border border-gray-700 md:col-span-2" placeholder="Department code (e.g., BSCS)" value={form.department} onChange={(e)=>setForm({...form,department:e.target.value})} />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge f={f} />
                        <div className="font-medium text-gray-200">{f.title}</div>
                        {f.trashed && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-gray-700/50 text-gray-200 border border-gray-700">
                            In Trash • {timeLeft(f) || 'auto-deletes in 1 day'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{f.filename}</div>
                      <div className="text-xs text-gray-500">{f.author}</div>
                    </div>
                  )}
                </td>
                <td className="py-2 pr-4 text-gray-300 align-top">{f.department || "—"}</td>
                <td className="py-2 pr-4 align-top">
                  <div className="space-y-1">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      f.status === 'approved' ? 'bg-emerald-600/30 text-emerald-300' :
                      f.status === 'rejected' ? 'bg-red-600/30 text-red-300' :
                      'bg-yellow-600/30 text-yellow-300'
                    }`}>
                      {f.status}
                    </span>
                    {f.status === 'rejected' && f.rejectionReason && (
                      <div className="text-xs text-red-300/90 max-w-xs">Reason: {f.rejectionReason}</div>
                    )}
                  </div>
                </td>
                <td className="py-2 pr-4 align-top">
                  <div className="flex items-center gap-2">
                    {f.url && (
                      <a href={f.url} target="_blank" rel="noreferrer" className="p-2 rounded bg-gray-800 hover:bg-gray-700"><Eye size={16} /></a>
                    )}
                    {editingId === f._id ? (
                      <>
                        <button onClick={saveEdit} className="p-2 rounded bg-emerald-700 hover:bg-emerald-600"><Save size={16} /></button>
                        <button onClick={()=>setEditingId(null)} className="p-2 rounded bg-gray-800 hover:bg-gray-700"><IconX size={16} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={()=>startEdit(f)} className="p-2 rounded bg-blue-800 hover:bg-blue-700"><Edit3 size={16} /></button>
                        <button onClick={()=>setConfirmId(f._id)} className="p-2 rounded bg-red-800 hover:bg-red-700"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-lg border border-gray-800 bg-gray-900 p-5">
            <div className="text-lg font-semibold mb-2">Delete upload?</div>
            <div className="text-sm text-gray-400 mb-4">This action cannot be undone.</div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmId(null)} className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-sm">Cancel</button>
              <button onClick={() => deleteItem(confirmId)} className="px-3 py-1.5 rounded bg-red-700 hover:bg-red-600 text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MyUploads;
