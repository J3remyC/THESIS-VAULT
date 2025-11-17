import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
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
    <div className="fixed inset-0 text-gray-900 bg-white">
      <div className="relative z-10 flex flex-col h-full">
        <Navbar />
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <div className="flex-1 min-w-0 overflow-y-auto">
            <div className="max-w-6xl mx-auto p-6 space-y-6">
              {/* Breadcrumbs */}
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <button onClick={() => navigate("/")} className="hover:text-gray-700">Home</button>
                <span>/</span>
                <button onClick={() => navigate("/theses")} className="hover:text-gray-700">Theses</button>
                <span>/</span>
                <span className="text-gray-700 truncate max-w-[50ch]">{thesis?.title || "Thesis"}</span>
              </div>

              {/* Repo-like header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold truncate">{thesis?.title || "Thesis"}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(-1)} className="px-3 py-1.5 text-sm rounded bg-gray-100 hover:bg-gray-200 text-gray-900">Back</button>
                  {thesis?.url && (
                    <a
                      href={thesis.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 text-sm rounded bg-primary hover:brightness-110 text-white"
                    >
                      View
                    </a>
                  )}
                  {thesis?._id && (
                    <a
                      href={`http://localhost:3000/api/upload/${thesis._id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 text-sm rounded bg-gray-100 hover:bg-gray-200 text-gray-900"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>

              {/* Tabs-like bar */}
              <div className="border-b border-gray-200 flex gap-6 text-sm" role="tablist">
                <button
                  role="tab"
                  aria-selected={activeTab === "overview"}
                  onClick={() => setActiveTab("overview")}
                  className={`py-2 ${activeTab === "overview" ? "border-b-2 border-primary text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Overview
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === "files"}
                  onClick={() => setActiveTab("files")}
                  className={`py-2 ${activeTab === "files" ? "border-b-2 border-primary text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Files
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === "insights"}
                  onClick={() => setActiveTab("insights")}
                  className={`py-2 ${activeTab === "insights" ? "border-b-2 border-primary text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
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
                      <div className="p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="text-sm text-gray-500 mb-2">README.md</div>
                        {loading ? (
                          <div className="text-gray-500">Loading...</div>
                        ) : error ? (
                          <div className="text-red-600">{error}</div>
                        ) : (
                          <div className="prose max-w-none">
                            <p className="whitespace-pre-wrap">{thesis?.description || "No description provided."}</p>
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="text-sm text-gray-500 mb-3">Metadata</div>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li><span className="text-gray-500">Author:</span> {thesis?.author || "—"}</li>
                          <li><span className="text-gray-500">Year:</span> {thesis?.yearPublished || "—"}</li>
                          <li><span className="text-gray-500">Department:</span> {thesis?.department || "—"}</li>
                          <li><span className="text-gray-500">Course:</span> {thesis?.course || "—"}</li>
                          <li><span className="text-gray-500">Filename:</span> {thesis?.filename || "—"}</li>
                        </ul>
                      </div>
                    </>
                  )}

                  {activeTab === "files" && (
                    <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-3">
                      <div className="text-sm text-gray-500">Files</div>
                      <div className="flex items-center justify-between p-3 rounded border border-gray-200 bg-white">
                        <div>
                          <div className="text-gray-900 text-sm">{thesis?.filename || "thesis"}</div>
                          <div className="text-xs text-gray-500">{thesis?.format || thesis?.resourceType || "file"}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {thesis?.url && (
                            <a href={thesis.url} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-sm rounded bg-primary hover:brightness-110 text-white">View</a>
                          )}
                          {thesis?._id && (
                            <a href={`http://localhost:3000/api/upload/${thesis._id}/download`} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-sm rounded bg-gray-100 hover:bg-gray-200 text-gray-900">Download</a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "insights" && (
                    <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-3">
                      <div className="text-sm text-gray-500">Insights</div>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li><span className="text-gray-500">Upvotes:</span> {thesis?.upvotes || 0}</li>
                        <li><span className="text-gray-500">Downvotes:</span> {thesis?.downvotes || 0}</li>
                        <li><span className="text-gray-500">Score:</span> {score}</li>
                        <li><span className="text-gray-500">Uploaded by:</span> {thesis?.uploadedBy?.name || thesis?.uploadedBy?.email || "Unknown"}</li>
                        <li><span className="text-gray-500">Created:</span> {thesis?.createdAt ? new Date(thesis.createdAt).toLocaleString() : "—"}</li>
                        <li><span className="text-gray-500">Format:</span> {thesis?.format || thesis?.resourceType || "—"}</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Right: sidebar cards like GitHub repo insights */}
                <div className="space-y-4">
                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="text-sm text-gray-500 mb-2">Voting</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => vote("up")}
                        className={`px-3 py-1.5 text-sm rounded ${hasUpvoted ? "bg-primary" : "bg-primary hover:brightness-110"} text-white`}
                      >
                        ▲ Upvote
                      </button>
                      <span className="text-gray-700 text-sm">{thesis?.upvotes || 0}</span>
                      <button
                        onClick={() => vote("down")}
                        className={`px-3 py-1.5 text-sm rounded ${hasDownvoted ? "bg-gray-100" : "bg-gray-100 hover:bg-gray-200"} text-gray-900`}
                      >
                        ▼ Downvote
                      </button>
                      <span className="text-gray-500 text-sm">{thesis?.downvotes || 0}</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">Score: {score}</div>
                  </div>

                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="text-sm text-gray-500 mb-2">About</div>
                    <div className="text-sm text-gray-700">Uploaded by: {thesis?.uploadedBy?.name || thesis?.uploadedBy?.email || "Unknown"}</div>
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
