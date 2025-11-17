import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

const ThesesAll = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 9;
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", author: "", course: "", yearPublished: "", department: "" });

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
  useEffect(() => {
    (async () => {
      try {
        const t = localStorage.getItem("token");
        const r = await fetch("http://localhost:3000/api/catalog/departments", { headers: { Authorization: t ? `Bearer ${t}` : undefined }, credentials: "include" });
        const d = await r.json();
        setDepartments(Array.isArray(d) ? d : []);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (selected) {
      setEditing(false);
      setForm({
        title: selected.title || "",
        description: selected.description || "",
        author: selected.author || "",
        course: selected.course || "",
        yearPublished: selected.yearPublished || "",
        department: selected.department || "",
      });
    }
  }, [selected]);

  const approve = async (id) => {
    await fetch(`http://localhost:3000/api/admin/theses/${id}/approve`, { method: 'PATCH', headers: headers(), credentials: 'include' });
    await load();
  };
  const reject = async (id) => {
    const reason = window.prompt('Enter rejection reason (optional):', '') || '';
    await fetch(`http://localhost:3000/api/admin/theses/${id}/reject`, { method: 'PATCH', headers: { ...headers(), 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ reason }) });
    await load();
  };

  const saveEdit = async () => {
    if (!selected) return;
    const payload = { ...form };
    if (payload.yearPublished && typeof payload.yearPublished === 'string') {
      const n = Number(payload.yearPublished);
      if (!Number.isNaN(n)) payload.yearPublished = n;
    }
    await fetch(`http://localhost:3000/api/admin/theses/${selected._id}`, {
      method: 'PATCH',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    await load();
    // refresh selected with latest data
    const updated = (await (async ()=>{
      const res = await fetch(`http://localhost:3000/api/admin/theses?` , { headers: headers(), credentials: 'include' });
      const data = await res.json();
      return Array.isArray(data) ? data.find(x=>x._id===selected._id) : null;
    })());
    setSelected(updated || null);
    setEditing(false);
  };

  const removeThesis = async () => {
    if (!selected) return;
    if (!window.confirm('Delete this thesis permanently? This cannot be undone.')) return;
    await fetch(`http://localhost:3000/api/admin/theses/${selected._id}`, { method: 'DELETE', headers: headers(), credentials: 'include' });
    setSelected(null);
    await load();
  };

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3">All Submissions</h3>
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <input className="p-2 rounded bg-gray-800 border border-gray-700 text-sm" placeholder="Search title/author" value={q} onChange={e=>setQ(e.target.value)} />
        <select className="p-2 rounded bg-gray-800 border border-gray-700 text-sm" value={department} onChange={e=>setDepartment(e.target.value)}>
          <option value="">All departments</option>
          {departments.map(d => (
            <option key={d._id} value={d.code || d.name}>{(d.code?d.code:"").toUpperCase()} — {d.name}</option>
          ))}
        </select>
        <select className="p-2 rounded bg-gray-800 border border-gray-700 text-sm" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="approved">approved</option>
          <option value="pending">pending</option>
          <option value="rejected">rejected</option>
        </select>
        <button onClick={load} className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-sm">Apply</button>
      </div>
      {loading ? (<div className="text-sm text-gray-400">Loading...</div>) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items
              .filter(i => !q || `${i.title||''} ${i.uploadedBy?.name||''}`.toLowerCase().includes(q.toLowerCase()))
              .slice(page*pageSize, page*pageSize + pageSize)
              .map(i => (
                <div key={i._id} className="p-4 rounded border border-gray-800 bg-gray-900/60 hover:bg-gray-900/70 cursor-pointer" onClick={()=>setSelected(i)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-gray-200 line-clamp-2">{i.title}</div>
                      <div className="text-xs text-gray-400">{i.uploadedBy?.name} <span className="text-gray-500">{i.uploadedBy?.email}</span></div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${i.status==='approved'?'bg-emerald-700/30 text-emerald-300':i.status==='pending'?'bg-yellow-700/30 text-yellow-300':'bg-red-700/30 text-red-300'}`}>{i.status}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">Dept: {i.department || '—'}</div>
                </div>
              ))}
          </div>
          <div className="mt-4 flex items-center justify-end gap-2 text-xs text-gray-400">
            <button disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))} className={`px-2 py-1 rounded ${page===0?'bg-gray-800 text-gray-500':'bg-gray-800 hover:bg-gray-700'}`}>Prev</button>
            <span>Page {page+1} / {Math.max(1, Math.ceil(items.filter(i => !q || `${i.title||''} ${i.uploadedBy?.name||''}`.toLowerCase().includes(q.toLowerCase())).length / pageSize))}</span>
            <button disabled={(page+1)>=Math.ceil(items.filter(i => !q || `${i.title||''} ${i.uploadedBy?.name||''}`.toLowerCase().includes(q.toLowerCase())).length / pageSize)} onClick={()=>setPage(p=>p+1)} className={`px-2 py-1 rounded ${((page+1)>=Math.ceil(items.filter(i => !q || `${i.title||''} ${i.uploadedBy?.name||''}`.toLowerCase().includes(q.toLowerCase())).length / pageSize))?'bg-gray-800 text-gray-500':'bg-gray-800 hover:bg-gray-700'}`}>Next</button>
          </div>
        </>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50" onClick={()=>setSelected(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w/full max-w-3xl p-6 shadow-2xl" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xl font-semibold text-emerald-400">Thesis Details</h4>
              <button onClick={()=>setSelected(null)} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700"><X className="w-5 h-5 text-gray-300" /></button>
            </div>
            <div className="mb-4">
              {!editing ? (
                <>
                  <div className="text-lg font-medium text-gray-200">{selected.title}</div>
                  <div className="text-xs text-gray-400">{selected.uploadedBy?.name} <span className="text-gray-500">{selected.uploadedBy?.email}</span></div>
                </>
              ) : (
                <div className="space-y-2">
                  <input className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Title" />
                  <textarea className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm" rows={4} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Description" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input className="p-2 rounded bg-gray-800 border border-gray-700 text-sm" value={form.author} onChange={e=>setForm(f=>({...f,author:e.target.value}))} placeholder="Author" />
                    <input className="p-2 rounded bg-gray-800 border border-gray-700 text-sm" value={form.course} onChange={e=>setForm(f=>({...f,course:e.target.value}))} placeholder="Course" />
                    <input className="p-2 rounded bg-gray-800 border border-gray-700 text-sm" value={form.yearPublished} onChange={e=>setForm(f=>({...f,yearPublished:e.target.value}))} placeholder="Year" />
                  </div>
                  <select className="p-2 rounded bg-gray-800 border border-gray-700 text-sm" value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}>
                    <option value="">Select department</option>
                    {departments.map(d => (
                      <option key={d._id} value={d.code || d.name}>{(d.code?d.code:"").toUpperCase()} — {d.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
              <div>
                <div className="text-gray-400 text-xs mb-1">Description</div>
                {!editing ? (
                  <div className="p-3 rounded bg-gray-900/60 border border-gray-800 min-h-[100px]">{selected.description || 'No description provided.'}</div>
                ) : (
                  <div className="p-3 rounded bg-gray-900/60 border border-gray-800 min-h-[100px] text-gray-400">Editing...</div>
                )}
              </div>
              <div className="space-y-2">
                <div><span className="text-gray-400">Department:</span> {selected.department || '—'}</div>
                <div><span className="text-gray-400">Year:</span> {selected.yearPublished || '—'}</div>
                <div className="flex gap-2 flex-wrap mt-2">
                  {selected.url && (
                    <a href={selected.url} target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-xs">View</a>
                  )}
                  {selected.url && (
                    <a href={selected.url} target="_blank" rel="noreferrer" download className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-xs">Download</a>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end">
              <div className="flex gap-2">
                {!editing ? (
                  <button onClick={()=>setEditing(true)} className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-xs">Edit</button>
                ) : (
                  <>
                    <button onClick={saveEdit} className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-xs">Save</button>
                    <button onClick={()=>{setEditing(false); setForm({ title: selected.title||'', description: selected.description||'', author: selected.author||'', course: selected.course||'', yearPublished: selected.yearPublished||'', department: selected.department||'' });}} className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-xs">Cancel</button>
                  </>
                )}
                <button onClick={removeThesis} className="px-3 py-2 rounded bg-red-700 hover:bg-red-600 text-xs">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThesesAll;
