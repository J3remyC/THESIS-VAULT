import React from 'react'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

const AdminDashboardPage = () => {
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, deleted: 0 })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const headers = () => {
    const t = localStorage.getItem('token')
    return { Authorization: t ? `Bearer ${t}` : undefined }
  }

  const loadCounts = async () => {
    try {
      setLoading(true)
      const [pendingRes, approvedRes, trashRes] = await Promise.all([
        fetch('http://localhost:3000/api/admin/theses/pending', { headers: headers(), credentials: 'include' }),
        fetch('http://localhost:3000/api/admin/theses?status=approved', { headers: headers(), credentials: 'include' }),
        fetch('http://localhost:3000/api/admin/theses/trash', { headers: headers(), credentials: 'include' }),
      ])
      const [pending, approved, trash] = await Promise.all([
        pendingRes.json().catch(() => []),
        approvedRes.json().catch(() => []),
        trashRes.json().catch(() => []),
      ])

      const rejected = Array.isArray(trash) ? trash.filter(i => i.trashReason === 'rejected').length : 0
      const deleted = Array.isArray(trash) ? trash.filter(i => i.trashReason === 'deleted' || !i.trashReason).length : 0

      setCounts({
        pending: Array.isArray(pending) ? pending.length : 0,
        approved: Array.isArray(approved) ? approved.length : 0,
        rejected,
        deleted,
      })
      setLastUpdated(new Date())
    } catch (e) {
      setCounts({ pending: 0, approved: 0, rejected: 0, deleted: 0 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCounts() }, [])
  useEffect(() => {
    const id = setInterval(() => { loadCounts() }, 30000)
    return () => clearInterval(id)
  }, [])

  const data = {
    labels: ['Pending', 'Approved', 'Rejected', 'Deleted'],
    datasets: [
      {
        data: [counts.pending, counts.approved, counts.rejected, counts.deleted],
        backgroundColor: [
          'rgba(234,179,8,0.6)',   // yellow-500
          'rgba(16,185,129,0.6)',  // emerald-500
          'rgba(239,68,68,0.6)',   // red-500
          'rgba(107,114,128,0.6)', // gray-500
        ],
        borderColor: [
          'rgb(234,179,8)',
          'rgb(16,185,129)',
          'rgb(239,68,68)',
          'rgb(107,114,128)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
      title: { display: true, text: 'Thesis Submissions Overview' },
      tooltip: { enabled: true },
    },
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3 text-gray-900">Admin Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-3 rounded border border-gray-200 bg-white">
          <div className="text-xs text-gray-500">Pending</div>
          <div className="text-2xl font-semibold text-gray-900">{counts.pending}</div>
        </div>
        <div className="p-3 rounded border border-gray-200 bg-white">
          <div className="text-xs text-gray-500">Approved</div>
          <div className="text-2xl font-semibold text-gray-900">{counts.approved}</div>
        </div>
        <div className="p-3 rounded border border-gray-200 bg-white">
          <div className="text-xs text-gray-500">Rejected</div>
          <div className="text-2xl font-semibold text-gray-900">{counts.rejected}</div>
        </div>
        <div className="p-3 rounded border border-gray-200 bg-white">
          <div className="text-xs text-gray-500">Deleted</div>
          <div className="text-2xl font-semibold text-gray-900">{counts.deleted}</div>
        </div>
      </div>
      <div className="mb-2 text-xs text-gray-500">{lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : ''}</div>
      {loading ? (
        <div className="text-sm text-gray-500">Loading chart...</div>
      ) : (
        <div className="w-full h-80 rounded border border-gray-200 bg-white p-3">
          <Doughnut data={data} options={options} />
        </div>
      )}
    </div>
  )
}

export default AdminDashboardPage
