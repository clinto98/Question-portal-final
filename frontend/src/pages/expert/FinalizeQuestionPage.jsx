import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import Modal from "react-modal";
import { host } from "../../utils/APIRoutes";
import axios from "axios";

export default function FinalizeQuestionPage() {
    const { token } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterCourse, setFilterCourse] = useState("All");
    const [filterSubject, setFilterSubject] = useState("All");
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [courses, setCourses] = useState([]);
    const [subjects, setSubjects] = useState([]);

    useEffect(() => {
        const fetchQuestions = async () => {
            if (!token) return;
            try {
                setLoading(true);
                const params = {
                    page: currentPage,
                    limit: 10,
                    course: filterCourse,
                    subject: filterSubject,
                };
                const response = await axios.get(`${host}/api/expert/questions`, {
                    headers: { "Authorization": `Bearer ${token}` },
                    params,
                });
                setQuestions(response.data.data || []);
                setTotalPages(response.data.totalPages || 1);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, [token, currentPage, filterCourse, filterSubject]);

    useEffect(() => {
        const fetchFilters = async () => {
            if (!token) return;
            try {
                const [coursesRes, subjectsRes] = await Promise.all([
                    axios.get(`${host}/api/expert/courses`, {
                        headers: { "Authorization": `Bearer ${token}` },
                    }),
                    axios.get(`${host}/api/expert/subjects`, {
                        headers: { "Authorization": `Bearer ${token}` },
                    }),
                ]);
                setCourses(["All", ...coursesRes.data.data]);
                setSubjects(["All", ...subjectsRes.data.data]);
            } catch (err) {
                console.error("Failed to fetch filters", err);
            }
        };
        fetchFilters();
    }, [token]);


    const openModal = (imageUrl) => {
        setSelectedImage(imageUrl);
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
        setSelectedImage(null);
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Questions to Finalize</h1>
            <div className="flex space-x-4 mb-4">
                <div>
                    <label htmlFor="course-filter" className="block text-sm font-medium text-gray-700">Course</label>
                    <select id="course-filter" value={filterCourse} onChange={e => { setFilterCourse(e.target.value); setCurrentPage(1); }} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        {courses.map(course => <option key={course} value={course}>{course}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="subject-filter" className="block text-sm font-medium text-gray-700">Subject</label>
                    <select id="subject-filter" value={filterSubject} onChange={e => { setFilterSubject(e.target.value); setCurrentPage(1); }} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
                    </select>
                </div>
            </div>
            {loading ? (
                <p>Loading questions...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : questions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No questions are currently awaiting your review.</p>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 table-fixed w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Question</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Course</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Subject</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Unit</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Unit No.</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Topic</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Maker</th>
                                    <th scope="col" className="relative px-6 py-3 w-auto"><span className="sr-only">Review</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {questions.map((q) => (
                                    <tr key={q._id}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                {q.question.image && (
                                                    <img
                                                        src={q.question.image}
                                                        alt="Question thumbnail"
                                                        className="h-10 w-10 rounded-md object-cover mr-4 cursor-pointer"
                                                        onClick={() => openModal(q.question.image)}
                                                    />
                                                )}
                                                <div className="text-sm text-gray-900 truncate">{q.question.text || "(Image Question)"}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><div className="text-sm text-gray-900 truncate">{q.course?.title || "N/A"}</div></td>
                                        <td className="px-6 py-4"><div className="text-sm text-gray-900 truncate">{q.subject}</div></td>
                                        <td className="px-6 py-4"><div className="text-sm text-gray-900 truncate">{q.unit || "N/A"}</div></td>
                                        <td className="px-6 py-4"><div className="text-sm text-gray-900 truncate">{q.unit_no || "N/A"}</div></td>
                                        <td className="px-6 py-4"><div className="text-sm text-gray-900 truncate">{q.topic || "N/A"}</div></td>
                                        <td className="px-6 py-4"><div className="text-sm text-gray-900 truncate">{q.maker?.name || "N/A"}</div></td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                            <Link to={`/expert/question/view/${q._id}`} className="text-purple-600 hover:text-purple-900">Review</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Previous</button>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Next</button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                                        <span className="sr-only">Previous</span>
                                        &lt;
                                    </button>
                                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                                        <span className="sr-only">Next</span>
                                        &gt;
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </>
            )}
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                ariaHideApp={false}
                style={{
                    overlay: {
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        zIndex: 1000
                    },
                    content: {
                        top: '50%',
                        left: '50%',
                        right: 'auto',
                        bottom: 'auto',
                        marginRight: '-50%',
                        transform: 'translate(-50%, -50%)',
                        border: 'none',
                        background: 'none',
                        padding: 0,
                        overflow: 'visible'
                    }
                }}
            >
                <div className="relative">
                    <button onClick={closeModal} className="absolute -top-10 -right-10 text-white text-4xl font-bold">&times;</button>
                    <img src={selectedImage} alt="Enlarged question" className="max-w-screen-lg max-h-screen-lg" />
                </div>
            </Modal>
        </div>
    );
}