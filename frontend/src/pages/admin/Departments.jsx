import React, { useEffect, useState } from "react";

const Departments = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: "", code: "" });

  const headers = () => {
    const t = localStorage.getItem("token");
    return { Authorization: t ? `Bearer ${t}` : undefined, "Content-Type": "application/json" };
  };

  const load = async () => {
    const res = await fetch("http://localhost:3000/api/superadmin/departments", { headers: headers(), credentials: "include" });
    const data = await res.json();
    setList(Array.isArray(data) ? data : []);
  };

  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    await fetch("http://localhost:3000/api/superadmin/departments", { method: "POST", headers: headers(), credentials: "include", body: JSON.stringify(form) });
    setForm({ name: "", code: "" });
    load();
  };

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3">System Settings: Courses</h3>
      <form onSubmit={add} className="flex gap-2 mb-3">
        <input className="p-2 rounded bg-gray-800 border border-gray-700" placeholder="Course (e.g., Bachelor of Science in Computer Science)" value={form.name} onChange={e=>setForm({ ...form, name: e.target.value })} required />
        <input className="p-2 rounded bg-gray-800 border border-gray-700" placeholder="Code (e.g., BSCS)" value={form.code} onChange={e=>setForm({ ...form, code: e.target.value })} />
        <button className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-sm">Add Course</button>
      </form>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-400 border-b border-gray-800"><tr><th className="py-2 pr-4">Course</th><th className="py-2 pr-4">Code</th></tr></thead>
          <tbody>
            {list.map(d => (
              <tr key={d._id} className="border-b border-gray-900/60">
                <td className="py-2 pr-4">{d.name}</td>
                <td className="py-2 pr-4">{d.code || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Departments;
