import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

// This should be in a separate API file, but for simplicity...
const API_URL = "http://localhost:5000/api"; 

export default function ExpertDashboard() {
    const { token } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchQuestions = async () => {
            if (!token) return;
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/expert/questions`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch questions");
                }

                const data = await response.json();
                setQuestions(data.data || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, [token]);

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-purple-800 mb-6">Expert Dashboard</h1>
                <p className="text-gray-600 mb-8">Review and finalize the questions approved by the checkers.</p>

                <div className="bg-white rounded-lg shadow-md p-6">
                    {loading ? (
                        <p>Loading questions...</p>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : questions.length === 0 ? (
                        <p className="text-center text-gray-500">No questions are currently awaiting your review.</p>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {questions.map((q) => (
                                <li key={q._id} className="py-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-lg text-gray-800">{q.question.text || "Question text missing"}</p>
                                        <p className="text-sm text-gray-500">Course: {q.course?.title || "N/A"} | Subject: {q.subject}</p>
                                    </div>
                                    <Link 
                                        to={`/expert/question/${q._id}`}
                                        className="px-4 py-2 rounded-md bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
                                    >
                                        Review
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
