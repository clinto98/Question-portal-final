import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Loader from '../../components/Loader';
import { host } from '../../utils/APIRoutes';
import { FiDownload } from 'react-icons/fi';

const FullscreenImage = ({ src, onClose }) => {
    if (!src) return null;
    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[100]"
            onClick={onClose}
        >
            <img
                src={src}
                alt="Fullscreen"
                className="max-h-[90vh] max-w-[90vw] object-contain"
            />
        </div>
    );
};

const ReportPage = () => {
    const [role, setRole] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [approvedCount, setApprovedCount] = useState(0);
    const [rejectedCount, setRejectedCount] = useState(0);
    const [falseRejectionCount, setFalseRejectionCount] = useState(0);
    const [fullscreenImage, setFullscreenImage] = useState(null);
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (role) {
            const fetchUsers = async () => {
                try {
                    setLoading(true);
                    const res = await fetch(`${host}/api/admin/users/${role}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    const data = await res.json();
                    if (res.ok) {
                        setUsers(data);
                    } else {
                        throw new Error(data.message || 'Failed to fetch users');
                    }
                } catch (error) {
                    toast.error(error.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchUsers();
        } else {
            setUsers([]);
        }
    }, [role, token]);

    const handleGenerateReport = async () => {
        if (!role || !selectedUser || !startDate || !endDate) {
            toast.error('Please fill all fields');
            return;
        }

        setApprovedCount(0);
        setRejectedCount(0);
        setFalseRejectionCount(0);
        setQuestions([]);

        try {
            setLoading(true);
            const params = new URLSearchParams({
                role,
                userId: selectedUser,
                startDate,
                endDate,
            });
            const res = await fetch(`${host}/api/admin/report?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await res.json();

            if (res.ok) {
                setQuestions(data);

                let approved = 0;
                let rejected = 0;
                let falseRejections = 0;
                data.forEach(action => {
                    if (action.statusInReport === 'Approved') {
                        approved++;
                    } else if (action.statusInReport === 'Rejected') {
                        rejected++;
                    } else if (action.statusInReport === 'False Rejection') {
                        falseRejections++;
                    }
                });
                setApprovedCount(approved);
                setRejectedCount(rejected);
                setFalseRejectionCount(falseRejections);

                if (data.length === 0) {
                    toast.success('No actions found for the selected criteria.');
                }
            } else {
                throw new Error(data.message || 'Failed to generate report');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (questions.length === 0) {
            toast.error("No data to download.");
            return;
        }
        const toastId = toast.loading('Preparing download...');
        try {
            const params = new URLSearchParams({
                role,
                userId: selectedUser,
                startDate,
                endDate,
            });

            const res = await fetch(`${host}/api/admin/report/download?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Download failed');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'report.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Download started!', { id: toastId });

        } catch (error) {
            toast.error(error.message, { id: toastId });
        }
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Generate Report</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 bg-white p-4 rounded-lg shadow-md">
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="">Select Role</option>
                        <option value="maker">Maker</option>
                        <option value="checker">Checker</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">User</label>
                    <select id="user" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" disabled={!role || loading}>
                        <option value="">Select User</option>
                        {users.map(user => (
                            <option key={user._id} value={user._id}>{user.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>

                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-6">
                <button onClick={handleGenerateReport} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400" disabled={loading}>
                    {loading ? 'Generating...' : 'Generate Report'}
                </button>
                <div className="flex gap-4">
                    <div className="text-center p-4 bg-green-100 rounded-lg shadow-sm min-w-[120px]">
                        <p className="text-sm font-medium text-green-800">Approved</p>
                        <p className="text-2xl font-bold text-green-900">{approvedCount}</p>
                    </div>
                    <div className="text-center p-4 bg-red-100 rounded-lg shadow-sm min-w-[120px]">
                        <p className="text-sm font-medium text-red-800">Rejected</p>
                        <p className="text-2xl font-bold text-red-900">{rejectedCount}</p>
                    </div>
                    {role === 'checker' && (
                        <div className="text-center p-4 bg-yellow-100 rounded-lg shadow-sm min-w-[120px]">
                            <p className="text-sm font-medium text-yellow-800">False Rejection</p>
                            <p className="text-2xl font-bold text-yellow-900">{falseRejectionCount}</p>
                        </div>
                    )}
                    <div className="text-center p-4 bg-gray-200 rounded-lg shadow-sm min-w-[120px]">
                        <p className="text-sm font-medium text-gray-800">Reward</p>
                        <p className="text-2xl font-bold text-gray-900">--</p>
                    </div>
                </div>
            </div>

            {loading && <Loader />}

            {!loading && questions.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Results</h2>
                        <button 
                            onClick={handleDownload}
                            disabled={questions.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <FiDownload />
                            <span>Download Excel</span>
                        </button>
                    </div>
                    <div className="overflow-auto max-h-[60vh]">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {questions.map(q => (
                                    <tr key={q._id}>
                                        <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-900">
                                            {q.question?.text || 'N/A'}
                                            {q.question?.image && (
                                                <img
                                                    src={q.question.image}
                                                    alt="Question"
                                                    className="rounded-lg max-h-40 w-auto mt-2 border p-2 cursor-pointer"
                                                    onClick={() => setFullscreenImage(q.question.image)}
                                                />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{q.subject}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{q.course?.title || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{q.difficulty}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                q.statusInReport === 'Approved' ? 'bg-green-100 text-green-800' : 
                                                q.statusInReport === 'Rejected' ? 'bg-red-100 text-red-800' : 
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {q.statusInReport}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(q.actionDate).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!loading && questions.length === 0 && (
                 <div className="text-center py-4 text-sm text-gray-500">No actions found for the selected criteria.</div>
            )}
            <FullscreenImage src={fullscreenImage} onClose={() => setFullscreenImage(null)} />
        </div>
    );
};

export default ReportPage;