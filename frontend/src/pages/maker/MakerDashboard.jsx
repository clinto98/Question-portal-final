import React, { useEffect, useState } from "react";
import axios from "axios";
import { host } from "../../utils/APIRoutes";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Loader from "../../components/Loader";
import { useNavigate } from "react-router-dom";
import { HiPlus, HiOutlineEye, HiOutlineDocumentText } from "react-icons/hi";


// --- Redesigned & New Reusable Components ---

const Section = ({ title, children, className = "" }) => (
  <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
    <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
    {children}
  </div>
);

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
      <span className="text-xl">{icon}</span>
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const HeroCard = ({ title, value, icon, color }) => (
  <div className={`bg-white p-6 rounded-lg shadow-lg border-l-4 ${color}`}>
    <div className="flex items-center gap-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-gray-600 font-semibold">{title}</p>
        <p className="text-4xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

const QuickActionButton = ({ title, icon, onClick }) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center gap-3 p-4 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all duration-200"
    >
        {icon}
        <span className="font-semibold text-gray-700">{title}</span>
    </button>
);


const TimeFilterButton = ({ label, timeframe, activeTimeframe, onClick }) => (
  <button
    onClick={() => onClick(timeframe)}
    className={`px-4 py-2 text-sm font-semibold rounded-md transition ${
      activeTimeframe === timeframe
        ? "bg-blue-600 text-white shadow"
        : "bg-white text-gray-700 hover:bg-gray-100"
    }`}
  >
    {label}
  </button>
);

// --- Main Dashboard Component ---

export default function MakerDashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    chartData: [],
  });
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("weekly");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const params = { timeframe };
        if (timeframe === "custom" && startDate && endDate) {
          params.startDate = startDate.toISOString();
          params.endDate = endDate.toISOString();
        }
        const res = await axios.get(`${host}/api/questions/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });
        setDashboardData(res.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeframe, startDate, endDate]);

  useEffect(() => {
    const fetchWalletData = async () => {
      setWalletLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${host}/api/wallet`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWalletData(res.data);
      } catch (err) {
        console.error("Error fetching wallet data:", err);
      } finally {
        setWalletLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  const handleTimeframeClick = (newTimeframe) => {
    setTimeframe(newTimeframe);
    if (newTimeframe !== 'custom') {
      setStartDate(null);
      setEndDate(null);
    }
  };

  const { stats, chartData } = dashboardData;
  const isLoading = loading || walletLoading;

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8 space-y-8">
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>
          <p className="text-gray-500 mt-1">
            An overview of your question creation activity.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0 bg-white p-1 rounded-lg border">
          <TimeFilterButton label="This Week" timeframe="weekly" activeTimeframe={timeframe} onClick={handleTimeframeClick} />
          <TimeFilterButton label="This Month" timeframe="monthly" activeTimeframe={timeframe} onClick={handleTimeframeClick} />
          <TimeFilterButton label="All Time" timeframe="all" activeTimeframe={timeframe} onClick={handleTimeframeClick} />
          <TimeFilterButton label="Custom Range" timeframe="custom" activeTimeframe={timeframe} onClick={handleTimeframeClick} />
        </div>
      </div>
      {timeframe === 'custom' && (
        <div className="flex items-center gap-2 -mt-4 sm:mt-0 bg-white p-2 rounded-lg border max-w-md">
          <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} selectsStart startDate={startDate} endDate={endDate} placeholderText="Start Date" className="w-full px-4 py-2 border rounded-md" />
          <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} selectsEnd startDate={startDate} endDate={endDate} minDate={startDate} placeholderText="End Date" className="w-full px-4 py-2 border rounded-md" />
        </div>
      )}

      {isLoading ? <Loader /> : (
        <>
          {/* --- HERO METRICS --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HeroCard title="Available for Payout" value={walletLoading ? "..." : `₹${walletData?.balance ?? 0}`} icon="💸" color="border-green-500" />
            <HeroCard title="Questions Pending Review" value={stats.totalPending ?? 0} icon="⏳" color="border-yellow-500" />
          </div>

          {/* --- MAIN TWO-COLUMN LAYOUT --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              <Section title="Content Funnel">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard title="Total Created" value={stats.totalCreated ?? 0} icon="✏️" color="bg-blue-100" />
                  <StatCard title="Total Approved" value={stats.totalAccepted ?? 0} icon="✅" color="bg-green-100" />
                  <StatCard title="Currently Rejected" value={stats.currentlyRejected ?? 0} icon="❌" color="bg-red-100" />
                  <StatCard title="In Draft" value={stats.totalDrafted ?? 0} icon="📝" color="bg-gray-100" />
                  <StatCard title="Historical Rejections" value={stats.historicalRejections ?? 0} icon="⭕" color="bg-purple-100" />
                </div>
              </Section>

              <Section title="Activity Trend">
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="created" stroke="#3B82F6" strokeWidth={2} name="Created" />
                      <Line type="monotone" dataKey="approved" stroke="#10B981" strokeWidth={2} name="Approved" />
                      <Line type="monotone" dataKey="rejected" stroke="#EF4444" strokeWidth={2} name="Rejected" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Section>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              <Section title="Quick Actions">
                <div className="space-y-3">
                    <QuickActionButton title="Create New Question" icon={<HiPlus size={20} className="text-blue-600"/>} onClick={() => navigate('/maker/create')} />
                    <QuickActionButton title="View Drafts" icon={<HiOutlineDocumentText size={20} className="text-gray-600"/>} onClick={() => navigate('/maker/drafts')} />
                    <QuickActionButton title="View Submitted" icon={<HiOutlineEye size={20} className="text-gray-600"/>} onClick={() => navigate('/maker/submitted')} />
                </div>
              </Section>
              <Section title="Financial Overview">
                <StatCard title="Total Earnings (Lifetime)" value={walletLoading ? "..." : `₹${walletData?.totalamount ?? 0}`} icon="💰" color="bg-green-100" />
              </Section>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
