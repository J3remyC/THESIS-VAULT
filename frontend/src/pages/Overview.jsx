import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const Overview = () => {
  const [top, setTop] = useState([]);
  const [recent, setRecent] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pageTop, setPageTop] = useState(0);
  const [pageRecent, setPageRecent] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/upload");
        const data = await res.json();
        const files = Array.isArray(data) ? data : [];
        const byVotes = [...files]
          .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
        const byRecent = [...files];
        setTop(byVotes);
        setRecent(byRecent);
      } catch {}
    };
    load();
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-950 text-white">
      <Navbar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6 space-y-6">
            <h2 className="text-2xl font-semibold">Overview</h2>

            {/* Top Theses (list) */}
            <motion.div
              className="p-4 bg-gray-900/60 rounded-lg border border-gray-800"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold mb-3">Top Theses</h3>
              <ul className="divide-y divide-gray-800">
                {top.slice(pageTop*5, pageTop*5 + 5).map((f, i) => (
                  <li key={i} className="py-3 flex items-center justify-between cursor-pointer hover:bg-gray-800/40 px-2 rounded" onClick={()=>setSelected(f)}>
                    <div>
                      <div className="font-medium text-gray-200">{f.title}</div>
                      <div className="text-xs text-gray-400">{f.author}</div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="px-2 py-0.5 rounded bg-emerald-700/30 text-emerald-300">▲ {f.upvotes || 0}</span>
                      <span className="px-2 py-0.5 rounded bg-gray-700/30 text-gray-300">▼ {f.downvotes || 0}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-end gap-2 text-xs text-gray-400">
                <button disabled={pageTop===0} onClick={()=>setPageTop(p=>Math.max(0,p-1))} className={`px-2 py-1 rounded ${pageTop===0?'bg-gray-800 text-gray-500':'bg-gray-800 hover:bg-gray-700'}`}>Prev</button>
                <span>Page {pageTop+1} / {Math.max(1, Math.ceil(top.length/5))}</span>
                <button disabled={(pageTop+1)>=Math.ceil(top.length/5)} onClick={()=>setPageTop(p=>p+1)} className={`px-2 py-1 rounded ${((pageTop+1)>=Math.ceil(top.length/5))?'bg-gray-800 text-gray-500':'bg-gray-800 hover:bg-gray-700'}`}>Next</button>
              </div>
            </motion.div>

            {/* Recent Repositories (3x3 tiles) */}
            <motion.div
              className="p-4 bg-gray-900/60 rounded-lg border border-gray-800"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold mb-3">Recent Repositories</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {recent.slice(pageRecent*9, pageRecent*9 + 9).map((f, i) => (
                  <div key={i} className="p-4 rounded-lg border border-gray-800 bg-gray-900/60 hover:bg-gray-900/80 transition-colors cursor-pointer" onClick={()=>setSelected(f)}>
                    <div className="font-medium text-gray-200 line-clamp-2">{f.title}</div>
                    <div className="text-xs text-gray-400 mb-2">{f.author}</div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="px-2 py-0.5 rounded bg-emerald-700/30 text-emerald-300">▲ {f.upvotes || 0}</span>
                      <span className="px-2 py-0.5 rounded bg-gray-700/30 text-gray-300">▼ {f.downvotes || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {selected && (
  <div
    className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50"
    onClick={() => setSelected(null)}
  >
    <div
      className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center">
        <h4 className="text-2xl font-bold text-emerald-500">{selected.title}</h4>
        <button
          onClick={() => setSelected(null)}
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          <X className="w-5 h-5 text-gray-300" />
        </button>
      </div>

      <div className="flex flex-wrap gap-6 text-gray-300 text-sm">
        <p><span className="font-semibold">Description:</span> {selected.description || "No description."}</p>
        <p><span className="font-semibold">Author:</span> {selected.author || "—"}</p>
        <p><span className="font-semibold">Year:</span> {selected.yearPublished || "—"}</p>
        <p><span className="font-semibold">Department:</span> {selected.department || "—"}</p>
      </div>

      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem("token");
                const res = await fetch(
                  `http://localhost:3000/api/upload/${selected._id}/vote`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: token ? `Bearer ${token}` : undefined,
                    },
                    credentials: "include",
                    body: JSON.stringify({ type: "up" }),
                  }
                );
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
                const res = await fetch(
                  `http://localhost:3000/api/upload/${selected._id}/vote`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: token ? `Bearer ${token}` : undefined,
                    },
                    credentials: "include",
                    body: JSON.stringify({ type: "down" }),
                  }
                );
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
          {selected.url && (
            <a
              href={selected.url}
              target="_blank"
              rel="noreferrer"
              download
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors"
            >
              Download
            </a>
          )}
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

export default Overview;
