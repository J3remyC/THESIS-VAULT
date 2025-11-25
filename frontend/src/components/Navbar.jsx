import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { Link, useNavigate, useLocation } from "react-router-dom";
import VerifiedBadge from "./VerifiedBadge";

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin-dashboard");

  useEffect(() => {
    // Pre-fill search from URL param q if present (when on /theses)
    const sp = new URLSearchParams(location.search);
    const q = sp.get("q") || "";
    setQuery(q);
  }, [location.search]);

  // Debounced suggestions fetch
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = query.trim();
      if (q.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch("http://localhost:3000/api/upload");
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const ql = q.toLowerCase();
        const filtered = list
          .filter((f) => {
            const title = (f.title || "").toLowerCase();
            const author = (f.author || "").toLowerCase();
            const course = (f.course || "").toLowerCase();
            const dept = (f.department || "").toLowerCase();
            const year = (f.yearPublished ? String(f.yearPublished) : "").toLowerCase();
            const desc = (f.description || "").toLowerCase();
            return (
              title.includes(ql) ||
              author.includes(ql) ||
              course.includes(ql) ||
              dept.includes(ql) ||
              year.includes(ql) ||
              desc.includes(ql)
            );
          })
          .slice(0, 6);
        setSuggestions(filtered);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <header className="w-full h-14 border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="h-full px-4 flex items-center gap-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-6 h-6 rounded bg-primary" />
          <span className="text-sm text-gray-900 font-semibold">THESIS VAULT</span>
        </div>
        {/* Center: Search */}
        {!isAdminRoute && (
        <div className="flex-1 hidden md:flex justify-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = query.trim();
              if (highlight >= 0 && suggestions[highlight]) {
                navigate(`/thesis/${suggestions[highlight]._id}`);
                setShowSuggestions(false);
                return;
              }
              navigate(q ? `/theses?q=${encodeURIComponent(q)}` : "/theses");
            }}
            className="w-full max-w-xl relative"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
                setHighlight(-1);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
              onKeyDown={(e) => {
                if (!showSuggestions || suggestions.length === 0) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlight((h) => (h + 1) % suggestions.length);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
                } else if (e.key === "Escape") {
                  setShowSuggestions(false);
                }
              }}
              placeholder="Search theses (title, author, course)"
              className="w-full h-9 px-3 rounded-full bg-white border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-md border border-gray-200 bg-white shadow-xl overflow-hidden">
                {suggestions.map((s, i) => (
                  <button
                    type="button"
                    key={s._id || i}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      navigate(`/thesis/${s._id}`);
                      setShowSuggestions(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm ${i === highlight ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    <div className="truncate text-gray-900">{s.title || "Untitled"}</div>
                    <div className="text-xs text-gray-500 truncate">{s.author || "Unknown"}{s.yearPublished ? ` • ${s.yearPublished}` : ""}{s.department ? ` • ${s.department}` : ""}</div>
                  </button>
                ))}
                <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200">Press Enter to search all results</div>
              </div>
            )}
          </form>
        </div>
        )}
        {/* Right: Account */}
        <div className="relative ml-auto">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-900 text-sm hover:bg-gray-50"
          >
            <span className="flex items-center gap-1 truncate max-w-[180px]">
              <span className="truncate max-w-[160px]">{user?.name || "Account"}</span>
              <VerifiedBadge isVerified={!!user?.isVerified} size="sm" />
            </span>
            <ChevronDown size={16} />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
              <div className="px-3 py-2 text-xs text-gray-500">Signed in as</div>
              <div className="px-3 pb-2 text-sm text-gray-900 truncate">{user?.email}</div>
              <div className="h-px bg-gray-200" />
              {!(user?.role === 'admin' || user?.role === 'superadmin') && (
                <Link to="/account" className="block px-3 py-2 text-sm text-gray-900 hover:bg-gray-50" onClick={()=>setOpen(false)}>
                  Account settings
                </Link>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full mx-4 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Confirm logout</h2>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to log out?</p>
            <div className="flex justify-end gap-2 text-sm">
              <button
                className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1.5 rounded-md bg-primary text-white hover:brightness-110"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
              >
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

