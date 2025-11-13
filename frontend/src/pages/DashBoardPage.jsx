import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { formatDate } from "../utils/date.js";

const DashBoardPage = () => {
  const { user, logout, uploadFile } = useAuthStore();
  const [file, setFile] = useState(null);
  const [uploadedURL, setUploadedURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);

  // Metadata states
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");

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

  useEffect(() => {
    fetchFiles();
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
      };

      const data = await uploadFile(file, metadata);
      setUploadedURL(data.file.url);
      setLoading(false);
      fetchFiles();

      // Reset form
      setFile(null);
      setTitle("");
      setAuthor("");
      setCourse("");
      setYear("");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Check your backend connection.");
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl w-full mx-auto mt-10 p-8 bg-gray-900 bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl border border-gray-800"
    >
      <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-emerald-600 text-transparent bg-clip-text">
        Dashboard
      </h2>

      <div className="space-y-6">
        {/* Profile Info */}
        <motion.div
          className="p-4 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-semibold text-green-400 mb-3">
            Profile Information
          </h3>
          <p className="text-gray-300">Name: {user.name}</p>
          <p className="text-gray-300">Email: {user.email}</p>
        </motion.div>

        {/* Account Activity */}
        <motion.div
          className="p-4 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xl font-semibold text-green-400 mb-3">
            Account Activity
          </h3>
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

        {/* File Upload */}
        <motion.div
          className="p-4 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-xl font-semibold text-green-400 mb-3">
            File Upload
          </h3>
          <form onSubmit={handleUpload} className="flex flex-col space-y-3">
            {/* Metadata Inputs */}
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-2 rounded bg-gray-700 text-gray-200 border border-gray-600"
              required
            />
            <input
              type="text"
              placeholder="Author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="p-2 rounded bg-gray-700 text-gray-200 border border-gray-600"
              required
            />
            <input
              type="text"
              placeholder="Course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="p-2 rounded bg-gray-700 text-gray-200 border border-gray-600"
              required
            />
            <input
              type="number"
              placeholder="Year Published"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="p-2 rounded bg-gray-700 text-gray-200 border border-gray-600"
              required
            />

            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="text-gray-300"
              required
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={loading}
              className={`py-2 px-4 rounded-lg font-semibold text-white transition-all ${
                loading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              }`}
            >
              {loading ? "Uploading..." : "Upload File"}
            </motion.button>
          </form>

          {uploadedURL && (
            <div className="mt-4 text-center">
              <p className="text-green-400 font-medium mb-2">
                ✅ Uploaded Successfully!
              </p>
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

        {/* Files Grid */}
        <motion.div
          className="p-4 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="text-xl font-semibold text-green-400 mb-4">
            Uploaded Files
          </h3>
          {files.map((f, i) => (
            <div
              key={i}
              className="mb-2 p-4 bg-gray-700 bg-opacity-60 rounded-lg shadow-md hover:shadow-green-500/20 transition-shadow"
            >
              <p className="text-gray-200 font-semibold">{f.title}</p>
              <p className="text-gray-400 text-sm">Author: {f.author}</p>
              <p className="text-gray-400 text-sm">Course: {f.course}</p>
              <p className="text-gray-400 text-sm">Year: {f.yearPublished}</p>
              <p className="text-gray-400 text-sm mt-2 truncate">
                Filename: {f.filename}
              </p>
              <p className="text-gray-400 text-sm">
                Uploaded by: {f.uploadedBy?.name || "Unknown"}
              </p>
              <p className="text-gray-500 text-xs mb-2">
                {f.uploadedBy?.email}
              </p>
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 underline text-sm"
              >
                View / Download
              </a>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mt-4"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white 
            font-bold rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-700
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Logout
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default DashBoardPage;
