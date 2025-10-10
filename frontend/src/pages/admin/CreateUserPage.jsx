import React, { useState } from "react";
import { host } from "../../utils/APIRoutes";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";
import { HiEye, HiEyeOff } from "react-icons/hi";

// --- Reusable Form Components ---
const Input = (props) => (
  <input
    className="border border-gray-300 px-3 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-slate-500 transition"
    {...props}
  />
);

const Select = ({ children, ...props }) => (
  <select
    className="border border-gray-300 px-3 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-slate-500 transition bg-white"
    {...props}
  >
    {children}
  </select>
);

const Button = ({ children, ...props }) => (
  <button
    className="bg-slate-700 text-white px-4 py-2.5 rounded-md hover:bg-slate-800 transition font-semibold disabled:bg-slate-400"
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


function CreateUserPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "maker",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const token = localStorage.getItem("token");

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${host}/api/admin/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to create user");
      } else {
        toast.success(data.message);
        // Reset form
        setFormData({ name: "", email: "", password: "", role: "maker" });
      }
    } catch (err) {
      console.error("Error creating user:", err);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg relative mt-8 border border-gray-200">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Create New User</h1>

      {loading && <Loader />}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
            <FormLabel htmlFor="name">Name</FormLabel>
            <Input
                id="name"
                type="text"
                name="name"
                placeholder="Enter user's full name"
                value={formData.name}
                onChange={handleInputChange}
            />
        </div>

        <div>
            <FormLabel htmlFor="email">Email</FormLabel>
            <Input
                id="email"
                type="email"
                name="email"
                placeholder="Enter user's email address"
                value={formData.email}
                onChange={handleInputChange}
            />
        </div>

        <div>
            <FormLabel htmlFor="password">Password</FormLabel>
            <div className="relative">
                <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter a strong password"
                    value={formData.password}
                    onChange={handleInputChange}
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                    {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                </button>
            </div>
        </div>

        <div>
            <FormLabel htmlFor="role">Role</FormLabel>
            <Select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
            >
                <option value="maker">Maker</option>
                <option value="checker">Checker</option>
                <option value="expert">Expert</option>
            </Select>
        </div>

        <div className="pt-4">
            <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating..." : "Create User"}
            </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateUserPage;
