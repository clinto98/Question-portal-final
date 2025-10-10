import React, { useEffect, useState } from "react";
import { host } from "../../utils/APIRoutes";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";

// --- Reusable Components ---

const StatusBadge = ({ isActive }) => (
  <span
    className={`px-3 py-1 text-xs font-medium rounded-full ${isActive
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800"
      }`}>
    {isActive ? "Active" : "Inactive"}
  </span>
);

const ActionButton = ({ isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${isActive
        ? "bg-red-500 text-white hover:bg-red-600"
        : "bg-green-500 text-white hover:bg-green-600"
      }`}>
    {isActive ? "Deactivate" : "Activate"}
  </button>
);

const UserTable = ({ users, role, onToggle }) => (
  <div className="overflow-x-auto bg-white rounded-lg shadow">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {users.map((user, idx) => (
          <tr key={user._id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{idx + 1}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
              <StatusBadge isActive={user.isActive} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
              <ActionButton
                isActive={user.isActive}
                onClick={() => onToggle(role.slice(0, -1), user._id, user.isActive)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ConfirmModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
        <h3 className="text-lg font-medium mb-4">Are you sure?</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 transition">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 transition">Confirm</button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---

function ShowAllUsersPage() {
  const [users, setUsers] = useState({ makers: [], checkers: [], experts: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, role: null, id: null, message: "" });
  const [activeTab, setActiveTab] = useState("makers");

  const TABS = ["makers", "checkers", "experts"];

  const fetchUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in as admin");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${host}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to fetch users");
      } else {
        setUsers({ makers: data.makers || [], checkers: data.checkers || [], experts: data.experts || [] });
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("An unexpected error occurred while fetching users.");
    } finally {
      setLoading(false);
    }
  };

  const openConfirmationModal = (role, id, isActive) => {
    const action = isActive ? "deactivate" : "activate";
    setModal({
      isOpen: true,
      role,
      id,
      message: `Do you want to ${action} this user?`,
    });
  };

  const handleToggleStatus = async () => {
    const { role, id } = modal;
    const token = localStorage.getItem("token");
    const toastId = toast.loading("Updating status...");

    try {
      const res = await fetch(`${host}/api/admin/user/${role}/${id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to toggle user status", { id: toastId });
      } else {
        toast.success(data.message, { id: toastId });
        fetchUsers(); // Refresh the list
      }
    } catch (err) {
      console.error("Error toggling user status:", err);
      toast.error("An unexpected error occurred.", { id: toastId });
    } finally {
      setModal({ isOpen: false, role: null, id: null, message: "" }); // Close modal
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <ConfirmModal 
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, role: null, id: null, message: "" })}
        onConfirm={handleToggleStatus}
        message={modal.message}
      />
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        
        {/* --- Tab Navigation -- */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-slate-500 text-slate-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}>
                <span className="capitalize">{tab}</span>
                <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                  {users[tab]?.length || 0}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="mt-8">
        {loading ? <Loader /> : (
          users[activeTab]?.length > 0 ? (
            <UserTable role={activeTab} users={users[activeTab]} onToggle={openConfirmationModal} />
          ) : (
            <div className="text-center py-16 bg-white rounded-lg shadow-md">
              <p className="text-xl text-gray-500">No {activeTab} found.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default ShowAllUsersPage;
