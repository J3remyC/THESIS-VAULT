import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuthStore } from "../store/authStore";
import { ArrowLeft, ExternalLink, Download as DownloadIcon, Home, Folder, BookOpen, Files as FilesIcon, BarChart3, Copy } from "lucide-react";
import { toast } from "react-hot-toast";

const ThesisDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [thesis, setThesis] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuthStore();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewType, setPreviewType] = useState("");
  const [previewOriginalUrl, setPreviewOriginalUrl] = useState("");
  const [chooserOpen, setChooserOpen] = useState(false);

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

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const openPreview = async () => {
    if (!thesis) return;
    setPreviewError("");
    setPreviewLoading(true);
    setPreviewOpen(true);
    try {
      // Prefer fetching via API with auth, then render as object URL
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/api/upload/${thesis._id}/download`, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const type = res.headers.get("Content-Type") || blob.type || "";
      const url = URL.createObjectURL(blob);
      if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      setPreviewType(type);
      setPreviewUrl(url);
      setPreviewOriginalUrl(thesis?.url || "");
    } catch (e) {
      const token = localStorage.getItem("token");
      // 2) Try server-side converted preview (PDF)
      try {
        const res2 = await fetch(`http://localhost:3000/api/upload/${thesis._id}/preview`, {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
          credentials: "include",
        });
        if (!res2.ok) throw new Error("preview failed");
        const blob2 = await res2.blob();
        const type2 = res2.headers.get("Content-Type") || blob2.type || "application/pdf";
        const url2 = URL.createObjectURL(blob2);
        if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        setPreviewType(type2);
        setPreviewUrl(url2);
        setPreviewOriginalUrl(thesis?.url || "");
        setPreviewError("");
        return;
      } catch {}

      // 3) Try signed public preview URL and embed Google viewer
      try {
        const res3 = await fetch(`http://localhost:3000/api/upload/${thesis._id}/signed-preview-url`, {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
          credentials: "include",
        });
        if (res3.ok) {
          const data = await res3.json();
          const signed = data?.url || "";
          if (signed) {
            const gview = `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(signed)}`;
            setPreviewType("text/html");
            setPreviewUrl(gview);
            setPreviewOriginalUrl(signed);
            setPreviewError("");
            return;
          }
        }
      } catch {}

      // 4) Fallback: use direct file URL if available
      if (thesis?.url) {
        const ext = (thesis.url.split(".").pop() || "").toLowerCase();
        const guessed = ext === 'pdf' ? 'application/pdf' : ext.match(/png|jpe?g|webp|gif/) ? `image/${ext==='jpg'?'jpeg':ext}` : '';
        setPreviewType(guessed);
        setPreviewUrl(thesis.url);
        setPreviewOriginalUrl(thesis.url);
        setPreviewError("");
      } else {
        setPreviewError("Failed to load preview. Try downloading instead.");
      }
    } finally {
      setPreviewLoading(false);
    }
  };

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
                <button onClick={() => navigate("/")} className="hover:text-gray-700 flex items-center gap-1">
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </button>
                <span>/</span>
                <button onClick={() => navigate("/theses")} className="hover:text-gray-700 flex items-center gap-1">
                  <Folder className="w-4 h-4" />
                  <span>Theses</span>
                </button>
                <span>/</span>
                <span className="text-gray-700 truncate max-w-[50ch]">{thesis?.title || "Thesis"}</span>
              </div>
            {previewOpen && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPreviewOpen(false)}>
                <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-5xl h-[80vh] flex flex-col" onClick={(e)=>e.stopPropagation()}>
                  <div className="flex items-center justify-between p-3 border-b border-gray-200 gap-2">
                    <div className="text-sm text-gray-700 truncate">Preview</div>
                    <div className="flex items-center gap-2">
                      {previewUrl && (
                        <a href={previewUrl} target="_blank" rel="noreferrer" className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs text-gray-900">Open in new tab</a>
                      )}
                      {previewOriginalUrl && (
                        <>
                          <a href={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewOriginalUrl)}`} target="_blank" rel="noreferrer" className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs text-gray-900">Office Viewer</a>
                          <a href={`https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(previewOriginalUrl)}`} target="_blank" rel="noreferrer" className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs text-gray-900">Google Viewer</a>
                        </>
                      )}
                      <button onClick={() => setPreviewOpen(false)} className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-sm text-gray-900">Close</button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    {previewLoading ? (
                      <div className="w-full h-full flex items-center justify-center text-sm text-gray-600">Loading preview...</div>
                    ) : previewError ? (
                      <div className="p-4 text-sm text-red-600">{previewError}</div>
                    ) : (
                      previewType.startsWith("image/") ? (
                        <img alt="Preview" src={previewUrl} className="w-full h-full object-contain" />
                      ) : previewType === "application/pdf" || previewType.includes("pdf") ? (
                        <iframe title="Thesis preview" src={previewUrl} className="w-full h-full" />
                      ) : previewType.startsWith("video/") ? (
                        <video controls className="w-full h-full"><source src={previewUrl} type={previewType} /></video>
                      ) : previewType.startsWith("audio/") ? (
                        <audio controls className="w-full"><source src={previewUrl} type={previewType} /></audio>
                      ) : (
                        <div className="p-4 text-sm text-gray-700">
                          <div>This file type cannot be previewed. You can download it instead.</div>
                          <a href={previewUrl} download className="mt-3 inline-block px-3 py-2 rounded bg-primary hover:brightness-110 text-white">Download file</a>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {chooserOpen && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setChooserOpen(false)}>
                <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md p-5" onClick={(e)=>e.stopPropagation()}>
                  <div className="text-lg font-semibold mb-2 text-gray-900">Choose a viewer</div>
                  <div className="text-sm text-gray-600 mb-4">How would you like to view this thesis?</div>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={async () => {
                        setChooserOpen(false);
                        const token = localStorage.getItem("token");
                        let url = thesis?.url || "";
                        try {
                          const res = await fetch(`http://localhost:3000/api/upload/${thesis?._id}/signed-preview-url`, {
                            headers: { Authorization: token ? `Bearer ${token}` : undefined },
                            credentials: 'include'
                          });
                          if (res.ok) {
                            const data = await res.json();
                            if (data?.url) url = data.url;
                          }
                        } catch {}
                        if (url) {
                          const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
                          window.open(officeUrl, '_blank', 'noopener');
                        }
                      }}
                      className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm text-gray-900"
                    >
                      Microsoft Office Viewer (docx, pptx, xlsx)
                    </button>
                    <button
                      onClick={async () => {
                        setChooserOpen(false);
                        const token = localStorage.getItem("token");
                        let url = thesis?.url || "";
                        try {
                          const res = await fetch(`http://localhost:3000/api/upload/${thesis?._id}/signed-preview-url`, {
                            headers: { Authorization: token ? `Bearer ${token}` : undefined },
                            credentials: 'include'
                          });
                          if (res.ok) {
                            const data = await res.json();
                            if (data?.url) url = data.url;
                          }
                        } catch {}
                        if (url) {
                          const gview = `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
                          window.open(gview, '_blank', 'noopener');
                        }
                      }}
                      className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm text-gray-900"
                    >
                      Google Viewer (Office/PDF)
                    </button>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button onClick={() => setChooserOpen(false)} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm text-gray-900">Close</button>
                  </div>
                </div>
              </div>
            )}

              {/* Repo-like header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold truncate">{thesis?.title || "Thesis"}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(-1)}
                    aria-label="Back"
                    title="Back"
                    className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-900"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/thesis/${thesis?._id || id}`;
                      navigator.clipboard.writeText(url).then(() => toast.success("Link copied"));
                    }}
                    aria-label="Copy link"
                    title="Copy link"
                    className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-900"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {thesis?._id && (
                    <button
                      onClick={() => setChooserOpen(true)}
                      aria-label="View"
                      title="View"
                      className="p-2 rounded bg-primary hover:brightness-110 text-white"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                  {thesis?._id && (
                    <a
                      href={`http://localhost:3000/api/upload/${thesis._id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Download"
                      title="Download"
                      className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-900"
                    >
                      <DownloadIcon className="w-4 h-4" />
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
                  className={`py-2 flex items-center gap-1 ${activeTab === "overview" ? "border-b-2 border-primary text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Overview</span>
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === "files"}
                  onClick={() => setActiveTab("files")}
                  className={`py-2 flex items-center gap-1 ${activeTab === "files" ? "border-b-2 border-primary text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <FilesIcon className="w-4 h-4" />
                  <span>Files</span>
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === "insights"}
                  onClick={() => setActiveTab("insights")}
                  className={`py-2 flex items-center gap-1 ${activeTab === "insights" ? "border-b-2 border-primary text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Insights</span>
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
                          {thesis?._id && (
                            <button onClick={() => setChooserOpen(true)} aria-label="View" title="View" className="p-2 rounded bg-primary hover:brightness-110 text-white">
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                          {thesis?._id && (
                            <a href={`http://localhost:3000/api/upload/${thesis._id}/download`} target="_blank" rel="noreferrer" aria-label="Download" title="Download" className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-900">
                              <DownloadIcon className="w-4 h-4" />
                            </a>
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
