import React, { useEffect, useState } from "react";

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [q, setQ] = useState("");

  const headers = () => {
    const t = localStorage.getItem("token");
    return { Authorization: t ? `Bearer ${t}` : undefined };
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/superadmin/users", { headers: headers(), credentials: "include" });
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="p-4 text-sm text-gray-400">Loading users...</div>;

  const filtered = users.filter(u => (!role || u.role === role) && (!q || `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="p-4">
      <div className="flex items-end justify-between mb-3 gap-2">
        <h3 className="font-semibold">All Users</h3>
        <div className="flex gap-2">
          <input className="p-2 rounded bg-gray-800 border border-gray-700 text-sm" placeholder="Search name/email" value={q} onChange={e=>setQ(e.target.value)} />
          <select className="p-2 rounded bg-gray-800 border border-gray-700 text-sm" value={role} onChange={e=>setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="guest">guest</option>
            <option value="student">student</option>
            <option value="admin">admin</option>
            <option value="superadmin">superadmin</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(u => (
          <div key={u._id} className="p-4 rounded border border-gray-800 bg-gray-900/60">
            <div className="text-sm font-medium text-gray-200">{u.name}</div>
            <div className="text-xs text-gray-400">{u.email}</div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className={`px-2 py-0.5 rounded ${u.role==='superadmin'?'bg-purple-700/30 text-purple-300':u.role==='admin'?'bg-blue-700/30 text-blue-300':u.role==='student'?'bg-emerald-700/30 text-emerald-300':'bg-gray-700/30 text-gray-300'}`}>{u.role}</span>
              <span className="text-gray-400">{u.isVerified ? 'Verified' : 'Unverified'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersList;
