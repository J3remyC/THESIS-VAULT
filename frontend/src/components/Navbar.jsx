import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
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
          .filter((f) =>
            (f.title || "").toLowerCase().includes(ql) ||
            (f.author || "").toLowerCase().includes(ql) ||
            (f.course || "").toLowerCase().includes(ql)
          )
          .slice(0, 6);
        setSuggestions(filtered);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <header className="w-full h-14 border-b border-gray-800 bg-gray-900/70 backdrop-blur sticky top-0 z-40">
      <div className="h-full px-4 flex items-center gap-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-6 h-6 rounded bg-emerald-500" />
          <span className="text-sm text-gray-200 font-semibold">THESIS VAULT</span>
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
              className="w-full h-9 px-3 rounded-full bg-gray-800/80 border border-gray-700 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-md border border-gray-700 bg-gray-900/95 backdrop-blur shadow-xl overflow-hidden">
                {suggestions.map((s, i) => (
                  <button
                    type="button"
                    key={s._id || i}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      navigate(`/thesis/${s._id}`);
                      setShowSuggestions(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm ${i === highlight ? "bg-gray-800 text-gray-100" : "text-gray-300 hover:bg-gray-800"}`}
                  >
                    <div className="truncate text-gray-200">{s.title || "Untitled"}</div>
                    <div className="text-xs text-gray-500 truncate">{s.author || "Unknown"}{s.yearPublished ? ` • ${s.yearPublished}` : ""}{s.department ? ` • ${s.department}` : ""}</div>
                  </button>
                ))}
                <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-800">Press Enter to search all results</div>
              </div>
            )}
          </form>
        </div>
        )}
        {/* Right: Account */}
        <div className="relative ml-auto">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-700 bg-gray-800 text-gray-200 text-sm hover:bg-gray-700"
          >
            <span className="truncate max-w-[160px]">{user?.name || "Account"}</span>
            <ChevronDown size={16} />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-700 bg-gray-800 shadow-lg">
              <div className="px-3 py-2 text-xs text-gray-400">Signed in as</div>
              <div className="px-3 pb-2 text-sm text-gray-200 truncate">{user?.email}</div>
              <div className="h-px bg-gray-700" />
              <Link to="/account" className="block px-3 py-2 text-sm text-gray-200 hover:bg-gray-700" onClick={()=>setOpen(false)}>
                Account settings
              </Link>
              <button
                onClick={logout}
                className="w-full text-left px-3 py-2 text-sm text-red-300 hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

