import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiBarChart,
  FiUserPlus,
  FiUpload,
  FiUsers,
  FiFileText,
  FiBookmark,
  FiBookOpen,
  FiClipboard, // Added for Reports page
  FiLogOut,
} from "react-icons/fi";
import { HiChevronDoubleLeft } from "react-icons/hi";

const menuItems = [
  { name: "Dashboard", path: "/admin/admin-dashboard", icon: FiBarChart },
  { name: "Create User", path: "/admin/create-user", icon: FiUserPlus },
  { name: "Upload Paper", path: "/admin/pdf-upload", icon: FiUpload },
  { name: "Show Users", path: "/admin/show-users", icon: FiUsers },
  { name: "Question Papers", path: "/admin/list-pdf", icon: FiFileText },
  { name: "Create Course", path: "/admin/create-courses", icon: FiBookmark },
  { name: "View Courses", path: "/admin/view-courses", icon: FiBookOpen },
  { name: "Reports", path: "/admin/reports", icon: FiClipboard },
];

const NavItem = ({ item, isOpen }) => {
  const baseClasses = "flex items-center py-3 rounded-lg transition-all duration-200";
  const inactiveClasses = "text-gray-400 hover:bg-slate-700 hover:text-white";
  // Use a neutral slate color for the admin's active state
  const activeClasses = "bg-slate-600 text-white font-semibold shadow-lg";

  return (
    <li>
      <NavLink
        to={item.path}
        end
        className={({ isActive }) =>
          `${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${
            isOpen ? "px-4 gap-4" : "px-2 justify-center"
          }`
        }
      >
        <item.icon className="h-6 w-6 shrink-0" />
        {isOpen && <span className="truncate">{item.name}</span>}
      </NavLink>
    </li>
  );
};

export default function AdminSidebar({ isOpen, setIsOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside
      className={`flex flex-col bg-slate-800 text-white h-screen sticky top-0 transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      }`}>
      {/* Header with Toggle */}
      <div
        className={`flex items-center h-20 border-b border-slate-700 ${
          isOpen ? "justify-between px-4" : "justify-center"
        }`}>
        {isOpen && (
          <NavLink to="/admin/admin-dashboard">
            <h1 className="text-2xl font-bold text-white font-poppins">Admin</h1>
          </NavLink>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-slate-700 transition-colors">
          <HiChevronDoubleLeft
            className={`h-6 w-6 transition-transform duration-300 ${!isOpen && "rotate-180"}`}/>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <NavItem key={item.path} item={item} isOpen={isOpen} />
          ))}
        </ul>
      </nav>

      {/* User Profile & Logout */}
      <div className={`p-4 border-t border-slate-700 ${!isOpen && "flex justify-center"}`}>
        {isOpen ? (
          <div className="mb-4">
            <p className="text-sm font-semibold truncate">{user?.name || "Administrator"}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        ) : null}
        <button
          onClick={() => logout(navigate)}
          className={`w-full flex items-center justify-center gap-3 py-2.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-all duration-200 ${
            !isOpen && "w-auto px-2"
          }`}>
          <FiLogOut className="h-5 w-5 shrink-0" />
          {isOpen && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
