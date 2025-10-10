import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  HiOutlineViewGrid, 
  HiOutlineEye, 
  HiOutlineCheckCircle, 
  HiOutlineCollection, 
  HiOutlineLogout,
  HiOutlineChevronDoubleLeft
} from "react-icons/hi";

const menuItems = [
  { name: "Dashboard", path: "/checker/dashboard", icon: HiOutlineViewGrid },
  { name: "Review Questions", path: "/checker/review", icon: HiOutlineEye },
  { name: "Accepted Questions", path: "/checker/accepted", icon: HiOutlineCheckCircle },
  { name: "Question Papers", path: "/checker/claimed-pdfs", icon: HiOutlineCollection },
];

const NavItem = ({ item, isOpen }) => {
  const baseClasses = "flex items-center py-3 rounded-lg transition-all duration-200";
  const inactiveClasses = "text-gray-400 hover:bg-slate-700 hover:text-white";
  // Use green for the active classes to match the Checker theme
  const activeClasses = "bg-green-600 text-white font-semibold shadow-lg";

  return (
    <li>
      <NavLink
        to={item.path}
        end
        className={({ isActive }) => 
          `${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${isOpen ? 'px-4 gap-4' : 'px-2 justify-center'}`
        }
      >
        <item.icon className="h-6 w-6 shrink-0" />
        {isOpen && <span className="truncate">{item.name}</span>}
      </NavLink>
    </li>
  );
};

export default function CheckerSidebar({ isOpen, setIsOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className={`flex flex-col bg-slate-800 text-white h-screen sticky top-0 transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
      {/* Header with Toggle */}
      <div className={`flex items-center h-20 border-b border-slate-700 ${isOpen ? 'justify-between px-4' : 'justify-center'}`}>
        {isOpen && (
          <NavLink to="/checker/dashboard">
            <h1 className="text-2xl font-bold text-white font-poppins">MCQ Portal</h1>
          </NavLink>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <HiOutlineChevronDoubleLeft className={`h-6 w-6 transition-transform duration-300 ${!isOpen && 'rotate-180'}`} />
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
      <div className={`p-4 border-t border-slate-700 ${!isOpen && 'flex justify-center'}`}>
        {isOpen ? (
          <div className="mb-4">
            <p className="text-sm font-semibold truncate">{user?.name || "Checker"}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        ) : null}
        <button
          onClick={() => logout(navigate)}
          className={`w-full flex items-center justify-center gap-3 py-2.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-all duration-200 ${!isOpen && 'w-auto px-2'}`}
        >
          <HiOutlineLogout className="h-5 w-5 shrink-0" />
          {isOpen && <span className="font-medium">Logout</span>}        </button>
      </div>
    </aside>
  );
}