import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { formatDate } from "../utils/date.js";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import UploadDropzone from "../components/UploadDropzone";

const DashBoardPage = () => {
  const { user, logout, uploadFile } = useAuthStore();
  const [file, setFile] = useState(null);
  const [uploadedURL, setUploadedURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(0);

  // Metadata states
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [department, setDepartment] = useState(""); // holds department code
  const [departments, setDepartments] = useState([]);

  const handleLogout = () => logout();

  // Fetch files from backend
  const fetchFiles = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/upload");
      const data = await res.json();
      const validFiles = data.filter((f) => f.url);
      setFiles(validFiles);
    } catch (error) {
      console.error("Failed to fetch files:", error);
    }
  };

  // Fetch own uploads (any status)
  const [myFiles, setMyFiles] = useState([]);
  const fetchMyFiles = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/upload/mine", {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
        credentials: "include",
      });
      const data = await res.json();
      setMyFiles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch my files", e);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchMyFiles();
    // load departments for dropdown
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/api/catalog/departments", {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
          credentials: "include",
        });
        const data = await res.json();
        setDepartments(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load departments", e);
      }
    })();
  }, []);

  // Handle file upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please choose a file first.");

    setLoading(true);
    try {
      const metadata = {
        title,
        author,
        course,
        yearPublished: year,
        department,
        onProgress: (p) => setProgress(p),
      };

      const data = await uploadFile(file, metadata);
      setUploadedURL(data.file.url);
      setLoading(false);
      setProgress(0);
      fetchFiles();
      fetchMyFiles();

      // Reset form
      setFile(null);
      setTitle("");
      setAuthor("");
      setCourse("");
      setYear("");
      setDepartment("");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Check your backend connection.");
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-950 text-white">
      <Navbar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 min-w-0 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-6xl mx-auto p-6 space-y-6"
          >
            <h2 className="text-2xl font-semibold">Dashboard</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                {/* Profile Info */}
                <motion.div
                  className="p-4 bg-gray-900/60 rounded-lg border border-gray-800"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-lg font-semibold mb-3">Profile Information</h3>
                  <p className="text-gray-300">Name: {user.name}</p>
                  <p className="text-gray-300">Email: {user.email}</p>
                </motion.div>

            {/* My Uploads (includes pending) */}
            <motion.div
              className="p-4 bg-gray-900/60 rounded-lg border border-gray-800"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
            >
              <h3 className="text-lg font-semibold mb-3">My Uploads</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-gray-400 border-b border-gray-800">
                    <tr>
                      <th className="py-2 pr-4">Title</th>
                      <th className="py-2 pr-4">Department</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myFiles.map((f) => (
                      <tr key={f._id} className="border-b border-gray-900/60 hover:bg-gray-900/40">
                        <td className="py-2 pr-4">
                          <div className="font-medium text-gray-200">{f.title}</div>
                          <div className="text-xs text-gray-400 truncate">{f.filename}</div>
                        </td>
                        <td className="py-2 pr-4 text-gray-300">{f.department || "—"}</td>
                        <td className="py-2 pr-4">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            f.status === 'approved' ? 'bg-emerald-600/30 text-emerald-300' :
                            f.status === 'rejected' ? 'bg-red-600/30 text-red-300' :
                            'bg-yellow-600/30 text-yellow-300'
                          }`}>
                            {f.status}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          {f.url && (
                            <a href={f.url} target="_blank" rel="noreferrer" className="text-emerald-400 underline hover:text-emerald-300">View</a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

                {/* Account Activity */}
                <motion.div
                  className="p-4 bg-gray-900/60 rounded-lg border border-gray-800"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-lg font-semibold mb-3">Account Activity</h3>
                  <p className="text-gray-300">
                    <span className="font-bold">Joined: </span>
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-bold">Last Login: </span>
                    {formatDate(user.lastLogin)}
                  </p>
                </motion.div>
              </div>

              <div className="lg:col-span-2">
                {/* File Upload */}
                <motion.div
                  className="p-4 bg-gray-900/60 rounded-lg border border-gray-800"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-lg font-semibold mb-3">File Upload</h3>
                  <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Metadata Inputs */}
                    <input
                      type="text"
                      placeholder="Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="p-2 rounded bg-gray-800 text-gray-200 border border-gray-700"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Author"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="p-2 rounded bg-gray-800 text-gray-200 border border-gray-700"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Course"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="p-2 rounded bg-gray-800 text-gray-200 border border-gray-700"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Year Published"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="p-2 rounded bg-gray-800 text-gray-200 border border-gray-700"
                      required
                    />
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="p-2 rounded bg-gray-800 text-gray-200 border border-gray-700"
                      required
                    >
                      <option value="" disabled>
                        Select Course (by Code)
                      </option>
                      {departments.map((d) => (
                        <option key={d._id} value={d.code || d.name}>
                          {(d.code ? d.code : "").toUpperCase()} — {d.name}
                        </option>
                      ))}
                    </select>

                    <div className="md:col-span-2">
                      <UploadDropzone onFileSelected={setFile} disabled={loading} />
                      {file && (
                        <div className="mt-2 text-sm text-gray-300">Selected: {file.name}</div>
                      )}
                    </div>

                    {loading && (
                      <div className="md:col-span-2">
                        <div className="w-full h-2 bg-gray-800 rounded">
                          <div
                            className="h-2 bg-emerald-500 rounded"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{progress}%</div>
                      </div>
                    )}

                    <div className="md:col-span-2 flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading || !file}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          loading || !file
                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                      >
                        {loading ? "Uploading..." : "Upload File"}
                      </motion.button>
                    </div>
                  </form>

                  {uploadedURL && (
                    <div className="mt-4 text-sm">
                      <p className="text-emerald-400 font-medium mb-1">✅ Uploaded Successfully!</p>
                      <a
                        href={uploadedURL}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 underline hover:text-emerald-300"
                      >
                        View File
                      </a>
                    </div>
                  )}
                </motion.div>
              </div>
              </div>

            {/* Files Grid */}
            <motion.div
              className="p-4 bg-gray-900/60 rounded-lg border border-gray-800"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h3 className="text-lg font-semibold mb-3">Uploaded Files</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-gray-400 border-b border-gray-800">
                    <tr>
                      <th className="py-2 pr-4">Title</th>
                      <th className="py-2 pr-4">Metadata</th>
                      <th className="py-2 pr-4">Uploader</th>
                      <th className="py-2 pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((f, i) => (
                      <tr key={i} className="border-b border-gray-900/60 hover:bg-gray-900/40">
                        <td className="py-2 pr-4">
                          <div className="font-medium text-gray-200">{f.title}</div>
                          <div className="text-xs text-gray-400 truncate">{f.filename}</div>
                        </td>
                        <td className="py-2 pr-4 text-gray-300">
                          <div>Author: {f.author}</div>
                          <div>Course: {f.course}</div>
                          <div>Year: {f.yearPublished}</div>
                        </td>
                        <td className="py-2 pr-4 text-gray-300">
                          <div>{f.uploadedBy?.name || "Unknown"}</div>
                          <div className="text-xs text-gray-500">{f.uploadedBy?.email}</div>
                        </td>
                        <td className="py-2 pr-4">
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 underline"
                          >
                            View / Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Logout */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="pt-2"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-md text-sm font-medium"
              >
                Logout
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DashBoardPage;
