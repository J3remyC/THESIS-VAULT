import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { useAuthStore } from '../store/authStore'

const SuperadminDashboardPage = () => {
  const { user } = useAuthStore()
  const [metrics, setMetrics] = useState(null)
  const [pending, setPending] = useState([])
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student' })
  const [newDept, setNewDept] = useState({ name: '', code: '' })
  const [editDept, setEditDept] = useState(null)
  const [selected, setSelected] = useState(null)

  const authHeaders = () => {
    const token = localStorage.getItem('token')
    return { Authorization: token ? `Bearer ${token}` : undefined, 'Content-Type': 'application/json' }
  }

  const loadAll = async () => {
    await Promise.all([
      fetch('http://localhost:3000/api/admin/metrics', { headers: authHeaders(), credentials: 'include' })
        .then(r => r.json()).then(setMetrics).catch(() => {}),
      fetch('http://localhost:3000/api/admin/theses/pending', { headers: authHeaders(), credentials: 'include' })
        .then(r => r.json()).then(setPending).catch(() => {}),
      fetch('http://localhost:3000/api/admin/logs', { headers: authHeaders(), credentials: 'include' })
        .then(r => r.json()).then(setLogs).catch(() => {}),
      fetch('http://localhost:3000/api/superadmin/users', { headers: authHeaders(), credentials: 'include' })
        .then(r => r.json()).then(setUsers).catch(() => {}),
      fetch('http://localhost:3000/api/superadmin/departments', { headers: authHeaders(), credentials: 'include' })
        .then(r => r.json()).then(setDepartments).catch(() => {}),
    ])
  }

  useEffect(() => { loadAll() }, [])

  const approve = async (id) => {
    await fetch(`http://localhost:3000/api/admin/theses/${id}/approve`, { method: 'PATCH', headers: authHeaders(), credentials: 'include' })
    loadAll()
  }
  const reject = async (id) => {
    const reason = window.prompt('Enter rejection reason (optional):', '') || '';
    const headers = authHeaders();
    await fetch(`http://localhost:3000/api/admin/theses/${id}/reject`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: JSON.stringify({ reason }),
    })
    loadAll()
  }

  const approveSelected = async () => {
    if (!selected) return
    await approve(selected._id)
    setSelected(null)
  }
  const rejectSelected = async () => {
    if (!selected) return
    await reject(selected._id)
    setSelected(null)
  }

  const addUser = async (e) => {
    e.preventDefault()
    const ok = window.confirm(`Add new user ${newUser.name} (${newUser.email}) with role ${newUser.role}?`)
    if (!ok) return
    await fetch('http://localhost:3000/api/superadmin/users', { method: 'POST', headers: authHeaders(), credentials: 'include', body: JSON.stringify(newUser) })
    setNewUser({ name: '', email: '', password: '', role: 'student' })
    loadAll()
  }

  const changeRole = async (id, role, name) => {
    if (String(user?._id) === String(id)) return alert('You cannot change your own role.')
    const ok = window.confirm(`Change role of ${name || 'user'} to "${role}"?`)
    if (!ok) return
    await fetch(`http://localhost:3000/api/superadmin/users/${id}/role`, { method: 'PATCH', headers: authHeaders(), credentials: 'include', body: JSON.stringify({ role }) })
    loadAll()
  }

  const addDepartment = async (e) => {
    e.preventDefault()
    await fetch('http://localhost:3000/api/superadmin/departments', { method: 'POST', headers: authHeaders(), credentials: 'include', body: JSON.stringify(newDept) })
    setNewDept({ name: '', code: '' })
    loadAll()
  }

  const saveDepartment = async (e) => {
    e.preventDefault()
    if (!editDept) return
    await fetch(`http://localhost:3000/api/superadmin/departments/${editDept._id}`, { method: 'PATCH', headers: authHeaders(), credentials: 'include', body: JSON.stringify({ name: editDept.name, code: editDept.code }) })
    setEditDept(null)
    loadAll()
  }

  const deleteDepartment = async (id) => {
    if (!confirm('Delete this department?')) return
    await fetch(`http://localhost:3000/api/superadmin/departments/${id}`, { method: 'DELETE', headers: authHeaders(), credentials: 'include' })
    loadAll()
  }

  const backup = async () => {
    await fetch('http://localhost:3000/api/superadmin/system/backup', { method: 'POST', headers: authHeaders(), credentials: 'include' })
  }
  const restore = async () => {
    await fetch('http://localhost:3000/api/superadmin/system/restore', { method: 'POST', headers: authHeaders(), credentials: 'include' })
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-950 text-white">
      <Navbar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 min-w-0 overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-7xl mx-auto p-6 space-y-6">
            <h2 className="text-2xl font-semibold">Superadmin Dashboard</h2>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-900/60 rounded border border-gray-800"><div className="text-xs text-gray-400">TOTAL STUDENTS</div><div className="text-2xl">{metrics?.totalStudents ?? '—'}</div></div>
              <div className="p-4 bg-gray-900/60 rounded border border-gray-800"><div className="text-xs text-gray-400">TOTAL TEACHERS</div><div className="text-2xl">{metrics?.totalTeachers ?? '—'}</div></div>
              <div className="p-4 bg-gray-900/60 rounded border border-gray-800"><div className="text-xs text-gray-400">TOTAL THESES</div><div className="text-2xl">{metrics?.totalTheses ?? '—'}</div></div>
              <div className="p-4 bg-gray-900/60 rounded border border-gray-800"><div className="text-xs text-gray-400">DEPARTMENTS</div><div className="text-2xl">{metrics?.totalDepartments ?? '—'}</div></div>
            </div>

            {/* User Management */}
            <div className="p-4 bg-gray-900/60 rounded border border-gray-800">
              <h3 className="font-semibold mb-3">User Management</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-400 mb-2">View All Users</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-gray-400 border-b border-gray-800"><tr><th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Email</th><th className="py-2 pr-4">Role</th><th className="py-2 pr-4">Actions</th></tr></thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u._id} className="border-b border-gray-900/60">
                            <td className="py-2 pr-4">{u.name}</td>
                            <td className="py-2 pr-4">{u.email}</td>
                            <td className="py-2 pr-4">{u.role}</td>
                            <td className="py-2 pr-4 space-x-2">
                              {String(u._id) === String(user?._id) ? (
                                <span className="text-xs text-gray-500">You cannot change your own role.</span>
                              ) : (
                                ['guest','student','admin'].map(r => (
                                  <button key={r} onClick={() => changeRole(u._id, r, u.name)} className="px-2 py-1 text-xs rounded bg-gray-800 hover:bg-gray-700">{r}</button>
                                ))
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-2">Add New User</div>
                  <form onSubmit={addUser} className="grid grid-cols-2 gap-2 p-3 rounded border border-gray-800 bg-gray-900/40">
                    <input className="p-2 rounded bg-gray-800 border border-gray-700" placeholder="Name" value={newUser.name} onChange={e=>setNewUser({...newUser,name:e.target.value})} required />
                    <input className="p-2 rounded bg-gray-800 border border-gray-700" placeholder="Email" value={newUser.email} onChange={e=>setNewUser({...newUser,email:e.target.value})} type="email" required />
                    <input className="p-2 rounded bg-gray-800 border border-gray-700" placeholder="Password" value={newUser.password} onChange={e=>setNewUser({...newUser,password:e.target.value})} type="password" required />
                    <select className="p-2 rounded bg-gray-800 border border-gray-700" value={newUser.role} onChange={e=>setNewUser({...newUser,role:e.target.value})}>
                      <option value="student">student</option>
                      <option value="admin">admin</option>
                      <option value="guest">guest</option>
                    </select>
                    <div className="col-span-2 flex justify-end"><button className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-sm">Add</button></div>
                  </form>
                </div>
              </div>
            </div>

            {/* Thesis Management */}
            <div className="p-4 bg-gray-900/60 rounded border border-gray-800">
              <h3 className="font-semibold mb-3">Thesis Management</h3>
              <div className="text-sm text-gray-400 mb-2">Pending Approval</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pending.map(p => (
                  <div key={p._id} className="p-4 rounded border border-gray-800 bg-gray-900/60">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-gray-200 line-clamp-2">{p.title}</div>
                        <div className="text-xs text-gray-400">{p.uploadedBy?.name} <span className="text-gray-500">{p.uploadedBy?.email}</span></div>
                        <div className="mt-1 text-xs text-gray-500">Dept: {p.department || '—'}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-xs bg-yellow-700/30 text-yellow-300">pending</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => setSelected(p)} className="px-2 py-1 text-xs rounded bg-gray-800 hover:bg-gray-700">Review</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Settings */}
            <div className="p-4 bg-gray-900/60 rounded border border-gray-800">
              <h3 className="font-semibold mb-3">System Settings</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-400 mb-2">Departments</div>
                  <form onSubmit={addDepartment} className="flex gap-2 mb-3">
                    <input className="p-2 rounded bg-gray-800 border border-gray-700" placeholder="Name" value={newDept.name} onChange={e=>setNewDept({...newDept,name:e.target.value})} required />
                    <input className="p-2 rounded bg-gray-800 border border-gray-700" placeholder="Code" value={newDept.code} onChange={e=>setNewDept({...newDept,code:e.target.value})} />
                    <button className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-sm">Add</button>
                  </form>
                  {editDept ? (
                    <form onSubmit={saveDepartment} className="flex gap-2 mb-3 p-2 rounded border border-gray-800 bg-gray-900/40">
                      <input className="p-2 rounded bg-gray-800 border border-gray-700" placeholder="Name" value={editDept.name} onChange={e=>setEditDept({...editDept, name:e.target.value})} required />
                      <input className="p-2 rounded bg-gray-800 border border-gray-700" placeholder="Code" value={editDept.code||''} onChange={e=>setEditDept({...editDept, code:e.target.value})} />
                      <button className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm">Save</button>
                      <button type="button" onClick={()=>setEditDept(null)} className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm">Cancel</button>
                    </form>
                  ) : null}
                  <ul className="text-sm divide-y divide-gray-900/60">
                    {departments.map(d => (
                      <li key={d._id} className="py-2 flex items-center justify-between">
                        <div>
                          <span>{d.name}</span> {d.code && <span className="text-xs text-gray-500">({d.code})</span>}
                        </div>
                        <div className="space-x-2 text-xs">
                          <button onClick={()=>setEditDept({ ...d })} className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700">Edit</button>
                          <button onClick={()=>deleteDepartment(d._id)} className="px-2 py-1 rounded bg-red-700 hover:bg-red-600">Delete</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-2">Backup / Restore</div>
                  <div className="space-x-2">
                    <button onClick={backup} className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-sm">Backup</button>
                    <button onClick={restore} className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-sm">Restore</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Logs */}
            <div className="p-4 bg-gray-900/60 rounded border border-gray-800">
              <h3 className="font-semibold mb-3">Activity Logs</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-gray-400 border-b border-gray-800"><tr><th className="py-2 pr-4">Actor</th><th className="py-2 pr-4">Action</th><th className="py-2 pr-4">When</th></tr></thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l._id} className="border-b border-gray-900/60">
                        <td className="py-2 pr-4">{l.actor?.name} <span className="text-xs text-gray-500">{l.actor?.email}</span></td>
                        <td className="py-2 pr-4">{l.action}</td>
                        <td className="py-2 pr-4">{new Date(l.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50" onClick={()=>setSelected(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xl font-semibold text-emerald-400">Review Submission</h4>
              <button onClick={()=>setSelected(null)} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700">
                <X className="w-5 h-5 text-gray-300" />
              </button>
            </div>
            <div className="mb-4">
              <div className="text-lg font-medium text-gray-200">{selected.title}</div>
              <div className="text-xs text-gray-400">{selected.uploadedBy?.name} <span className="text-gray-500">{selected.uploadedBy?.email}</span></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
              <div>
                <div className="text-gray-400 text-xs mb-1">Description</div>
                <div className="p-3 rounded bg-gray-900/60 border border-gray-800 min-h-[100px]">{selected.description || 'No description provided.'}</div>
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
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={approveSelected} className="px-3 py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-sm">Approve</button>
              <button onClick={rejectSelected} className="px-3 py-2 rounded bg-red-700 hover:bg-red-600 text-sm">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SuperadminDashboardPage
