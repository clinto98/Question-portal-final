import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Modal from "react-modal";
import { useAuth } from "../../context/AuthContext";
import { host } from "../../utils/APIRoutes";
import axios from "axios";

export default function FinalizedQuestionsPage() {
    const { token } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterCourse, setFilterCourse] = useState("All");
    const [filterSubject, setFilterSubject] = useState("All");
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        const fetchQuestions = async () => {
            if (!token) return;
            try {
                setLoading(true);
                const response = await axios.get(`${host}/api/expert/questions/finalized`, {
                    headers: { "Authorization": `Bearer ${token}` },
                });
                setQuestions(response.data.data || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, [token]);

    const courses = ["All", ...new Set(questions.map(q => q.course?.title).filter(Boolean))];
    const subjects = ["All", ...new Set(questions.map(q => q.subject).filter(Boolean))];

    const filteredQuestions = questions.filter(q => {
        const matchesCourse = filterCourse === "All" || q.course?.title === filterCourse;
        const matchesSubject = filterSubject === "All" || q.subject === filterSubject;
        return matchesCourse && matchesSubject;
    });

    const openModal = (imageUrl) => {
        setSelectedImage(imageUrl);
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
        setSelectedImage(null);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Finalized Questions</h1>
            <div className="flex space-x-4 mb-4">
                <div>
                    <label htmlFor="course-filter" className="block text-sm font-medium text-gray-700">Course</label>
                    <select id="course-filter" value={filterCourse} onChange={e => setFilterCourse(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        {courses.map(course => <option key={course} value={course}>{course}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="subject-filter" className="block text-sm font-medium text-gray-700">Subject</label>
                    <select id="subject-filter" value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
                    </select>
                </div>
            </div>
            {loading ? (
                <p>Loading questions...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : filteredQuestions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No finalized questions match your criteria.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit No.</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredQuestions.map((q) => (
                                <tr key={q._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {q.question.image && (
                                                <img 
                                                    src={q.question.image} 
                                                    alt="Question thumbnail" 
                                                    className="h-10 w-10 rounded-md object-cover mr-4 cursor-pointer" 
                                                    onClick={() => openModal(q.question.image)}
                                                />
                                            )}
                                            <div className="text-sm text-gray-900 truncate w-60">{q.question.text || "(Image Question)"}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{q.course?.title || "N/A"}</div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{q.subject}</div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{q.unit || "N/A"}</div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{q.unit_no || "N/A"}</div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{q.topic || "N/A"}</div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Finalised</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Link to={`/expert/finalized-question/view/${q._id}`} className="text-indigo-600 hover:text-indigo-900">View</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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