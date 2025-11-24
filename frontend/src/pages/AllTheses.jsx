import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useLocation, useNavigate } from "react-router-dom";

const AllTheses = () => {
  const [files, setFiles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [sortBy, setSortBy] = useState("hot"); // hot | new | top
  const [page, setPage] = useState(1);
  const pageSize = 10;
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
    setPage(1);
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

  const filteredFiles = files
    .filter((f) => !filterDept || f.department === filterDept)
    .filter((f) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const title = (f.title || "").toLowerCase();
      const author = (f.author || "").toLowerCase();
      const course = (f.course || "").toLowerCase();
      const dept = (f.department || "").toLowerCase();
      const year = (f.yearPublished ? String(f.yearPublished) : "").toLowerCase();
      const desc = (f.description || "").toLowerCase();
      return (
        title.includes(q) ||
        author.includes(q) ||
        course.includes(q) ||
        dept.includes(q) ||
        year.includes(q) ||
        desc.includes(q)
      );
    })
    .sort((a, b) => {
      const scoreA = (a.upvotes || 0) - (a.downvotes || 0);
      const scoreB = (b.upvotes || 0) - (b.downvotes || 0);
      if (sortBy === "top") return scoreB - scoreA;
      if (sortBy === "new")
        return (
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
        );
      const now = Date.now();
      const ageA = Math.max(
        1,
        (now - new Date(a.createdAt).getTime()) / 36e5
      );
      const ageB = Math.max(
        1,
        (now - new Date(b.createdAt).getTime()) / 36e5
      );
      const hotA = scoreA / Math.pow(ageA + 2, 1.5);
      const hotB = scoreB / Math.pow(ageB + 2, 1.5);
      return hotB - hotA;
    });

  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedFiles = filteredFiles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, filterDept, sortBy]);

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
    <div className="fixed inset-0 text-gray-900 bg-white">
      <div className="relative z-10 flex flex-col h-full">
        <Navbar />
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <div className="flex-1 min-w-0 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6">
              <motion.div
                className="p-4 bg-white rounded-lg border border-gray-200"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* --- Header Search and Filter --- */}
                <div className="flex items-end justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">All Theses</h3>
                    <div className="hidden sm:flex items-center gap-1 text-xs">
                      <button onClick={() => setSortBy("hot")} className={`px-2 py-1 rounded border ${sortBy === "hot" ? "bg-primary text-white border-primary" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>Hot</button>
                      <button onClick={() => setSortBy("new")} className={`px-2 py-1 rounded border ${sortBy === "new" ? "bg-primary text-white border-primary" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>New</button>
                      <button onClick={() => setSortBy("top")} className={`px-2 py-1 rounded border ${sortBy === "top" ? "bg-primary text-white border-primary" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>Top</button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="p-2 rounded bg-white border border-gray-300 text-sm text-gray-900"
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

                {/* --- StackOverflow-style List --- */}
                <div className="divide-y divide-gray-200">
                  {filteredFiles.length > 0 ? (
                    pagedFiles.map((f, i) => (
                      <div key={i} className="py-4">
                        <div className="flex gap-4">
                          {/* Votes */}
                          <div className="w-16 shrink-0 text-center">
                            <div className="text-xl font-semibold text-gray-900">{(f.upvotes||0) - (f.downvotes||0)}</div>
                            <div className="text-[10px] text-gray-500">score</div>
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <button
                              className="text-left text-base font-medium text-primary hover:underline"
                              onClick={() => navigate(`/thesis/${f._id}`)}
                            >
                              {f.title}
                            </button>
                            <div className="mt-1 text-sm text-gray-600 line-clamp-2 break-words">{f.description || "No description."}</div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                              {f.department && (
                                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">{f.department}</span>
                              )}
                              {f.course && (
                                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">{f.course}</span>
                              )}
                              {f.yearPublished && (
                                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">{f.yearPublished}</span>
                              )}
                              <span className="ml-auto text-gray-500">by {f.author || 'Unknown'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-sm text-gray-500">
                      No theses found.
                    </div>
                  )}
                </div>

                {filteredFiles.length > pageSize && (
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-700">
                    <div>
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 rounded border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                      <button
                        className="px-3 py-1 rounded border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllTheses;
