import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import MyUploads from "../components/dashboard/MyUploads";

const MyRepositories = () => {
  const [myFiles, setMyFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyFiles = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/upload/mine", {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
        credentials: "include",
      });
      const data = await res.json();
      setMyFiles(Array.isArray(data) ? data : []);
    } catch {
      setMyFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyFiles();
  }, []);

  return (
    <div className="fixed inset-0 text-gray-900 bg-white overflow-hidden">
      <div className="relative z-10 flex flex-col h-full">
        <Navbar />
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-4">
                <h1 className="text-2xl font-semibold">My repositories</h1>
                <p className="text-sm text-gray-500">Manage and edit your uploaded theses.</p>
              </div>
              {loading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : (
                <MyUploads
                  title="My Repositories"
                  myFiles={myFiles}
                  onChanged={() => fetchMyFiles()}
                  hideHeader={true}
                  hideSearch={true}
                  disableInlineEdit={true}
                  useListLayout={true}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MyRepositories;
