import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import FloatingShape from "../components/FloatingShape";
import { useAuthStore } from "../store/authStore";

const Overview = () => {
  const [top, setTop] = useState([]);
  const [recent, setRecent] = useState([]);
  const [pageTop, setPageTop] = useState(0);
  const [pageRecent, setPageRecent] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/upload");
        const data = await res.json();
        const files = Array.isArray(data) ? data.filter((f) => !f.trashed) : [];
        const byVotes = [...files].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
        const byRecent = [...files];
        setTop(byVotes);
        setRecent(byRecent);
      } catch {}
    };
    load();
  }, []);

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
            <div className="max-w-6xl mx-auto p-6 space-y-6">
              <h2 className="text-2xl font-semibold">Overview</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Left: Recent list */}
                <div className="md:col-span-2 min-w-0">
                  {/* Recent Theses (top 3) */}
                  <motion.div
                    className="p-4 bg-gray-900/60 rounded-lg border border-gray-800"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h3 className="text-lg font-semibold mb-3">Recent Theses</h3>
                    <ul className="divide-y divide-gray-800">
                      {recent.slice(0, 5).map((f, i) => (
                        <li
                          key={i}
                          className="py-3 px-2 rounded hover:bg-gray-800/40 cursor-pointer"
                          onClick={() => navigate(`/thesis/${f._id}`)}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium text-gray-200 truncate">{f.title}</div>
                              <div className="text-xs text-gray-400 truncate">{f.author || "Unknown"}{f.yearPublished ? ` • ${f.yearPublished}` : ""}{f.department ? ` • ${f.department}` : ""}</div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
                              <span className="px-2 py-0.5 rounded bg-emerald-700/30 text-emerald-300">▲ {f.upvotes || 0}</span>
                              <span className="px-2 py-0.5 rounded bg-gray-700/30 text-gray-300">▼ {f.downvotes || 0}</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* All Theses (Reddit-like list with pagination) */}
                  <motion.div
                    className="p-4 bg-gray-900/60 rounded-lg border border-gray-800 mt-6"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h3 className="text-lg font-semibold mb-3">All Theses</h3>
                    <ul className="space-y-3">
                      {recent.slice(pageRecent * 10, pageRecent * 10 + 10).map((f, i) => (
                        <li
                          key={`${f._id}-${i}`}
                          className="flex gap-4 p-3 rounded-lg border border-gray-800 bg-gray-900/60 hover:bg-gray-900/80 cursor-pointer"
                          onClick={() => navigate(`/thesis/${f._id}`)}
                        >
                          <div className="flex flex-col items-center justify-start w-12 shrink-0">
                            <button
                              className={`text-sm ${Array.isArray(f.upvoters) && user?._id && f.upvoters.some((x) => String(x) === String(user._id)) ? "text-emerald-300" : "text-emerald-400"}`}
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const token = localStorage.getItem("token");
                                  const res = await fetch(`http://localhost:3000/api/upload/${f._id}/vote`, {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: token ? `Bearer ${token}` : undefined,
                                    },
                                    credentials: "include",
                                    body: JSON.stringify({ type: "up" }),
                                  });
                                  const updated = await res.json();
                                  setRecent((prev) => prev.map((it) => (it._id === updated._id ? updated : it)));
                                  setTop((prev) => prev.map((it) => (it._id === updated._id ? updated : it)));
                                } catch {}
                              }}
                            >
                              ▲
                            </button>
                            <div className="text-gray-300 text-sm">{(f.upvotes || 0) - (f.downvotes || 0)}</div>
                            <button
                              className={`text-sm ${Array.isArray(f.downvoters) && user?._id && f.downvoters.some((x) => String(x) === String(user._id)) ? "text-gray-200" : "text-gray-400"}`}
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const token = localStorage.getItem("token");
                                  const res = await fetch(`http://localhost:3000/api/upload/${f._id}/vote`, {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: token ? `Bearer ${token}` : undefined,
                                    },
                                    credentials: "include",
                                    body: JSON.stringify({ type: "down" }),
                                  });
                                  const updated = await res.json();
                                  setRecent((prev) => prev.map((it) => (it._id === updated._id ? updated : it)));
                                  setTop((prev) => prev.map((it) => (it._id === updated._id ? updated : it)));
                                } catch {}
                              }}
                            >
                              ▼
                            </button>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-200 truncate">{f.title}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              by <span className="text-gray-300">{f.author || "Unknown"}</span>
                              {f.yearPublished ? <span> • {f.yearPublished}</span> : null}
                              {f.department ? <span> • {f.department}</span> : null}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-center justify-end gap-2 text-xs text-gray-400">
                      <button
                        disabled={pageRecent === 0}
                        onClick={() => setPageRecent((p) => Math.max(0, p - 1))}
                        className={`px-2 py-1 rounded ${pageRecent === 0 ? "bg-gray-800 text-gray-500" : "bg-gray-800 hover:bg-gray-700"}`}
                      >
                        Prev
                      </button>
                      <span>Page {pageRecent + 1} / {Math.max(1, Math.ceil(recent.length / 10))}</span>
                      <button
                        disabled={pageRecent + 1 >= Math.ceil(recent.length / 10)}
                        onClick={() => setPageRecent((p) => p + 1)}
                        className={`px-2 py-1 rounded ${pageRecent + 1 >= Math.ceil(recent.length / 10)
                          ? "bg-gray-800 text-gray-500"
                          : "bg-gray-800 hover:bg-gray-700"
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </motion.div>
                </div>

                {/* Right: Top Theses sidebar */}
                <div className="md:col-span-1">
                  <div className="md:sticky md:top-6 space-y-4">
                    <motion.div
                      className="p-4 bg-gray-900/60 rounded-lg border border-gray-800"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <h3 className="text-lg font-semibold mb-3">Top Theses</h3>
                      <ul className="divide-y divide-gray-800">
                        {top.slice(pageTop * 5, pageTop * 5 + 5).map((f, i) => (
                          <li
                            key={i}
                            className="py-3 flex items-center justify-between cursor-pointer hover:bg-gray-800/40 px-2 rounded"
                            onClick={() => navigate(`/thesis/${f._id}`)}
                          >
                            <div>
                              <div className="font-medium text-gray-200 line-clamp-2 max-w-[18rem]">{f.title}</div>
                              <div className="text-xs text-gray-400">{f.author}</div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              {(() => {
                                const uid = user?._id ? String(user._id) : null;
                                const upv = Array.isArray(f.upvoters) && uid ? f.upvoters.some((x) => String(x) === uid) : false;
                                const dnv = Array.isArray(f.downvoters) && uid ? f.downvoters.some((x) => String(x) === uid) : false;
                                return (
                                  <>
                                    <span className={`px-2 py-0.5 rounded ${upv ? "bg-emerald-600/40 text-emerald-200" : "bg-emerald-700/30 text-emerald-300"}`}>▲ {f.upvotes || 0}</span>
                                    <span className={`px-2 py-0.5 rounded ${dnv ? "bg-gray-600/40 text-gray-200" : "bg-gray-700/30 text-gray-300"}`}>▼ {f.downvotes || 0}</span>
                                  </>
                                );
                              })()}
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex items-center justify-end gap-2 text-xs text-gray-400">
                        <button
                          disabled={pageTop === 0}
                          onClick={() => setPageTop((p) => Math.max(0, p - 1))}
                          className={`px-2 py-1 rounded ${pageTop === 0 ? "bg-gray-800 text-gray-500" : "bg-gray-800 hover:bg-gray-700"}`}
                        >
                          Prev
                        </button>
                        <span>Page {pageTop + 1} / {Math.max(1, Math.ceil(top.length / 5))}</span>
                        <button
                          disabled={pageTop + 1 >= Math.ceil(top.length / 5)}
                          onClick={() => setPageTop((p) => p + 1)}
                          className={`px-2 py-1 rounded ${pageTop + 1 >= Math.ceil(top.length / 5)
                            ? "bg-gray-800 text-gray-500"
                            : "bg-gray-800 hover:bg-gray-700"
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Overview;
