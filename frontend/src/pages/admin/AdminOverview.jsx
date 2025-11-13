import React, { useEffect, useState } from "react";

const AdminOverview = () => {
  const [metrics, setMetrics] = useState(null);
  const headers = () => {
    const t = localStorage.getItem("token");
    return { Authorization: t ? `Bearer ${t}` : undefined };
  };
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3000/api/admin/metrics", { headers: headers(), credentials: "include" });
        const data = await res.json();
        setMetrics(data);
      } catch {}
    })();
  }, []);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-900/60 rounded border border-gray-800"><div className="text-xs text-gray-400">TOTAL STUDENTS</div><div className="text-2xl">{metrics?.totalStudents ?? '—'}</div></div>
        <div className="p-4 bg-gray-900/60 rounded border border-gray-800"><div className="text-xs text-gray-400">TOTAL TEACHERS</div><div className="text-2xl">{metrics?.totalTeachers ?? '—'}</div></div>
        <div className="p-4 bg-gray-900/60 rounded border border-gray-800"><div className="text-xs text-gray-400">TOTAL THESES</div><div className="text-2xl">{metrics?.totalTheses ?? '—'}</div></div>
        <div className="p-4 bg-gray-900/60 rounded border border-gray-800"><div className="text-xs text-gray-400">DEPARTMENTS</div><div className="text-2xl">{metrics?.totalDepartments ?? '—'}</div></div>
      </div>
    </div>
  );
};

export default AdminOverview;
