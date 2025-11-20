import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";

const UsersList = () => {
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "", lastName: "", firstName: "", middleInitial: "", section: "", course: "", schoolYear: "" });
  const [busyId, setBusyId] = useState("");

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

  const refresh = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/superadmin/users", { headers: headers(), credentials: "include" });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {}
  };

  const openEdit = async (u) => {
    setEditing(u);
    setEditForm({ name: u.name || "", email: u.email || "", role: u.role || "guest", lastName: "", firstName: "", middleInitial: "", section: "", course: "", schoolYear: "" });
    if (u.role === 'student') {
      try {
        const res = await fetch(`http://localhost:3000/api/superadmin/users/${u._id}/profile`, { headers: headers(), credentials: 'include' });
        const prof = await res.json();
        if (prof && typeof prof === 'object') {
          setEditForm(f => ({
            ...f,
            lastName: prof.lastName || "",
            firstName: prof.firstName || "",
            middleInitial: prof.middleInitial || "",
            section: prof.section || "",
            course: prof.course || "",
            schoolYear: prof.schoolYear || "",
          }));
        }
      } catch {}
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setBusyId(editing._id);
    try {
      await fetch(`http://localhost:3000/api/superadmin/users/${editing._id}`, {
        method: 'PATCH',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editForm),
      });
      setEditing(null);
      await refresh();
    } finally {
      setBusyId("");
    }
  };

  const banToggle = async (u, action) => {
    setBusyId(u._id);
    try {
      let options = { method: 'PATCH', headers: headers(), credentials: 'include' };
      if (action === 'ban') {
        const reason = prompt(`Enter ban reason for ${u.email} (optional):`, "");
        if (reason === null) {
          // User pressed cancel; do not proceed with ban
          return;
        }
        options = {
          method: 'PATCH',
          headers: { ...headers(), 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ reason }),
        };
      }
      await fetch(`http://localhost:3000/api/superadmin/users/${u._id}/${action}`, options);
      await refresh();
    } finally {
      setBusyId("");
    }
  };

  const removeUser = async (u) => {
    if (!confirm(`Delete user ${u.email}? This cannot be undone.`)) return;
    setBusyId(u._id);
    try {
      await fetch(`http://localhost:3000/api/superadmin/users/${u._id}`, { method: 'DELETE', headers: headers(), credentials: 'include' });
      await refresh();
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <div className="p-4 text-sm text-gray-500">Loading users...</div>;

  const filtered = users.filter(u => (!role || u.role === role) && (!q || `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())));

  // Validation: disable Save when text-only fields have numbers or when number-only field has letters
  const textOnly = (s) => /^[A-Za-z .'-]*$/.test(s || "");
  const singleLetterOrEmpty = (s) => !s || /^[A-Za-z]$/.test(s);
  const schoolYearValid = (s) => {
    const m = /^(\d{4})-(\d{4})$/.exec(s || "");
    if (!m) return false;
    const y1 = parseInt(m[1], 10);
    const y2 = parseInt(m[2], 10);
    return y2 === y1 + 1;
  };
  const isStudent = editing?.role === 'student';
  const isInvalid = !!editing && (
    !textOnly(editForm.name) ||
    (isStudent && (!textOnly(editForm.lastName) || !textOnly(editForm.firstName) || !singleLetterOrEmpty(editForm.middleInitial) || !schoolYearValid(editForm.schoolYear)))
  );

  return (
    <div className="p-4">
      <div className="flex items-end justify-between mb-3 gap-2">
        <h3 className="font-semibold text-gray-900">All Users</h3>
        <div className="flex gap-2">
          <input className="p-2 rounded bg-white border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400" placeholder="Search name/email" value={q} onChange={e=>setQ(e.target.value)} />
          <select className="p-2 rounded bg-white border border-gray-300 text-sm text-gray-900" value={role} onChange={e=>setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="guest">guest</option>
            <option value="student">student</option>
            <option value="admin">admin</option>
            <option value="superadmin">superadmin</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(u => {
          const isTargetPriv = ["admin","superadmin"].includes(u.role);
          const isTargetSuperadmin = u.role === 'superadmin';
          const iAmAdmin = me?.role === 'admin';
          const iAmSuperadmin = me?.role === 'superadmin';
          const canEdit = iAmSuperadmin || (iAmAdmin && !isTargetPriv);
          const canBan = (iAmSuperadmin || iAmAdmin) && ["guest","student"].includes(u.role);
          const canDelete = iAmSuperadmin && !isTargetSuperadmin;
          return (
          <div key={u._id} className={`p-4 rounded border bg-white ${u.isBanned ? 'border-red-200' : 'border-gray-200'}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">{u.name}</div>
                <div className="text-xs text-gray-500">{u.email}</div>
              </div>
              {u.isBanned && <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700">BANNED</span>}
            </div>
            {u.isBanned && (
              <div className="mt-2 text-xs">
                {u.banReason && (<div className="text-gray-700"><span className="text-gray-500">Reason:</span> {u.banReason}</div>)}
                {u.bannedAt && (<div className="text-gray-500">Since: {new Date(u.bannedAt).toLocaleString()}</div>)}
              </div>
            )}
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className={`px-2 py-0.5 rounded ${u.role==='superadmin'?'bg-purple-100 text-purple-700':u.role==='admin'?'bg-blue-100 text-blue-700':u.role==='student'?'bg-primary/10 text-primary':'bg-gray-100 text-gray-700'}`}>{u.role}</span>
              <span className="text-gray-500">{u.isVerified ? 'Verified' : 'Unverified'}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={()=>openEdit(u)} disabled={!canEdit} className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-900 disabled:opacity-50">Edit</button>
              {u.isBanned ? (
                <button onClick={()=>banToggle(u,'unban')} disabled={busyId===u._id || !canBan} className="px-2 py-1 text-xs rounded bg-primary hover:brightness-110 text-white disabled:opacity-60">Unban</button>
              ) : (
                <button onClick={()=>banToggle(u,'ban')} disabled={busyId===u._id || !canBan} className="px-2 py-1 text-xs rounded bg-red-600 hover:bg-red-500 text-white disabled:opacity-60">Ban</button>
              )}
              <button onClick={()=>removeUser(u)} disabled={busyId===u._id || !canDelete} className="ml-auto px-2 py-1 text-xs rounded bg-red-600 hover:bg-red-500 text-white disabled:opacity-60">Delete</button>
            </div>
          </div>
        )})}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-6 z-50" onClick={()=>setEditing(null)}>
          <div className="bg-white border border-gray-200 rounded-xl w-full max-w-md p-5" onClick={(e)=>e.stopPropagation()}>
            <div className="text-lg font-semibold mb-3 text-gray-900">Edit User</div>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name</label>
                <input className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900" value={editForm.name} onChange={e=>setEditForm({...editForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <input className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900" value={editForm.email} onChange={e=>setEditForm({...editForm, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Role</label>
                <select className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900" value={editForm.role} onChange={e=>setEditForm({...editForm, role: e.target.value})} disabled={editing?.role === 'superadmin'}>
                  <option value="guest">guest</option>
                  <option value="student">student</option>
                  <option value="admin">admin</option>
                  <option value="superadmin">superadmin</option>
                </select>
              </div>

              {editing?.role === 'student' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Last Name</label>
                      <input className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900" value={editForm.lastName} onChange={e=>setEditForm({...editForm, lastName: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">First Name</label>
                      <input className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900" value={editForm.firstName} onChange={e=>setEditForm({...editForm, firstName: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Middle Initial</label>
                      <input className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900" maxLength={1} value={editForm.middleInitial} onChange={e=>setEditForm({...editForm, middleInitial: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Section</label>
                      <input className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900" value={editForm.section} onChange={e=>setEditForm({...editForm, section: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">School Year</label>
                      <input className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900" placeholder="e.g. 2025-2026" value={editForm.schoolYear} onChange={e=>setEditForm({...editForm, schoolYear: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Course</label>
                    <input className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900" placeholder="Department code" value={editForm.course} onChange={e=>setEditForm({...editForm, course: e.target.value})} />
                  </div>
                </>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>setEditing(null)} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm text-gray-900">Cancel</button>
              <button onClick={saveEdit} disabled={busyId===editing._id || isInvalid} className="px-3 py-2 rounded bg-primary hover:brightness-110 text-sm text-white disabled:opacity-60">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;
