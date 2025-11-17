import React, { useState } from "react";

const UserAdd = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [busy, setBusy] = useState(false);

  const headers = () => {
    const t = localStorage.getItem("token");
    return { Authorization: t ? `Bearer ${t}` : undefined, "Content-Type": "application/json" };
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch("http://localhost:3000/api/superadmin/users", {
        method: "POST",
        headers: headers(),
        credentials: "include",
        body: JSON.stringify(form),
      });
      setForm({ name: "", email: "", password: "", role: "student" });
      alert("User added");
    } catch {}
    setBusy(false);
  };

  return (
    <div className="p-2">
      <h3 className="font-semibold text-gray-900 mb-3">Add New User</h3>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl p-4 bg-white border border-gray-200 rounded-lg">
        <input className="p-2 rounded border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="Name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} required />
        <input className="p-2 rounded border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="Email" type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} required />
        <input className="p-2 rounded border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="Password" type="password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} required />
        <select className="p-2 rounded border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" value={form.role} onChange={(e)=>setForm({...form,role:e.target.value})}>
          <option value="student">student</option>
          <option value="admin">admin</option>
          <option value="guest">guest</option>
        </select>
        <div className="md:col-span-2 flex justify-end">
          <button disabled={busy} className={`px-4 py-2 rounded text-white ${busy?"bg-gray-300 text-gray-500 cursor-not-allowed":"bg-emerald-600 hover:bg-emerald-500"}`}>Add</button>
        </div>
      </form>
    </div>
  );
};

export default UserAdd;
