import React, { useEffect, useMemo, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { useNavigate } from 'react-router-dom'

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const AdminOverview = () => {
  const [metrics, setMetrics] = useState(null);
  const [theses, setTheses] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, deleted: 0 });
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [chartType, setChartType] = useState('doughnut'); // 'doughnut' | 'bar'
  const navigate = useNavigate();

  const headers = () => {
    const t = localStorage.getItem("token");
    return { Authorization: t ? `Bearer ${t}` : undefined };
  };

  useEffect(() => {
    (async () => {
      try {
        const [mRes, tRes] = await Promise.all([
          fetch("http://localhost:3000/api/admin/metrics", { headers: headers(), credentials: "include" }),
          fetch("http://localhost:3000/api/admin/theses", { headers: headers(), credentials: "include" }),
        ]);
        const m = await mRes.json();
        const t = await tRes.json();
        setMetrics(m);
        setTheses(Array.isArray(t) ? t : []);
      } catch {}
    })();
  }, []);

  // Load status counts for doughnut chart
  const loadCounts = async () => {
    try {
      setLoadingCounts(true)
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
      setLoadingCounts(false)
    }
  }

  useEffect(() => { loadCounts() }, [])
  useEffect(() => {
    const id = setInterval(() => { loadCounts() }, 30000)
    return () => clearInterval(id)
  }, [])

  // Aggregate uploads per day (last 14 days)
  const series = useMemo(() => {
    const days = 14;
    const now = new Date();
    const buckets = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets.push({ key, label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), value: 0 });
    }
    const map = Object.fromEntries(buckets.map(b => [b.key, b]));
    theses.forEach(f => {
      const k = (f.createdAt || '').slice(0,10);
      if (map[k]) map[k].value += 1;
    });
    return buckets;
  }, [theses]);

  const maxVal = Math.max(1, ...series.map(s => s.value));

  const doughnutData = {
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

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
      title: { display: true, text: 'Thesis Submissions Overview' },
      tooltip: { enabled: true },
    },
  }

  const handleStatusChartClick = (_evt, elements) => {
    if (!elements || elements.length === 0) return;
    const idx = elements[0].index;
    // 0: Pending, 1: Approved, 2: Rejected, 3: Deleted
    if (idx === 0) navigate('/admin-dashboard/theses/pending');
    else if (idx === 1) navigate('/admin-dashboard/theses?status=approved');
    else if (idx === 2) navigate('/admin-dashboard/theses/trash');
    else if (idx === 3) navigate('/admin-dashboard/theses/trash');
  }

  const uploadsData = {
    labels: series.map(s => s.label),
    datasets: [
      {
        label: 'Uploads',
        data: series.map(s => s.value),
        backgroundColor: 'rgba(59,130,246,0.6)', // blue-500-ish
        borderColor: 'rgb(59,130,246)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const uploadsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Uploads over last 14 days' },
      tooltip: { enabled: true },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Admin Overview</h2>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded border border-gray-200"><div className="text-xs text-gray-500">TOTAL STUDENTS</div><div className="text-2xl text-gray-900">{metrics?.totalStudents ?? '—'}</div></div>
        <div className="p-4 bg-white rounded border border-gray-200"><div className="text-xs text-gray-500">TOTAL TEACHERS</div><div className="text-2xl text-gray-900">{metrics?.totalTeachers ?? '—'}</div></div>
        <div className="p-4 bg-white rounded border border-gray-200"><div className="text-xs text-gray-500">TOTAL THESES</div><div className="text-2xl text-gray-900">{metrics?.totalTheses ?? '—'}</div></div>
        <div className="p-4 bg-white rounded border border-gray-200"><div className="text-xs text-gray-500">DEPARTMENTS</div><div className="text-2xl text-gray-900">{metrics?.totalDepartments ?? '—'}</div></div>
      </div>

      {/* Status overview + uploads chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-900">Theses by status</div>
            <div className="flex gap-2">
              <button onClick={() => setChartType('doughnut')} className={`px-2 py-1 text-xs rounded border ${chartType==='doughnut'?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Doughnut</button>
              <button onClick={() => setChartType('bar')} className={`px-2 py-1 text-xs rounded border ${chartType==='bar'?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Bar</button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
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
          {loadingCounts ? (
            <div className="text-sm text-gray-500">Loading chart...</div>
          ) : (
            <div className="w-full h-72">
              {chartType==='doughnut' ? (
                <Doughnut data={doughnutData} options={doughnutOptions} onClick={handleStatusChartClick} />
              ) : (
                <Bar data={doughnutData} options={{
                  ...doughnutOptions,
                  plugins: { ...doughnutOptions.plugins, legend: { display: false }, title: { display: true, text: 'Thesis Submissions Overview' } },
                  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
                  onClick: handleStatusChartClick,
                }} />
              )}
            </div>
          )}
        </div>

        {/* Uploads last 14 days (functional bar chart) */}
        <div className="p-4 bg-white rounded border border-gray-200">
          <div className="w-full h-72">
            <Bar data={uploadsData} options={uploadsOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
;

export default AdminOverview;
