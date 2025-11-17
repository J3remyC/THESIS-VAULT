import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import FloatingShape from "../components/FloatingShape";

const AccountSettings = () => {
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    middleInitial: "",
    section: "",
    course: "",
    schoolYear: "",
  });

  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [myApps, setMyApps] = useState([]);
  const [approvedApp, setApprovedApp] = useState(null);

  const headers = () => {
    const t = localStorage.getItem("token");
    return {
      Authorization: t ? `Bearer ${t}` : undefined,
      "Content-Type": "application/json",
    };
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3000/api/catalog/departments", {
          headers: headers(),
          credentials: "include",
        });
        const data = await res.json();
        setDepartments(Array.isArray(data) ? data : []);
      } catch {}
    })();
  }, []);

  const loadMyApplications = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/applications/mine", {
        headers: headers(),
        credentials: "include",
      });
      const data = await res.json();
      setMyApps(Array.isArray(data) ? data : []);

      // Prefill fields from latest approved application, if any, and lock form
      const approved = (Array.isArray(data) ? data : []).find(a => a.status === 'approved');
      setApprovedApp(approved || null);
      if (approved) {
        setForm(f => ({
          ...f,
          lastName: approved.lastName || "",
          firstName: approved.firstName || "",
          middleInitial: approved.middleInitial || "",
          section: approved.section || "",
          schoolYear: approved.schoolYear || "",
          course: approved.course || "",
        }));
      }
    } catch {}
  };

  useEffect(() => {
    loadMyApplications();
  }, []);

  const onSubmit = async e => {
    e.preventDefault();
    if (approvedApp) {
      setMessage("Your application is already approved. Editing is locked.");
      return;
    }
    setMessage("");
    setSubmitting(true);

    try {
      // build a trimmed payload to avoid accidental whitespace-only values
      const payload = {
        lastName: (form.lastName || "").trim(),
        firstName: (form.firstName || "").trim(),
        middleInitial: (form.middleInitial || "").trim(),
        section: (form.section || "").trim(),
        course: (form.course || "").trim(),
        schoolYear: (form.schoolYear || "").trim(),
      };

      const res = await fetch("http://localhost:3000/api/applications", {
        method: "POST",
        headers: headers(),
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed" }));
        throw new Error(err.message || "Failed to submit");
      }

      setForm({
        lastName: "",
        firstName: "",
        middleInitial: "",
        section: "",
        course: "",
        schoolYear: "",
      });

      setMessage("Application submitted. You'll be notified after review.");
      await loadMyApplications();
    } catch (e2) {
      setMessage(e2.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const locked = !!approvedApp;

  return (
    <div className="fixed inset-0 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900" />

      <FloatingShape color="bg-green-500" size="w-64 h-64" top="-5%" left="10%" delay={0} />
      <FloatingShape color="bg-emerald-500" size="w-48 h-48" top="70%" left="80%" delay={5} />
      <FloatingShape color="bg-lime-500" size="w-32 h-32" top="40%" left="10%" delay={2} />

      <div className="relative z-10 flex flex-col h-full">
        <Navbar />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Account Settings</h2>
              <p className="text-sm text-gray-300">
                Fill out your student information for verification. Once approved by an admin, your role will be
                upgraded to student.
              </p>
            </div>

            {/* FORM */}
            <form onSubmit={onSubmit} className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 space-y-4">

              {/* NAME FIELDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Last Name</label>
                  <input
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                    required
                    disabled={locked}
                    value={form.lastName}
                    onChange={e => setForm({ ...form, lastName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">First Name</label>
                  <input
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                    required
                    disabled={locked}
                    value={form.firstName}
                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Middle Initial</label>
                  <input
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                    maxLength={1}
                    disabled={locked}
                    value={form.middleInitial}
                    onChange={e => setForm({ ...form, middleInitial: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Section</label>
                  <input
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                    required
                    disabled={locked}
                    value={form.section}
                    onChange={e => setForm({ ...form, section: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">School Year</label>
                  <input
                    placeholder="e.g. 2025-2026"
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                    required
                    disabled={locked}
                    value={form.schoolYear}
                    onChange={e => setForm({ ...form, schoolYear: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Course</label>
                <select
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                  required
                  disabled={locked}
                  value={form.course}
                  onChange={e => setForm({ ...form, course: e.target.value })}
                >
                  <option value="">Select course</option>
                  {departments.filter(d => d.code && d.code.trim().length > 0).map(d => (
                    <option key={d._id} value={d.code}>
                      {(d.code ? d.code : "").toUpperCase()} — {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  disabled={submitting || locked}
                  className={`px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 ${
                    submitting || locked ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {locked ? "Approved" : (submitting ? "Submitting..." : "Submit for Review")}
                </button>

                {message && <span className="text-sm text-gray-300">{message}</span>}
              </div>
            </form>

            {/* APPLICATION STATUS */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold mb-3">Application Status</h3>

              {myApps.length === 0 ? (
                <div className="text-sm text-gray-400">No applications yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-gray-400 border-b border-gray-800">
                      <tr>
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4">Course</th>
                        <th className="py-2 pr-4">Section</th>
                        <th className="py-2 pr-4">School Year</th>
                        <th className="py-2 pr-4">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {myApps.map(a => (
                        <tr key={a._id} className="border-b border-gray-900/60">
                          <td className="py-2 pr-4">
                            {a.lastName}, {a.firstName} {a.middleInitial && a.middleInitial + "."}
                          </td>
                          <td className="py-2 pr-4">{a.course}</td>
                          <td className="py-2 pr-4">{a.section}</td>
                          <td className="py-2 pr-4">{a.schoolYear}</td>
                          <td className="py-2 pr-4">
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                a.status === "approved"
                                  ? "bg-emerald-700/30 text-emerald-300"
                                  : a.status === "pending"
                                  ? "bg-yellow-700/30 text-yellow-300"
                                  : "bg-red-700/30 text-red-300"
                              }`}
                            >
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default AccountSettings;
