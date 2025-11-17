import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import FloatingShape from "../components/FloatingShape";
import { useAuthStore } from "../store/authStore";

const ThesisDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [thesis, setThesis] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuthStore();

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("http://localhost:3000/api/upload");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Unexpected response");
        const found = data.find((f) => String(f._id) === String(id));
        if (active) {
          if (!found) setError("Thesis not found or not approved.");
          setThesis(found || null);
        }
      } catch (e) {
        if (active) setError("Failed to load thesis.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [id]);

  const score = useMemo(() => {
    if (!thesis) return 0;
    return (thesis.upvotes || 0) - (thesis.downvotes || 0);
  }, [thesis]);

  const hasUpvoted = useMemo(() => {
    if (!thesis || !user?._id) return false;
    return Array.isArray(thesis.upvoters) && thesis.upvoters.some((x) => String(x) === String(user._id));
  }, [thesis, user]);

  const hasDownvoted = useMemo(() => {
    if (!thesis || !user?._id) return false;
    return Array.isArray(thesis.downvoters) && thesis.downvoters.some((x) => String(x) === String(user._id));
  }, [thesis, user]);

  const vote = async (type) => {
    if (!thesis) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/api/upload/${thesis._id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        credentials: "include",
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      setThesis(data);
    } catch (e) {
      // noop
    }
  };

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
              {/* Breadcrumbs */}
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <button onClick={() => navigate("/")} className="hover:text-gray-200">Home</button>
                <span>/</span>
                <button onClick={() => navigate("/theses")} className="hover:text-gray-200">Theses</button>
                <span>/</span>
                <span className="text-gray-300 truncate max-w-[50ch]">{thesis?.title || "Thesis"}</span>
              </div>

              {/* Repo-like header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold truncate">{thesis?.title || "Thesis"}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(-1)} className="px-3 py-1.5 text-sm rounded bg-gray-800 hover:bg-gray-700">Back</button>
                  {thesis?.url && (
                    <a
                      href={thesis.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 text-sm rounded bg-emerald-600 hover:bg-emerald-500"
                    >
                      View
                    </a>
                  )}
                  {thesis?._id && (
                    <a
                      href={`http://localhost:3000/api/upload/${thesis._id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 text-sm rounded bg-gray-700 hover:bg-gray-600"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>

              {/* Tabs-like bar */}
              <div className="border-b border-gray-800 flex gap-6 text-sm" role="tablist">
                <button
                  role="tab"
                  aria-selected={activeTab === "overview"}
                  onClick={() => setActiveTab("overview")}
                  className={`py-2 ${activeTab === "overview" ? "border-b-2 border-emerald-500 text-gray-200" : "text-gray-400 hover:text-gray-200"}`}
                >
                  Overview
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === "files"}
                  onClick={() => setActiveTab("files")}
                  className={`py-2 ${activeTab === "files" ? "border-b-2 border-emerald-500 text-gray-200" : "text-gray-400 hover:text-gray-2 00"}`}
                >
                  Files
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === "insights"}
                  onClick={() => setActiveTab("insights")}
                  className={`py-2 ${activeTab === "insights" ? "border-b-2 border-emerald-500 text-gray-200" : "text-gray-400 hover:text-gray-200"}`}
                >
                  Insights
                </button>
              </div>

              {/* Main two-column layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: tabbed content */}
                <div className="md:col-span-2 space-y-4">
                  {activeTab === "overview" && (
                    <>
                      <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-lg">
                        <div className="text-sm text-gray-400 mb-2">README.md</div>
                        {loading ? (
                          <div className="text-gray-400">Loading...</div>
                        ) : error ? (
                          <div className="text-red-400">{error}</div>
                        ) : (
                          <div className="prose prose-invert max-w-none">
                            <p className="whitespace-pre-wrap">{thesis?.description || "No description provided."}</p>
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-lg">
                        <div className="text-sm text-gray-400 mb-3">Metadata</div>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li><span className="text-gray-400">Author:</span> {thesis?.author || "—"}</li>
                          <li><span className="text-gray-400">Year:</span> {thesis?.yearPublished || "—"}</li>
                          <li><span className="text-gray-400">Department:</span> {thesis?.department || "—"}</li>
                          <li><span className="text-gray-400">Course:</span> {thesis?.course || "—"}</li>
                          <li><span className="text-gray-400">Filename:</span> {thesis?.filename || "—"}</li>
                        </ul>
                      </div>
                    </>
                  )}

                  {activeTab === "files" && (
                    <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-lg space-y-3">
                      <div className="text-sm text-gray-400">Files</div>
                      <div className="flex items-center justify-between p-3 rounded border border-gray-800 bg-gray-900/60">
                        <div>
                          <div className="text-gray-200 text-sm">{thesis?.filename || "thesis"}</div>
                          <div className="text-xs text-gray-500">{thesis?.format || thesis?.resourceType || "file"}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {thesis?.url && (
                            <a href={thesis.url} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-sm rounded bg-emerald-600 hover:bg-emerald-500">View</a>
                          )}
                          {thesis?._id && (
                            <a href={`http://localhost:3000/api/upload/${thesis._id}/download`} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-sm rounded bg-gray-700 hover:bg-gray-600">Download</a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "insights" && (
                    <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-lg space-y-3">
                      <div className="text-sm text-gray-400">Insights</div>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li><span className="text-gray-400">Upvotes:</span> {thesis?.upvotes || 0}</li>
                        <li><span className="text-gray-400">Downvotes:</span> {thesis?.downvotes || 0}</li>
                        <li><span className="text-gray-400">Score:</span> {score}</li>
                        <li><span className="text-gray-400">Uploaded by:</span> {thesis?.uploadedBy?.name || thesis?.uploadedBy?.email || "Unknown"}</li>
                        <li><span className="text-gray-400">Created:</span> {thesis?.createdAt ? new Date(thesis.createdAt).toLocaleString() : "—"}</li>
                        <li><span className="text-gray-400">Format:</span> {thesis?.format || thesis?.resourceType || "—"}</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Right: sidebar cards like GitHub repo insights */}
                <div className="space-y-4">
                  <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-lg">
                    <div className="text-sm text-gray-400 mb-2">Voting</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => vote("up")}
                        className={`px-3 py-1.5 text-sm rounded ${hasUpvoted ? "bg-emerald-500" : "bg-emerald-600 hover:bg-emerald-500"}`}
                      >
                        ▲ Upvote
                      </button>
                      <span className="text-gray-200 text-sm">{thesis?.upvotes || 0}</span>
                      <button
                        onClick={() => vote("down")}
                        className={`px-3 py-1.5 text-sm rounded ${hasDownvoted ? "bg-gray-700" : "bg-gray-800 hover:bg-gray-700"}`}
                      >
                        ▼ Downvote
                      </button>
                      <span className="text-gray-400 text-sm">{thesis?.downvotes || 0}</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">Score: {score}</div>
                  </div>

                  <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-lg">
                    <div className="text-sm text-gray-400 mb-2">About</div>
                    <div className="text-sm text-gray-300">Uploaded by: {thesis?.uploadedBy?.name || thesis?.uploadedBy?.email || "Unknown"}</div>
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

export default ThesisDetail;
