import React, { useEffect, useMemo, useState } from "react";

const DepartmentTheses = () => {
  const [dept, setDept] = useState("");
  const [items, setItems] = useState([]);

  const headers = () => {
    const t = localStorage.getItem("token");
    return { Authorization: t ? `Bearer ${t}` : undefined };
  };

  const load = async () => {
    const params = new URLSearchParams();
    if (dept) params.set("department", dept);
    const res = await fetch(`http://localhost:3000/api/admin/theses?${params.toString()}`, {
      headers: headers(),
      credentials: "include",
    });
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  };

  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const g = {};
    items.forEach(i => {
      const key = i.department || 'Unassigned';
      if (!g[key]) g[key] = [];
      g[key].push(i);
    });
    return g;
  }, [items]);

  const keys = Object.keys(grouped).sort();

  return (
    <div className="p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Theses by Department</h3>
      <div className="flex gap-2 mb-3">
        <input className="p-2 rounded border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="Department name/code" value={dept} onChange={e=>setDept(e.target.value)} />
        <button onClick={load} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm">Filter</button>
      </div>
      <div className="space-y-4">
        {keys.map(k => (
          <div key={k} className="rounded border border-gray-200 bg-white">
            <div className="px-4 py-2 border-b border-gray-200 text-sm font-medium text-gray-900">{k}</div>
            <ul className="divide-y divide-gray-200 text-sm">
              {grouped[k].map(i => (
                <li key={i._id} className="px-4 py-2 flex items-center justify-between">
                  <div>
                    <div className="text-gray-900">{i.title}</div>
                    <div className="text-xs text-gray-500">{i.uploadedBy?.name} <span className="text-gray-400">{i.uploadedBy?.email}</span></div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs ${i.status==='approved'?'bg-emerald-100 text-emerald-700':i.status==='pending'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{i.status}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepartmentTheses;
