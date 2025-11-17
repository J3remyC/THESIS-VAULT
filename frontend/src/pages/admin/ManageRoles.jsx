import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";

const ManageRoles = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);

  const headers = () => {
    const t = localStorage.getItem("token");
    return { Authorization: t ? `Bearer ${t}` : undefined, "Content-Type": "application/json" };
  };

  const load = async () => {
    const res = await fetch("http://localhost:3000/api/superadmin/users", { headers: headers(), credentials: "include" });
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  };

  useEffect(() => { load(); }, []);

  if (user?.role !== "superadmin") {
    return <div className="p-4 text-sm text-red-600">Forbidden: superadmin only.</div>;
  }

  const changeRole = async (id, role, name) => {
    const ok = window.confirm(`Change role of ${name || 'user'} to "${role}"?`);
    if (!ok) return;
    await fetch(`http://localhost:3000/api/superadmin/users/${id}/role`, { method: "PATCH", headers: headers(), credentials: "include", body: JSON.stringify({ role }) });
    await load();
  };

  return (
    <div className="p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Manage Roles (Superadmin Only)</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-500 border-b border-gray-200 bg-gray-50"><tr><th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Email</th><th className="py-2 pr-4">Current Role</th><th className="py-2 pr-4">Change To</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} className="border-b last:border-b-0 border-gray-200">
                <td className="py-2 pr-4">{u.name}</td>
                <td className="py-2 pr-4">{u.email}</td>
                <td className="py-2 pr-4"><span className={`px-2 py-0.5 rounded text-xs ${u.role==='superadmin'?'bg-purple-100 text-purple-700':u.role==='admin'?'bg-blue-100 text-blue-700':u.role==='student'?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-700'}`}>{u.role}</span></td>
                <td className="py-2 pr-4 space-x-2">
                  {String(u._id) === String(user._id) ? (
                    <span className="text-xs text-gray-500">You cannot change your own role.</span>
                  ) : (
                    ['guest','student','admin'].map(r => (
                      <button key={r} onClick={() => changeRole(u._id, r, u.name)} className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-800">{r}</button>
                    ))
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageRoles;
