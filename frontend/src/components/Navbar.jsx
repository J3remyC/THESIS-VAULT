import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAuthStore } from "../store/authStore";

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full h-14 border-b border-gray-800 bg-gray-900/70 backdrop-blur sticky top-0 z-40">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-emerald-500" />
          <span className="text-sm text-gray-200 font-semibold">THESIS VAULT</span>
        </div>
        <div className="relative">
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
              <a href="#/account" className="block px-3 py-2 text-sm text-gray-200 hover:bg-gray-700">
                Account settings
              </a>
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
