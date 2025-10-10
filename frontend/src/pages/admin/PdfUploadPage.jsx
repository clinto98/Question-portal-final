import React, { useState, useEffect } from "react";
import axios from "axios";
import { host } from "../../utils/APIRoutes";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";

// --- Reusable Helper Components ---

const Label = ({ htmlFor, children, isRequired }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
    {children} {isRequired && <span className="text-red-500">*</span>}
  </label>
);

const Button = ({ children, ...props }) => (
    <button
      className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-slate-400"
      {...props}
    >
      {children}
    </button>
);

const FileInput = ({ label, name, selectedFile, onFileChange, onRemove, isRequired }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputId = `file-input-${name}`;

  const handleDrag = (e, isEntering) => {
    e.preventDefault();
    e.stopPropagation();
    if (isEntering) {
      setIsDragging(true);
    } else {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileChange(name, e.dataTransfer.files[0]);
    }
  };

  return (
    <div>
      <Label htmlFor={inputId} isRequired={isRequired}>{label}</Label>
      {!selectedFile ? (
        <div 
          onDragEnter={(e) => handleDrag(e, true)}
          onDragLeave={(e) => handleDrag(e, false)}
          onDragOver={(e) => handleDrag(e, true)}
          onDrop={handleDrop}
          className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md transition-colors ${isDragging ? 'bg-blue-50 border-blue-400' : 'bg-white'}`}>
          <div className="space-y-1 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label htmlFor={inputId} className="relative cursor-pointer bg-white rounded-md font-medium text-slate-600 hover:text-slate-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-slate-500">
                <span>Upload a file</span>
              </label>
              <input id={inputId} name={name} type="file" accept=".pdf" onChange={(e) => onFileChange(name, e.target.files[0])} className="sr-only" />
            </div>
            <p className="text-xs text-gray-500">or drag and drop PDF</p>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-800 truncate">{selectedFile.name}</span>
          </div>
          <button type="button" onClick={() => onRemove(name)} className="text-gray-400 hover:text-red-600">
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

export default function PdfUploadPage() {
  const initialState = {
    name: "",
    course: "",
    examType: "Board",
    subject: "",
    syllabus: "CBSE",
    standard: "10",
    questionPaperYear: new Date().getFullYear(),
    numberOfQuestions: "",
    questionPaperFile: null,
    solutionPaperFile: null,
  };

  const [formData, setFormData] = useState(initialState);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${host}/api/admin/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(res.data);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
        toast.error("Could not load courses from the server.");
      }
    };
    fetchCourses();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (name, file) => {
    if (file && file.type === "application/pdf") {
      setFormData((prev) => ({ ...prev, [name]: file }));
    } else if (file) {
      toast.error("Invalid file type. Only PDF files are allowed.");
    }
  };

  const removeFile = (name) => {
    setFormData((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = {
      name: "Paper Name",
      course: "Course",
      subject: "Subject",
      questionPaperYear: "Question Paper Year",
      numberOfQuestions: "Number of Questions",
      questionPaperFile: "Question Paper PDF",
    };

    for (const field in requiredFields) {
      if (!formData[field]) {
        toast.error(`Please fill in the required field: ${requiredFields[field]}`);
        return;
      }
    }

    setLoading(true);
    const toastId = toast.loading("Uploading paper...");

    const formPayload = new FormData();
    for (const key in formData) {
      if (key !== "questionPaperFile" && key !== "solutionPaperFile" && formData[key]) {
        formPayload.append(key, formData[key]);
      }
    }
    formPayload.append("questionPaper", formData.questionPaperFile);
    if (formData.solutionPaperFile) {
      formPayload.append("solutionPaper", formData.solutionPaperFile);
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${host}/api/admin/pdfs`, formPayload, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Question Paper uploaded successfully!", { id: toastId });
      setFormData(initialState);
    } catch (err) {
      console.error("Upload failed:", err);
      const errorMessage = err.response?.data?.message || "An unknown error occurred.";
      toast.error(`Upload failed: ${errorMessage}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-lg relative border border-gray-200">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Upload New Question Paper</h1>
        <p className="text-gray-500 mb-8 border-b pb-4">Provide the paper details and upload the question and solution PDFs.</p>

        {loading && <Loader />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name" isRequired>Paper Name</Label>
              <input id="name" type="text" name="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full px-4 py-3 bg-slate-50 rounded-md border-gray-200 focus:border-2 focus:border-slate-400 focus:ring-0" required />
            </div>
            <div>
              <Label htmlFor="course" isRequired>Course</Label>
              <select id="course" name="course" value={formData.course} onChange={handleInputChange} className="mt-1 block w-full px-4 py-3 bg-slate-50 rounded-md border-gray-200 focus:border-2 focus:border-slate-400 focus:ring-0" required>
                <option value="">Select a Course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>{course.title}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="subject" isRequired>Subject</Label>
              <input id="subject" type="text" name="subject" value={formData.subject} onChange={handleInputChange} className="mt-1 block w-full px-4 py-3 bg-slate-50 rounded-md border-gray-200 focus:border-2 focus:border-slate-400 focus:ring-0" required />
            </div>
            <div>
              <Label htmlFor="year" isRequired>Question Paper Year</Label>
              <input id="year" type="number" name="questionPaperYear" value={formData.questionPaperYear} onChange={handleInputChange} className="mt-1 block w-full px-4 py-3 bg-slate-50 rounded-md border-gray-200 focus:border-2 focus:border-slate-400 focus:ring-0" placeholder="e.g., 2023" required />
            </div>
            <div>
              <Label htmlFor="numQuestions" isRequired>Number of Questions</Label>
              <input id="numQuestions" type="number" name="numberOfQuestions" value={formData.numberOfQuestions} onChange={handleInputChange} className="mt-1 block w-full px-4 py-3 bg-slate-50 rounded-md border-gray-200 focus:border-2 focus:border-slate-400 focus:ring-0" required />
            </div>
            <div>
              <Label htmlFor="standard">Standard / Grade</Label>
              <select id="standard" name="standard" value={formData.standard} onChange={handleInputChange} className="mt-1 block w-full px-4 py-3 bg-slate-50 rounded-md border-gray-200 focus:border-2 focus:border-slate-400 focus:ring-0">
                {["4", "5", "6", "7", "8", "9", "10", "11", "12"].map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <Label htmlFor="syllabus">Syllabus</Label>
              <select id="syllabus" name="syllabus" value={formData.syllabus} onChange={handleInputChange} className="mt-1 block w-full px-4 py-3 bg-slate-50 rounded-md border-gray-200 focus:border-2 focus:border-slate-400 focus:ring-0">
                {["CBSE", "ICSE", "State Board", "SAT", "Other"].map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <Label htmlFor="examType">Exam Type</Label>
              <select id="examType" name="examType" value={formData.examType} onChange={handleInputChange} className="mt-1 block w-full px-4 py-3 bg-slate-50 rounded-md border-gray-200 focus:border-2 focus:border-slate-400 focus:ring-0">
                {["Board", "Entrance", "Scholarship", "Other"].map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
            <FileInput label="Question Paper PDF" name="questionPaperFile" selectedFile={formData.questionPaperFile} onFileChange={handleFileChange} onRemove={removeFile} isRequired />
            <FileInput label="Solution Paper PDF (Optional)" name="solutionPaperFile" selectedFile={formData.solutionPaperFile} onFileChange={handleFileChange} onRemove={removeFile} />
          </div>

          <div className="pt-6 border-t text-right">
            <Button type="submit" disabled={loading}>
              {loading ? "Uploading..." : "Upload Paper"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
