import React from "react";
import { NavLink } from "react-router-dom";

const Section = ({ title, children }) => (
  <div className="mt-4">
    <div className="px-3 py-2 text-xs uppercase tracking-wide text-gray-400">{title}</div>
    <div className="flex flex-col px-2 space-y-1">{children}</div>
  </div>
);

const Item = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `px-3 py-2 rounded-md text-sm ${isActive ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"}`
    }
    end
  >
    {label}
  </NavLink>
);

const AdminSidebar = ({ user }) => {
  return (
    <aside className="w-72 shrink-0 border-r border-gray-800 bg-gray-900/50 backdrop-blur hidden md:flex md:flex-col py-3">
      <Section title="Dashboard">
        <Item to="/admin-dashboard" label="Overview" />
      </Section>
      <Section title="User Management">
        <Item to="/admin-dashboard/users" label="View All Users" />
        <Item to="/admin-dashboard/users/new" label="Add New User" />
        {user?.role === "superadmin" && (
          <Item to="/admin-dashboard/manage-roles" label="Manage Roles" />
        )}
      </Section>
      <Section title="Thesis Management">
        <Item to="/admin-dashboard/theses" label="All Submissions" />
        <Item to="/admin-dashboard/theses/pending" label="Pending Approval" />
      </Section>
      <Section title="System Settings">
        <Item to="/admin-dashboard/departments" label="Departments" />
        <Item to="/admin-dashboard/departments/theses" label="Department Theses" />
      </Section>
      <Section title="Activity">
        <Item to="/admin-dashboard/logs" label="Activity Logs" />
      </Section>
    </aside>
  );
};

export default AdminSidebar;
