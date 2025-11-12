import React, { useState } from "react";
import axios from "axios";
import { host } from "../../utils/APIRoutes";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";
import { HiEye, HiEyeOff } from "react-icons/hi";

// --- Reusable Form Components from CreateUserPage.jsx for consistency ---
const Input = (props) => (
  <input
    className="border border-gray-300 px-3 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-slate-500 transition"
    {...props}
  />
);

const Button = ({ children, ...props }) => (
  <button
    className="bg-slate-700 text-white px-4 py-2.5 rounded-md hover:bg-slate-800 transition font-semibold disabled:bg-slate-400 w-full"
    {...props}
  >
    {children}
  </button>
);

const FormLabel = ({ children, htmlFor }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
        {children}
    </label>
);

function UpdatePasswordPage() {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const token = localStorage.getItem("token");

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = formData;

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.put(
        `${host}/api/auth/update-password/maker`,
        { oldPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(res.data.message);
      // Reset form
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      const message = err.response?.data?.message || "An unexpected error occurred.";
      toast.error(message);
      console.error("Error updating password:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg relative mt-8 border border-gray-200">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Update Your Password</h1>

      {loading && <Loader />}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
            <FormLabel htmlFor="oldPassword">Current Password</FormLabel>
            <div className="relative">
                <Input
                    id="oldPassword"
                    type={showOldPassword ? "text" : "password"}
                    name="oldPassword"
                    placeholder="Enter your current password"
                    value={formData.oldPassword}
                    onChange={handleInputChange}
                />
                <button 
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                    {showOldPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                </button>
            </div>
        </div>

        <div>
            <FormLabel htmlFor="newPassword">New Password</FormLabel>
            <div className="relative">
                <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    placeholder="Enter your new password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                />
                <button 
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                    {showNewPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                </button>
            </div>
        </div>

        <div>
            <FormLabel htmlFor="confirmPassword">Confirm New Password</FormLabel>
            <div className="relative">
                <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                />
                <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                    {showConfirmPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                </button>
            </div>
        </div>

        <div className="pt-4">
            <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
            </Button>
        </div>
      </form>
    </div>
  );
}

export default UpdatePasswordPage;
