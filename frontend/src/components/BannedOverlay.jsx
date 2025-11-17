import React from "react";
import { useAuthStore } from "../store/authStore";

const BannedOverlay = () => {
  const { user, logout } = useAuthStore();
  if (!user?.isBanned) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 pointer-events-auto" />
      <div className="relative z-10 w-full max-w-md mx-auto rounded-2xl border border-red-900 bg-gray-900 p-6 text-white shadow-2xl">
        <div className="text-xl font-semibold text-red-300">Account Banned</div>
        <p className="mt-2 text-sm text-gray-300">Your account has been banned by an administrator.</p>
        {user.banReason && (
          <div className="mt-3 text-sm">
            <div className="text-gray-400">Reason</div>
            <div className="mt-0.5 text-gray-200 bg-red-900/20 border border-red-900/40 rounded p-2">
              {user.banReason}
            </div>
          </div>
        )}
        {user.bannedAt && (
          <div className="mt-2 text-xs text-gray-400">Banned on: {new Date(user.bannedAt).toLocaleString()}</div>
        )}
        <p className="mt-1 text-xs text-gray-400">If you believe this is a mistake, contact support.</p>
        <div className="mt-5 flex justify-end">
          <button onClick={logout} className="px-4 py-2 rounded bg-red-700 hover:bg-red-600 text-sm">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default BannedOverlay;
