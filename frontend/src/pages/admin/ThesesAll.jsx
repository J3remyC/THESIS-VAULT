import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLocation } from "react-router-dom";

const ThesesAll = () => {
  const location = useLocation();
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

  const load = async (overrides = {}) => {
    setLoading(true);
    const params = new URLSearchParams();
    const dept = overrides.department !== undefined ? overrides.department : department;
    const st = overrides.status !== undefined ? overrides.status : status;
    if (dept) params.set("department", dept);
    if (st) params.set("status", st);
    const res = await fetch(`http://localhost:3000/api/admin/theses?${params.toString()}`, {
      headers: headers(),
      credentials: "include",
    });
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    // Initialize filters from URL query if present
    const qs = new URLSearchParams(location.search);
    const initStatus = qs.get("status") || "";
    const initDept = qs.get("department") || "";
    if (initStatus) setStatus(initStatus);
    if (initDept) setDepartment(initDept);
    load({ status: initStatus, department: initDept });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
      <h3 className="font-semibold mb-3 text-gray-900">All Submissions</h3>
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <input className="p-2 rounded bg-white border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400" placeholder="Search title/author" value={q} onChange={e=>setQ(e.target.value)} />
        <select className="p-2 rounded bg-white border border-gray-300 text-sm text-gray-900" value={department} onChange={e=>setDepartment(e.target.value)}>
          <option value="">All departments</option>
          {departments.map(d => (
            <option key={d._id} value={d.code || d.name}>{(d.code?d.code:"").toUpperCase()} — {d.name}</option>
          ))}
        </select>
        <select className="p-2 rounded bg-white border border-gray-300 text-sm text-gray-900" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="approved">approved</option>
          <option value="pending">pending</option>
          <option value="rejected">rejected</option>
        </select>
        <button onClick={load} className="px-3 py-2 rounded bg-primary hover:brightness-110 text-sm text-white">Apply</button>
      </div>
      {loading ? (<div className="text-sm text-gray-500">Loading...</div>) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items
              .filter(i => !q || `${i.title||''} ${i.uploadedBy?.name||''}`.toLowerCase().includes(q.toLowerCase()))
              .slice(page*pageSize, page*pageSize + pageSize)
              .map(i => (
                <div key={i._id} className="p-4 rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer" onClick={()=>setSelected(i)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-gray-900 line-clamp-2">{i.title}</div>
                      <div className="text-xs text-gray-500">{i.uploadedBy?.name} <span className="text-gray-500">{i.uploadedBy?.email}</span></div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${i.status==='approved'?'bg-primary/10 text-primary':i.status==='pending'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{i.status}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">Dept: {i.department || '—'}</div>
                </div>
              ))}
          </div>
          <div className="mt-4 flex items-center justify-end gap-2 text-xs text-gray-500">
            <button disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))} className={`px-2 py-1 rounded border ${page===0?'bg-white text-gray-400 border-gray-200':'bg-white hover:bg-gray-50 border-gray-200'}`}>Prev</button>
            <span>Page {page+1} / {Math.max(1, Math.ceil(items.filter(i => !q || `${i.title||''} ${i.uploadedBy?.name||''}`.toLowerCase().includes(q.toLowerCase())).length / pageSize))}</span>
            <button disabled={(page+1)>=Math.ceil(items.filter(i => !q || `${i.title||''} ${i.uploadedBy?.name||''}`.toLowerCase().includes(q.toLowerCase())).length / pageSize)} onClick={()=>setPage(p=>p+1)} className={`px-2 py-1 rounded border ${((page+1)>=Math.ceil(items.filter(i => !q || `${i.title||''} ${i.uploadedBy?.name||''}`.toLowerCase().includes(q.toLowerCase())).length / pageSize))?'bg-white text-gray-400 border-gray-200':'bg-white hover:bg-gray-50 border-gray-200'}`}>Next</button>
          </div>
        </>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-6 z-50" onClick={()=>setSelected(null)}>
          <div className="bg-white border border-gray-200 rounded-2xl w/full max-w-3xl p-6 shadow-2xl" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xl font-semibold text-gray-900">Thesis Details</h4>
              <button onClick={()=>setSelected(null)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"><X className="w-5 h-5 text-gray-700" /></button>
            </div>
            <div className="mb-4">
              {!editing ? (
                <>
                  <div className="text-lg font-medium text-gray-900">{selected.title}</div>
                  <div className="text-xs text-gray-500">{selected.uploadedBy?.name} <span className="text-gray-500">{selected.uploadedBy?.email}</span></div>
                </>
              ) : (
                <div className="space-y-2">
                  <input className="w-full p-2 rounded bg-white border border-gray-300 text-sm text-gray-900" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Title" />
                  <textarea className="w-full p-2 rounded bg-white border border-gray-300 text-sm text-gray-900" rows={4} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Description" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input className="p-2 rounded bg-white border border-gray-300 text-sm text-gray-900" value={form.author} onChange={e=>setForm(f=>({...f,author:e.target.value}))} placeholder="Author" />
                    <input className="p-2 rounded bg-white border border-gray-300 text-sm text-gray-900" value={form.course} onChange={e=>setForm(f=>({...f,course:e.target.value}))} placeholder="Course" />
                    <input className="p-2 rounded bg-white border border-gray-300 text-sm text-gray-900" value={form.yearPublished} onChange={e=>setForm(f=>({...f,yearPublished:e.target.value}))} placeholder="Year" />
                  </div>
                  <select className="p-2 rounded bg-white border border-gray-300 text-sm text-gray-900" value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}>
                    <option value="">Select department</option>
                    {departments.map(d => (
                      <option key={d._id} value={d.code || d.name}>{(d.code?d.code:"").toUpperCase()} — {d.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <div className="text-gray-500 text-xs mb-1">Description</div>
                {!editing ? (
                  <div className="p-3 rounded bg-white border border-gray-200 min-h-[100px]">{selected.description || 'No description provided.'}</div>
                ) : (
                  <div className="p-3 rounded bg-white border border-gray-200 min-h-[100px] text-gray-500">Editing...</div>
                )}
              </div>
              <div className="space-y-2">
                <div><span className="text-gray-500">Department:</span> {selected.department || '—'}</div>
                <div><span className="text-gray-500">Year:</span> {selected.yearPublished || '—'}</div>
                <div className="flex gap-2 flex-wrap mt-2">
                  {selected.url && (
                    <a href={selected.url} target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-primary hover:brightness-110 text-xs text-white">View</a>
                  )}
                  {selected.url && (
                    <a href={selected.url} target="_blank" rel="noreferrer" download className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-xs text-gray-900">Download</a>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end">
              <div className="flex gap-2">
                {!editing ? (
                  <button onClick={()=>setEditing(true)} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-xs text-gray-900">Edit</button>
                ) : (
                  <>
                    <button onClick={saveEdit} className="px-3 py-2 rounded bg-primary hover:brightness-110 text-xs text-white">Save</button>
                    <button onClick={()=>{setEditing(false); setForm({ title: selected.title||'', description: selected.description||'', author: selected.author||'', course: selected.course||'', yearPublished: selected.yearPublished||'', department: selected.department||'' });}} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-xs text-gray-900">Cancel</button>
                  </>
                )}
                <button onClick={removeThesis} className="px-3 py-2 rounded bg-red-600 hover:bg-red-500 text-xs text-white">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThesesAll;
