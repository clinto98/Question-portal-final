import React, { useEffect, useState } from "react";
import { host } from "../../utils/APIRoutes";
import Loader from "../../components/Loader";
function ShowAllUsersPage() {
  const [users, setUsers] = useState({ makers: [], checkers: [] });
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in as admin");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${host}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to fetch users");
      } else {
        setUsers({ makers: data.makers, checkers: data.checkers });
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      alert("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (role, id) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${host}/api/admin/user/${role}/${id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to toggle user status");
      } else {
        alert(data.message);
        fetchUsers(); // Refresh the list
      }
    } catch (err) {
      console.error("Error toggling user status:", err);
      alert("Failed to toggle user status");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
      <h1 className="text-2xl font-bold mb-6 text-center">All Users</h1>

      {loading ? <Loader />: (
        <>
          {["makers", "checkers"].map((role) => (
            <div key={role} className="mb-6">
              <h2 className="text-xl font-semibold mb-3 capitalize">{role}</h2>
              {users[role].length === 0 ? (
                <p className="text-gray-500">No {role} found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 border">#</th>
                        <th className="px-4 py-2 border">Name</th>
                        <th className="px-4 py-2 border">Email</th>
                        <th className="px-4 py-2 border">Status</th>
                        <th className="px-4 py-2 border">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users[role].map((user, idx) => (
                        <tr key={user._id} className="text-center">
                          <td className="px-4 py-2 border">{idx + 1}</td>
                          <td className="px-4 py-2 border">{user.name}</td>
                          <td className="px-4 py-2 border">{user.email}</td>
                          <td className="px-4 py-2 border">
                            <span className={`px-2 py-1 rounded-full text-white ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}>
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-2 border">
                            <button
                              onClick={() =>
                                handleToggleStatus(role.slice(0, -1), user._id)
                              }
                              className={`text-white px-3 py-1 rounded ${user.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
                              {user.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default ShowAllUsersPage;
