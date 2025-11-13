import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const Overview = () => {
  const [top, setTop] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/upload");
        const data = await res.json();
        const files = Array.isArray(data) ? data : [];
        const byVotes = [...files]
          .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
          .slice(0, 5);
        const byRecent = [...files].slice(0, 10);
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

            {/* Top Theses */}
            <motion.div
              className="p-4 bg-gray-900/60 rounded-lg border border-gray-800"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold mb-3">Top Theses</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-gray-400 border-b border-gray-800">
                    <tr>
                      <th className="py-2 pr-4">Title</th>
                      <th className="py-2 pr-4">Author</th>
                      <th className="py-2 pr-4">Upvotes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top.map((f, i) => (
                      <tr key={i} className="border-b border-gray-900/60">
                        <td className="py-2 pr-4">{f.title}</td>
                        <td className="py-2 pr-4 text-gray-300">{f.author}</td>
                        <td className="py-2 pr-4">{f.upvotes || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Recent Repositories */}
            <motion.div
              className="p-4 bg-gray-900/60 rounded-lg border border-gray-800"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold mb-3">Recent Repositories</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-gray-400 border-b border-gray-800">
                    <tr>
                      <th className="py-2 pr-4">Title</th>
                      <th className="py-2 pr-4">Author</th>
                      <th className="py-2 pr-4">Uploaded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((f, i) => (
                      <tr key={i} className="border-b border-gray-900/60">
                        <td className="py-2 pr-4">{f.title}</td>
                        <td className="py-2 pr-4 text-gray-300">{f.author}</td>
                        <td className="py-2 pr-4 text-gray-400">{new Date(f.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
