import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { host } from "../../utils/APIRoutes";
import Loader from "../../components/Loader";
// --- Helper Components ---

// A reusable component to display content that can be text, an image, or both.
const ContentDisplay = ({ content }) => {
  if (!content || (!content.text && !content.image)) {
    return <p className="text-gray-500 italic">Untitled Question</p>;
  }
  return (
    <>
      {content.text && (
        <p className="text-gray-800 line-clamp-3">{content.text}</p>
      )}
      {content.image && (
        <img
          src={content.image}
          alt="Question draft"
          className="mt-2 rounded-md h-24 w-auto object-contain border"
        />
      )}
    </>
  );
};

// --- Main Component ---

export default function DraftQuestions() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Fetch drafts from backend
  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${host}/api/questions/drafts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDrafts(res.data);
      } catch (err) {
        console.error("Error fetching drafts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDrafts();
  }, []);

  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((qId) => qId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selected.length === filteredDrafts.length) {
      setSelected([]); // Deselect all
    } else {
      setSelected(filteredDrafts.map((q) => q._id)); // Select all
    }
  };

  const handleSubmitForApproval = async () => {
    if (selected.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to submit ${selected.length} draft(s) for approval?`
      )
    )
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${host}/api/questions/submit`,
        { ids: selected },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDrafts((prev) => prev.filter((q) => !selected.includes(q._id)));
      setSelected([]);
      alert(`${selected.length} draft(s) submitted successfully!`);
    } catch (err) {
      console.error("Submit for approval failed", err);
      alert("Failed to submit drafts.");
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to permanently delete ${selected.length} draft(s)?`
      )
    )
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${host}/api/questions/delete`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { ids: selected },
      });
      setDrafts((prev) => prev.filter((q) => !selected.includes(q._id)));
      setSelected([]);
      alert(`${selected.length} draft(s) deleted successfully.`);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const filteredDrafts = drafts.filter((q) => {
    const searchTerm = search.toLowerCase();
    const questionText = (q.question?.text || "").toLowerCase();
    const subject = (q.subject || "").toLowerCase();
    const chapter = (q.chapter || "").toLowerCase();
    return (
      questionText.includes(searchTerm) ||
      subject.includes(searchTerm) ||
      chapter.includes(searchTerm)
    );
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* --- Header --- */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold text-gray-800">My Drafts</h1>
            <button
              onClick={() => navigate("/maker/create")}
              className="mt-4 sm:mt-0 bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 font-semibold transition"
            >
              + Create New Question
            </button>
          </div>
          <div className="mt-6">
            <input
              type="text"
              placeholder="Search by text, subject, or chapter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* --- Bulk Actions Bar --- */}
        {selected.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={selected.length === filteredDrafts.length}
                onChange={handleSelectAll}
                title="Select All"
              />
              <label className="ml-3 font-medium text-gray-700">
                {selected.length} item(s) selected
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteSelected}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-semibold transition"
              >
                Delete Selected
              </button>
              <button
                onClick={handleSubmitForApproval}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold transition"
              >
                Submit for Approval
              </button>
            </div>
          </div>
        )}

        {/* --- Main Content: Drafts Grid --- */}
        {loading ? <Loader></Loader>: filteredDrafts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <p className="text-xl text-gray-500">
              {search
                ? "No drafts match your search."
                : "You have no saved drafts."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={selected.length > 0 && selected.length === filteredDrafts.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDrafts.map((q) => (
                  <tr key={q._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={selected.includes(q._id)}
                        onChange={() => handleSelect(q._id)}
                      />
                    </td>
                    <td className="px-6 py-4 max-w-sm">
                      <div className="text-sm text-gray-900 truncate">
                        <ContentDisplay content={q.question} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{q.course?.title || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{q.subject || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(q.updatedAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/maker/create/${q._id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
