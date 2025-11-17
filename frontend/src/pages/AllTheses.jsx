import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import FloatingShape from "../components/FloatingShape";
import { X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const AllTheses = () => {
  const [files, setFiles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [selected, setSelected] = useState(null);
  const [sortBy, setSortBy] = useState("hot"); // hot | new | top
  const location = useLocation();
  const navigate = useNavigate();

  const fetchFiles = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/upload");
      const data = await res.json();
      setFiles(Array.isArray(data) ? data.filter((f) => f.url && !f.trashed) : []);
    } catch {}
  };

  useEffect(() => {
    // Initialize from URL params
    const sp = new URLSearchParams(location.search);
    const initialQ = sp.get("q") || "";
    const initialDept = sp.get("dept") || "";
    setSearch(initialQ);
    setFilterDept(initialDept);
  }, [location.search]);

  useEffect(() => {
    fetchFiles();
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/api/catalog/departments", {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
          credentials: "include",
        });
        const data = await res.json();
        setDepartments(Array.isArray(data) ? data : []);
      } catch {}
    })();
  }, []);

  // Reflect search and filter to URL (replace state)
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const curQ = sp.get("q") || "";
    const curDept = sp.get("dept") || "";
    if (search !== curQ || filterDept !== curDept) {
      if (search) sp.set("q", search); else sp.delete("q");
      if (filterDept) sp.set("dept", filterDept); else sp.delete("dept");
      navigate({ pathname: "/theses", search: sp.toString() ? `?${sp.toString()}` : "" }, { replace: true });
    }
  }, [search, filterDept]);

  return (
    <div className="fixed inset-0 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900" />
      <FloatingShape color="bg-green-500" size="w-64 h-64" top="-5%" left="10%" delay={0} />
      <FloatingShape color="bg-emerald-500" size="w-48 h-48" top="70%" left="80%" delay={5} />
      <FloatingShape color="bg-lime-500" size="w-32 h-32" top="40%" left="10%" delay={2} />

      <div className="relative z-10 flex flex-col h-full">
        <Navbar />
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <div className="flex-1 min-w-0 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6">
              <motion.div
                className="p-4 bg-gray-900/60 rounded-lg border border-gray-800"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* --- Header Search and Filter --- */}
                <div className="flex items-end justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">All Theses</h3>
                    <div className="hidden sm:flex items-center gap-1 text-xs">
                      <button onClick={() => setSortBy("hot")} className={`px-2 py-1 rounded ${sortBy === "hot" ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-300"}`}>Hot</button>
                      <button onClick={() => setSortBy("new")} className={`px-2 py-1 rounded ${sortBy === "new" ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-300"}`}>New</button>
                      <button onClick={() => setSortBy("top")} className={`px-2 py-1 rounded ${sortBy === "top" ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-300"}`}>Top</button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="p-2 rounded bg-gray-800 border border-gray-700 text-sm"
                      placeholder="Search title/author/course"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                      className="p-2 rounded bg-gray-800 border border-gray-700 text-sm"
                      value={filterDept}
                      onChange={(e) => setFilterDept(e.target.value)}
                    >
                      <option value="">All Departments</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d.code || d.name}>
                          {(d.code ? d.code : "").toUpperCase()} — {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* --- Thesis Cards --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {files
                    .filter((f) => !filterDept || f.department === filterDept)
                    .filter((f) => {
                      const q = search.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        (f.title || "").toLowerCase().includes(q) ||
                        (f.author || "").toLowerCase().includes(q) ||
                        (f.course || "").toLowerCase().includes(q)
                      );
                    })
                    .sort((a, b) => {
                      const scoreA = (a.upvotes || 0) - (a.downvotes || 0);
                      const scoreB = (b.upvotes || 0) - (b.downvotes || 0);
                      if (sortBy === "top") return scoreB - scoreA;
                      if (sortBy === "new") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                      // hot ranking approximation
                      const now = Date.now();
                      const ageA = Math.max(1, (now - new Date(a.createdAt).getTime()) / 36e5); // hours
                      const ageB = Math.max(1, (now - new Date(b.createdAt).getTime()) / 36e5);
                      const hotA = scoreA / Math.pow(ageA + 2, 1.5);
                      const hotB = scoreB / Math.pow(ageB + 2, 1.5);
                      return hotB - hotA;
                    })
                    .map((f, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-lg border border-gray-800 bg-gray-900/60 hover:bg-gray-900/80 transition-colors cursor-pointer flex flex-col justify-between"
                        onClick={() => setSelected(f)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="font-medium text-gray-200 line-clamp-2">{f.title}</div>
                        </div>

                        <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
                          <span>{f.author}</span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-700/30 text-emerald-300">
                              ▲ {f.upvotes || 0}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-gray-700/30 text-gray-300">
                              ▼ {f.downvotes || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Modal --- */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <h4 className="text-2xl font-bold text-emerald-500">{selected.title}</h4>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                <X className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            {/* Info Section */}
            <div className="flex justify-between flex-wrap gap-3 text-gray-300 text-sm">
              <p><span className="font-semibold">Author:</span> {selected.author || "—"}</p>
              <p><span className="font-semibold">Year:</span> {selected.yearPublished || "—"}</p>
              <p><span className="font-semibold">Department:</span> {selected.department || "—"}</p>
            </div>
            <p className="text-gray-400 text-sm">
              <span className="font-semibold text-gray-200">Description:</span> {selected.description || "No description."}
            </p>

            {/* Action Buttons */}
            <div className="flex justify-between items-center flex-wrap gap-4">
              {/* Upvote / Downvote */}
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("token");
                      const res = await fetch(`http://localhost:3000/api/upload/${selected._id}/vote`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: token ? `Bearer ${token}` : undefined,
                        },
                        credentials: "include",
                        body: JSON.stringify({ type: "up" }),
                      });
                      const data = await res.json();
                      setSelected(data);
                    } catch {}
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors text-sm font-medium"
                >
                  ▲ Upvote
                </button>
                <span className="text-gray-300">{selected.upvotes || 0}</span>

                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("token");
                      const res = await fetch(`http://localhost:3000/api/upload/${selected._id}/vote`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: token ? `Bearer ${token}` : undefined,
                        },
                        credentials: "include",
                        body: JSON.stringify({ type: "down" }),
                      });
                      const data = await res.json();
                      setSelected(data);
                    } catch {}
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  ▼ Downvote
                </button>
                <span className="text-gray-400">{selected.downvotes || 0}</span>
              </div>

              {/* Other Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {selected.url && (
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-sm font-medium transition-colors"
                  >
                    View
                  </a>
                )}
                <a
                  href={`http://localhost:3000/api/upload/${selected._id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  download={selected.filename || undefined}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors"
                >
                  Download
                </a>
                <button
                  onClick={() => alert("Reported.")}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-medium transition-colors"
                >
                  Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllTheses;
