import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, Edit3, Trash2, Save, X as IconX, FileText, Image as ImageIcon, File as FileIcon } from "lucide-react";

const MyUploads = ({ myFiles = [], onChanged }) => {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: "", author: "", course: "", yearPublished: "", department: "" });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewType, setPreviewType] = useState("");
  const [previewOriginalUrl, setPreviewOriginalUrl] = useState("");
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const openPreview = async (file) => {
    if (!file?._id) return;
    setPreviewError("");
    setPreviewLoading(true);
    setPreviewOpen(true);
    try {
      const res = await fetch(`http://localhost:3000/api/upload/${file._id}/download`, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const type = res.headers.get("Content-Type") || blob.type || "";
      const url = URL.createObjectURL(blob);
      if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      setPreviewType(type);
      setPreviewUrl(url);
      setPreviewOriginalUrl(file?.url || "");
    } catch (e) {
      if (file?.url) {
        const ext = (file.url.split(".").pop() || "").toLowerCase();
        const guessed = ext === 'pdf' ? 'application/pdf' : ext.match(/png|jpe?g|webp|gif/) ? `image/${ext==='jpg'?'jpeg':ext}` : '';
        setPreviewType(guessed);
        setPreviewUrl(file.url);
        setPreviewOriginalUrl(file.url);
        setPreviewError("");
      } else {
        setPreviewError("Failed to load preview. Try downloading instead.");
      }
    } finally {
      setPreviewLoading(false);
    }
  };

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
            className="p-2 rounded bg-white border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400"
            placeholder="Search uploads"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="p-2 rounded bg-white border border-gray-300 text-sm text-gray-900"
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
          <div key={f._id} className="p-4 rounded-lg border border-gray-200 bg-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge f={f} />
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    f.status === 'approved' ? 'bg-primary/10 text-primary' :
                    f.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{f.status}</span>
                  {f.trashed && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700 border border-gray-200">
                      In Trash • {timeLeft(f) || 'auto-deletes in 1 day'}
                    </span>
                  )}
                </div>
                <div className="font-medium text-gray-900 mt-1 truncate">{f.title}</div>
                <div className="text-xs text-gray-500 truncate">{f.author} • {f.filename}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {f._id && (
                  <button onClick={() => openPreview(f)} className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-900">
                    <Eye size={16} />
                  </button>
                )}
                {editingId === f._id ? (
                  <>
                    <button onClick={saveEdit} className="p-2 rounded bg-primary hover:brightness-110 text-white"><Save size={16} /></button>
                    <button onClick={()=>setEditingId(null)} className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-900"><IconX size={16} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={()=>startEdit(f)} className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-900"><Edit3 size={16} /></button>
                    <button onClick={()=>setConfirmId(f._id)} className="p-2 rounded bg-red-600 hover:bg-red-500 text-white"><Trash2 size={16} /></button>
                  </>
                )}
              </div>
            </div>

            {editingId === f._id && (
              <div className="grid grid-cols-1 gap-2 mt-3">
                <input className="p-2 rounded bg-white border border-gray-300 text-gray-900" placeholder="Title" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} />
                <input className="p-2 rounded bg-white border border-gray-300 text-gray-900" placeholder="Author" value={form.author} onChange={(e)=>setForm({...form,author:e.target.value})} />
                <input className="p-2 rounded bg-white border border-gray-300 text-gray-900" placeholder="Course" value={form.course} onChange={(e)=>setForm({...form,course:e.target.value})} />
                <input className="p-2 rounded bg-white border border-gray-300 text-gray-900" placeholder="Year" type="number" value={form.yearPublished} onChange={(e)=>setForm({...form,yearPublished:e.target.value})} />
                <input className="p-2 rounded bg-white border border-gray-300 text-gray-900" placeholder="Department code (e.g., BSCS)" value={form.department} onChange={(e)=>setForm({...form,department:e.target.value})} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-500 border-b border-gray-200">
            <tr>
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Department</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f._id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-4 align-top">
                  {editingId === f._id ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input className="p-2 rounded bg-white border border-gray-300 text-gray-900" placeholder="Title" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} />
                      <input className="p-2 rounded bg-white border border-gray-300 text-gray-900" placeholder="Author" value={form.author} onChange={(e)=>setForm({...form,author:e.target.value})} />
                      <input className="p-2 rounded bg-white border border-gray-300 text-gray-900" placeholder="Course" value={form.course} onChange={(e)=>setForm({...form,course:e.target.value})} />
                      <input className="p-2 rounded bg-white border border-gray-300 text-gray-900" placeholder="Year" type="number" value={form.yearPublished} onChange={(e)=>setForm({...form,yearPublished:e.target.value})} />
                      <input className="p-2 rounded bg-white border border-gray-300 text-gray-900 md:col-span-2" placeholder="Department code (e.g., BSCS)" value={form.department} onChange={(e)=>setForm({...form,department:e.target.value})} />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge f={f} />
                        <div className="font-medium text-gray-900">{f.title}</div>
                        {f.trashed && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700 border border-gray-200">
                            In Trash • {timeLeft(f) || 'auto-deletes in 1 day'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{f.filename}</div>
                      <div className="text-xs text-gray-500">{f.author}</div>
                    </div>
                  )}
                </td>
                <td className="py-2 pr-4 text-gray-700 align-top">{f.department || "—"}</td>
                <td className="py-2 pr-4 align-top">
                  <div className="space-y-1">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      f.status === 'approved' ? 'bg-primary/10 text-primary' :
                      f.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {f.status}
                    </span>
                    {f.status === 'rejected' && f.rejectionReason && (
                      <div className="text-xs text-red-700 max-w-xs">Reason: {f.rejectionReason}</div>
                    )}
                  </div>
                </td>
                <td className="py-2 pr-4 align-top">
                  <div className="flex items-center gap-2">
                    {f._id && (
                      <button onClick={() => openPreview(f)} className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-900"><Eye size={16} /></button>
                    )}
                    {editingId === f._id ? (
                      <>
                        <button onClick={saveEdit} className="p-2 rounded bg-primary hover:brightness-110 text-white"><Save size={16} /></button>
                        <button onClick={()=>setEditingId(null)} className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-900"><IconX size={16} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={()=>startEdit(f)} className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-900"><Edit3 size={16} /></button>
                        <button onClick={()=>setConfirmId(f._id)} className="p-2 rounded bg-red-600 hover:bg-red-500 text-white"><Trash2 size={16} /></button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-5">
            <div className="text-lg font-semibold mb-2 text-gray-900">Delete upload?</div>
            <div className="text-sm text-gray-500 mb-4">This action cannot be undone.</div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmId(null)} className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-sm text-gray-900">Cancel</button>
              <button onClick={() => deleteItem(confirmId)} className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-sm text-white">Delete</button>
            </div>
          </div>
        </div>
      )}

      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPreviewOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-5xl h-[80vh] flex flex-col" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-gray-200 gap-2">
              <div className="text-sm text-gray-700 truncate">Preview</div>
              <div className="flex items-center gap-2">
                {previewUrl && (
                  <a href={previewUrl} target="_blank" rel="noreferrer" className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs text-gray-900">Open in new tab</a>
                )}
                {previewOriginalUrl && (
                  <>
                    <a href={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewOriginalUrl)}`} target="_blank" rel="noreferrer" className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs text-gray-900">Office Viewer</a>
                    <a href={`https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(previewOriginalUrl)}`} target="_blank" rel="noreferrer" className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs text-gray-900">Google Viewer</a>
                  </>
                )}
                <button onClick={() => setPreviewOpen(false)} className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-sm text-gray-900">Close</button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              {previewLoading ? (
                <div className="w-full h-full flex items-center justify-center text-sm text-gray-600">Loading preview...</div>
              ) : previewError ? (
                <div className="p-4 text-sm text-red-600">{previewError}</div>
              ) : (
                previewType.startsWith("image/") ? (
                  <img alt="Preview" src={previewUrl} className="w-full h-full object-contain" />
                ) : previewType === "application/pdf" || previewType.includes("pdf") ? (
                  <iframe title="File preview" src={previewUrl} className="w-full h-full" />
                ) : previewType.startsWith("video/") ? (
                  <video controls className="w-full h-full"><source src={previewUrl} type={previewType} /></video>
                ) : previewType.startsWith("audio/") ? (
                  <audio controls className="w-full"><source src={previewUrl} type={previewType} /></audio>
                ) : (
                  <div className="p-4 text-sm text-gray-700">
                    <div>This file type cannot be previewed. You can download it instead.</div>
                    <a href={previewUrl} download className="mt-3 inline-block px-3 py-2 rounded bg-primary hover:brightness-110 text-white">Download file</a>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MyUploads;
