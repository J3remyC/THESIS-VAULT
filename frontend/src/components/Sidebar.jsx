import React from "react";
import { Link } from "react-router-dom";
import { Folder, Upload, User, LayoutDashboard, BookOpen } from "lucide-react";

const NavItem = ({ icon: Icon, label, to = "#" }) => (
  <Link
    to={to}
    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
  >
    <Icon size={16} />
    <span>{label}</span>
  </Link>
);

const Sidebar = () => {
  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-white hidden md:flex md:flex-col">
      <div className="p-3">
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Dashboard</div>
        <div className="rounded-lg border border-gray-200 bg-white">
          <nav className="p-2 space-y-1">
            <NavItem icon={LayoutDashboard} label="Overview" to="/" />
            <NavItem icon={User} label="Profile" to="/profile" />
            <NavItem icon={Upload} label="Uploads" to="/upload" />
          </nav>
        </div>
      </div>
      <div className="p-3 pt-0">
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Thesis</div>
        <div className="rounded-lg border border-gray-200 bg-white">
          <nav className="p-2 space-y-1">
            <NavItem icon={BookOpen} label="All Theses" to="/theses" />
            <NavItem icon={Folder} label="My repositories" to="/my-repositories" />
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
