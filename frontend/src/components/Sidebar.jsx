import React from "react";
import { Link } from "react-router-dom";
import { Folder, Upload, Home } from "lucide-react";

const NavItem = ({ icon: Icon, label, to = "#" }) => (
  <Link
    to={to}
    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
  >
    <Icon size={16} />
    <span>{label}</span>
  </Link>
);

const Sidebar = () => {
  return (
    <aside className="w-64 shrink-0 border-r border-gray-800 bg-gray-900/50 backdrop-blur hidden md:flex md:flex-col">
      <div className="px-3 py-3 text-xs uppercase tracking-wide text-gray-400">Dashboard</div>
      <nav className="px-2 space-y-1">
        <NavItem icon={Home} label="Overview" to="/" />
        <NavItem icon={Home} label="Profile" to="/profile" />
        <NavItem icon={Upload} label="Uploads" to="/upload" />
        <NavItem icon={Folder} label="Repositories" to="/theses" />
      </nav>
      <div className="px-3 py-3 text-xs uppercase tracking-wide text-gray-400">Thesis</div>
      <nav className="px-2 space-y-1">
        <NavItem icon={Folder} label="All Theses" to="/theses" />
        <NavItem icon={Folder} label="Other Departments" to="/theses?tab=other" />
      </nav>
    </aside>
  );
};

export default Sidebar;
