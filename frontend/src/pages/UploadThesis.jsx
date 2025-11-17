import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import UploadDropzone from "../components/UploadDropzone";
import { useAuthStore } from "../store/authStore";

const UploadThesis = () => {
  const { user, uploadFile } = useAuthStore();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedURL, setUploadedURL] = useState("");

  useEffect(() => {
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
        description,
        onProgress: (p) => setProgress(p),
      };
      const data = await uploadFile(file, metadata);
      setUploadedURL(data.file.url);
      setLoading(false);
      setProgress(0);
      setFile(null);
      setTitle("");
      setAuthor("");
      setCourse("");
      setYear("");
      setDepartment("");
      setDescription("");
    } catch (err) {
      setLoading(false);
      setProgress(0);
      alert("Upload failed. Please check your connection.");
    }
  };

  if (user?.role !== "student") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white text-gray-700">
        Uploading is available to students only.
      </div>
    );
  }

  return (
    <div className="fixed inset-0 text-gray-900 bg-white">
      <div className="relative z-10 flex flex-col h-full">
        <Navbar />
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <div className="flex-1 min-w-0 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6">
              <motion.div
                className="p-4 bg-white rounded-lg border border-gray-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Add Thesis Paper</h2>
                <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="p-2 rounded bg-white text-gray-900 border border-gray-300" placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} required />
                  <input className="p-2 rounded bg-white text-gray-900 border border-gray-300" placeholder="Author" value={author} onChange={(e)=>setAuthor(e.target.value)} required />
                  <input className="p-2 rounded bg-white text-gray-900 border border-gray-300" placeholder="Course" value={course} onChange={(e)=>setCourse(e.target.value)} required />
                  <input className="p-2 rounded bg-white text-gray-900 border border-gray-300" placeholder="Year Published" type="number" value={year} onChange={(e)=>setYear(e.target.value)} required />
                  <textarea className="p-2 rounded bg-white text-gray-900 border border-gray-300 md:col-span-2 min-h-[100px]" placeholder="Short description / abstract" value={description} onChange={(e)=>setDescription(e.target.value)} />
                  <select className="p-2 rounded bg-white text-gray-900 border border-gray-300 md:col-span-2" value={department} onChange={(e)=>setDepartment(e.target.value)} required>
                    <option value="" disabled>Select Course (by Code)</option>
                    {departments.map((d)=> (
                      <option key={d._id} value={d.code || d.name}>{(d.code?d.code:"").toUpperCase()} — {d.name}</option>
                    ))}
                  </select>
                  <div className="md:col-span-2">
                    <UploadDropzone onFileSelected={setFile} disabled={loading} />
                    {file && <div className="mt-2 text-sm text-gray-700">Selected: {file.name}</div>}
                  </div>
                  {loading && (
                    <div className="md:col-span-2">
                      <div className="w-full h-2 bg-gray-200 rounded">
                        <div className="h-2 bg-primary rounded" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{progress}%</div>
                    </div>
                  )}
                  <div className="md:col-span-2 flex justify-end">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading || !file} className={`px-4 py-2 rounded-md text-sm font-medium ${loading || !file ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-primary hover:brightness-110 text-white"}`}>
                      {loading ? "Uploading..." : "Upload File"}
                    </motion.button>
                  </div>
                </form>
                {uploadedURL && (
                  <div className="mt-4 text-sm">
                    <p className="text-primary font-medium mb-1">✅ Uploaded Successfully!</p>
                    <a href={uploadedURL} target="_blank" rel="noreferrer" className="text-primary underline hover:brightness-110">View File</a>
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

export default UploadThesis;
