import React, { useEffect, useMemo, useState } from "react";

const AdminOverview = () => {
  const [metrics, setMetrics] = useState(null);
  const [theses, setTheses] = useState([]);

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

      {/* Uploads last 14 days mini-chart */}
      <div className="p-4 bg-white rounded border border-gray-200">
        <div className="flex items-end gap-1 h-32">
          {series.map((s, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-primary/80" style={{ height: `${(s.value / maxVal) * 100}%` }} />
              <div className="mt-1 text-[10px] text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-500">Uploads over last 14 days</div>
      </div>
    </div>
  );
};

export default AdminOverview;
