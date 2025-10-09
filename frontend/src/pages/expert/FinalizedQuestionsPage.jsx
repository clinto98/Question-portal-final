import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { host } from "../../utils/APIRoutes";
import axios from "axios";

export default function FinalizedQuestionsPage() {
    const { token } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Finalized Questions</h1>
            {loading ? (
                <p>Loading questions...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : questions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">You have not finalized any questions yet.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {questions.map((q) => (
                                <tr key={q._id}>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900 truncate w-60">{q.question.text}</div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{q.course?.title || "N/A"}</div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{q.subject}</div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Finalised</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
