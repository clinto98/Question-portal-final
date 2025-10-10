import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { host } from "../../utils/APIRoutes";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";

// --- Main Component ---
export default function CreateCoursePage() {
  const initialState = {
    title: "",
    description: "",
    standard: "5",
    category: "",
    syllabus: "CBSE",
    examType: "Board",
    startDate: "",
    endDate: "",
    status: "Active",
  };

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.standard) {
      toast.error("Please provide a Title and Standard for the course.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Creating course...");
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${host}/api/admin/courses`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Course created successfully!", { id: toastId });
      setFormData(initialState); // Reset form
      navigate("/admin/view-courses");
    } catch (err) {
      console.error("Failed to create course:", err);
      const errorMessage = err.response?.data?.message || "An unknown error occurred.";
      toast.error(`Error: ${errorMessage}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const inputStyles = "mt-1 block w-full px-4 py-3 bg-slate-50 rounded-md border-gray-200 focus:border-2 focus:border-slate-400 focus:ring-0";

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-lg relative border border-gray-200">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Create New Course</h1>
        <p className="text-gray-500 mb-8 border-b pb-4">Fill in the details below to add a new course to the system.</p>

        {loading && <Loader />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Course Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Course Title <span className="text-red-500">*</span></label>
              <input type="text" name="title" value={formData.title} onChange={handleInputChange} className={inputStyles} required />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows="4" className={inputStyles}></textarea>
            </div>

            {/* Standard & Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Standard / Grade <span className="text-red-500">*</span></label>
              <select name="standard" value={formData.standard} onChange={handleInputChange} className={inputStyles}>
                {[5, 6, 7, 8, 9, 10, 11, 12, "Higher Studies"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input type="text" name="category" value={formData.category} onChange={handleInputChange} placeholder="e.g., Science, Commerce" className={inputStyles} />
            </div>

            {/* Syllabus & Exam Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Syllabus <span className="text-red-500">*</span></label>
              <select name="syllabus" value={formData.syllabus} onChange={handleInputChange} className={inputStyles}>
                {["CBSE", "ICSE", "State Board", "SAT", "Other"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Exam Type <span className="text-red-500">*</span></label>
              <select name="examType" value={formData.examType} onChange={handleInputChange} className={inputStyles}>
                {["Board", "Entrance", "Scholarship", "Other"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Dates & Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className={inputStyles} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className={inputStyles} />
            </div>
          </div>

          {/* --- Submit Button --- */}
          <div className="pt-6 border-t text-right">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-slate-400"
            >
              {loading ? "Saving..." : "Create Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
