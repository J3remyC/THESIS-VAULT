import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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
    await fetch(`http://localhost:3000/api/admin/theses/${id}/reject`, { method: 'PATCH', headers: authHeaders(), credentials: 'include' })
    loadAll()
  }

  const addUser = async (e) => {
    e.preventDefault()
    await fetch('http://localhost:3000/api/superadmin/users', { method: 'POST', headers: authHeaders(), credentials: 'include', body: JSON.stringify(newUser) })
    setNewUser({ name: '', email: '', password: '', role: 'student' })
    loadAll()
  }

  const changeRole = async (id, role) => {
    await fetch(`http://localhost:3000/api/superadmin/users/${id}/role`, { method: 'PATCH', headers: authHeaders(), credentials: 'include', body: JSON.stringify({ role }) })
    loadAll()
  }

  const addDepartment = async (e) => {
    e.preventDefault()
    await fetch('http://localhost:3000/api/superadmin/departments', { method: 'POST', headers: authHeaders(), credentials: 'include', body: JSON.stringify(newDept) })
    setNewDept({ name: '', code: '' })
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
                              {['guest','student','admin'].map(r => (
                                <button key={r} onClick={() => changeRole(u._id, r)} className="px-2 py-1 text-xs rounded bg-gray-800 hover:bg-gray-700">{r}</button>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-2">Add New User</div>
                  <form onSubmit={addUser} className="grid grid-cols-2 gap-2">
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
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-gray-400 border-b border-gray-800"><tr><th className="py-2 pr-4">Title</th><th className="py-2 pr-4">Uploader</th><th className="py-2 pr-4">Department</th><th className="py-2 pr-4">Actions</th></tr></thead>
                  <tbody>
                    {pending.map(p => (
                      <tr key={p._id} className="border-b border-gray-900/60">
                        <td className="py-2 pr-4">{p.title}</td>
                        <td className="py-2 pr-4">{p.uploadedBy?.name} <span className="text-xs text-gray-500">{p.uploadedBy?.email}</span></td>
                        <td className="py-2 pr-4">{p.department || '—'}</td>
                        <td className="py-2 pr-4 space-x-2">
                          <button onClick={() => approve(p._id)} className="px-2 py-1 text-xs rounded bg-emerald-700 hover:bg-emerald-600">Approve</button>
                          <button onClick={() => reject(p._id)} className="px-2 py-1 text-xs rounded bg-red-700 hover:bg-red-600">Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  <ul className="text-sm">
                    {departments.map(d => (
                      <li key={d._id} className="py-1 border-b border-gray-900/60">{d.name} {d.code && <span className="text-xs text-gray-500">({d.code})</span>}</li>
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
    </div>
  )
}

export default SuperadminDashboardPage
