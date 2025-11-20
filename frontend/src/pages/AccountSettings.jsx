import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

const AccountSettings = () => {
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    middleInitial: "",
    studentNumber: "",
    section: "",
    course: "",
    schoolYear: "",
  });
  const [noMiddleInitial, setNoMiddleInitial] = useState(false);

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
        const list = Array.isArray(data) ? data : [];
        setDepartments(list);
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
          studentNumber: approved.studentNumber || "",
          section: approved.section || "",
          schoolYear: approved.schoolYear || "",
          course: approved.course || "",
        }));
        setNoMiddleInitial(!(approved.middleInitial || "").trim());
      }
    } catch {}
  };

  useEffect(() => {
    loadMyApplications();
  }, []);

  const schoolYearValid = (s) => {
    const m = /^(\d{4})-(\d{4})$/.exec((s || "").trim());
    if (!m) return false;
    const y1 = parseInt(m[1], 10);
    const y2 = parseInt(m[2], 10);
    return y2 === y1 + 1;
  };

  const invalidSY = (form.schoolYear || "").length > 0 && !schoolYearValid(form.schoolYear);

  const onSubmit = async e => {
    e.preventDefault();
    if (approvedApp) {
      setMessage("Your application is already approved. Editing is locked.");
      return;
    }
    if (!schoolYearValid(form.schoolYear)) {
      setMessage("Please enter a valid school year in the format YYYY-YYYY.");
      return;
    }
    setMessage("");
    setSubmitting(true);

    try {
      // build a trimmed payload to avoid accidental whitespace-only values
      const payload = {
        lastName: (form.lastName || "").trim(),
        firstName: (form.firstName || "").trim(),
        middleInitial: noMiddleInitial ? "" : (form.middleInitial || "").trim(),
        studentNumber: (form.studentNumber || "").trim(),
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
        studentNumber: "",
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
    <div className="fixed inset-0 text-gray-900 bg-white">
      <div className="relative z-10 flex flex-col h-full">
        <Navbar />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div>
              <div className="mb-2">
                <button onClick={() => window.history.back()} className="text-sm text-gray-600 hover:text-gray-900">&larr; Back</button>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Account Settings</h2>
              <p className="text-sm text-gray-500">
                Fill out your student information for verification. Once approved by an admin, your role will be
                upgraded to student.
              </p>
            </div>

            {/* FORM */}
            <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">

              {/* NAME FIELDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Last Name</label>
                  <input
                    className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900"
                    required
                    disabled={locked}
                    value={form.lastName}
                    onChange={e => setForm({ ...form, lastName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">First Name</label>
                  <input
                    className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900"
                    required
                    disabled={locked}
                    value={form.firstName}
                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Middle Initial</label>
                  <div className="flex items-center gap-2">
                    <input
                      className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900"
                      maxLength={2}
                      disabled={locked || noMiddleInitial}
                      value={form.middleInitial}
                      onChange={e => setForm({ ...form, middleInitial: e.target.value })}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                    <input
                      id="no-mi"
                      type="checkbox"
                      className="h-4 w-4"
                      disabled={locked}
                      checked={noMiddleInitial}
                      onChange={e => {
                        const v = e.target.checked;
                        setNoMiddleInitial(v);
                        if (v) setForm(f => ({ ...f, middleInitial: "" }));
                      }}
                    />
                    <label htmlFor="no-mi">I don't have a middle name</label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Section</label>
                  <input
                    className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900"
                    required
                    disabled={locked}
                    value={form.section}
                    onChange={e => setForm({ ...form, section: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">School Year</label>
                  <input
                    placeholder="e.g. 2025-2026"
                    className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900"
                    required
                    disabled={locked}
                    value={form.schoolYear}
                    onChange={e => setForm({ ...form, schoolYear: e.target.value })}
                  />
                  {invalidSY && (
                    <div className="mt-1 text-xs text-red-600">Format must be YYYY-YYYY and the second year must be the next year.</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Student Number</label>
                <input
                  className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900"
                  required
                  disabled={locked}
                  value={form.studentNumber}
                  onChange={e => setForm({ ...form, studentNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Course</label>
                <select
                  className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900"
                  required
                  disabled={locked}
                  value={form.course}
                  onChange={e => setForm({ ...form, course: e.target.value })}
                >
                  <option value="">Select course</option>
                  {departments.map(d => (
                    <option key={d._id} value={(d.code || d._id)}>
                      {d.code ? (d.code.toUpperCase() + " — ") : ""}{d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  disabled={submitting || locked || invalidSY}
                  className={`px-4 py-2 rounded bg-primary hover:brightness-110 text-white ${
                    submitting || locked || invalidSY ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {locked ? "Approved" : (submitting ? "Submitting..." : "Submit for Review")}
                </button>

                {message && <span className="text-sm text-gray-600">{message}</span>}
              </div>
            </form>

            {/* APPLICATION STATUS */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold mb-3 text-gray-900">Application Status</h3>

              {myApps.length === 0 ? (
                <div className="text-sm text-gray-500">No applications yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-gray-500 border-b border-gray-200">
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
                        <tr key={a._id} className="border-b last:border-b-0 border-gray-200">
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
                                  ? "bg-emerald-100 text-emerald-700"
                                  : a.status === "pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
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
