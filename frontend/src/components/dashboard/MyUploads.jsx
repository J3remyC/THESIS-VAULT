import React, { useState } from "react";
import { motion } from "framer-motion";

const MyUploads = ({ myFiles = [], onChanged }) => {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: "", author: "", course: "", yearPublished: "", department: "" });
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
    if (!confirm("Delete this upload? This cannot be undone.")) return;
    try {
      await fetch(`http://localhost:3000/api/upload/${id}` , {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
        credentials: "include",
      });
      onChanged && onChanged();
    } catch {}
  };

  return (
    <motion.div
      className="p-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
    >
      <h3 className="text-lg font-semibold mb-3">My Uploads</h3>
      <div className="overflow-x-auto">
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
            {myFiles.map((f) => (
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
                      <div className="font-medium text-gray-200">{f.title}</div>
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
                <td className="py-2 pr-4 align-top space-x-2">
                  {f.url && (
                    <a href={f.url} target="_blank" rel="noreferrer" className="text-emerald-400 underline hover:text-emerald-300">View</a>
                  )}
                  {editingId === f._id ? (
                    <>
                      <button onClick={saveEdit} className="text-emerald-400 hover:text-emerald-300">Save</button>
                      <button onClick={()=>setEditingId(null)} className="text-gray-400 hover:text-gray-300">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={()=>startEdit(f)} className="text-blue-400 hover:text-blue-300">Edit</button>
                      <button onClick={()=>deleteItem(f._id)} className="text-red-400 hover:text-red-300">Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default MyUploads;
