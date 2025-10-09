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
// --- Reusable Components ---

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4">
    <div
      className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}
    >
      <span className="text-2xl">{icon}</span>
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
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
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    chartData: [],
  });
  const [loading, setLoading] = useState(true);
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

  const handleTimeframeClick = (newTimeframe) => {
    setTimeframe(newTimeframe);
    if (newTimeframe !== 'custom') {
      setStartDate(null);
      setEndDate(null);
    }
  };

  const { stats, chartData } = dashboardData;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>
          <p className="text-gray-500 mt-1">
            An overview of your question creation activity.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0 bg-white p-1 rounded-lg border">
          <TimeFilterButton
            label="This Week"
            timeframe="weekly"
            activeTimeframe={timeframe}
            onClick={handleTimeframeClick}
          />
          <TimeFilterButton
            label="This Month"
            timeframe="monthly"
            activeTimeframe={timeframe}
            onClick={handleTimeframeClick}
          />
          <TimeFilterButton
            label="All Time"
            timeframe="all"
            activeTimeframe={timeframe}
            onClick={handleTimeframeClick}
          />
          <TimeFilterButton
            label="Custom Range"
            timeframe="custom"
            activeTimeframe={timeframe}
            onClick={handleTimeframeClick}
          />
        </div>
      </div>
      {timeframe === 'custom' && (
        <div className="flex items-center gap-2 mt-4 sm:mt-0 bg-white p-2 rounded-lg border">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Start Date"
            className="px-4 py-2 border rounded-md"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            placeholderText="End Date"
            className="px-4 py-2 border rounded-md"
          />
        </div>
      )}

      {loading ? <Loader></Loader> : (
        <>
          {/* Stat Cards - UPDATED with 6 cards in a responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Total Created"
              value={stats.totalCreated ?? 0}
              icon="✏️"
              color="bg-blue-100 text-blue-600"
            />
            <StatCard
              title="Total Approved"
              value={stats.totalAccepted ?? 0}
              icon="✅"
              color="bg-green-100 text-green-600"
            />
            <StatCard
              title="Currently Rejected"
              value={stats.currentlyRejected ?? 0}
              icon="❌"
              color="bg-red-100 text-red-600"
            />
            <StatCard
              title="Pending Review"
              value={stats.totalPending ?? 0}
              icon="⏳"
              color="bg-yellow-100 text-yellow-600"
            />
            <StatCard
              title="Total Historical Rejection"
              value={stats.historicalRejections ?? 0}
              icon="⭕"
              color="bg-purple-100 text-purple-600"
            />
            <StatCard
              title="In Draft"
              value={stats.totalDrafted ?? 0}
              icon="📝"
              color="bg-gray-100 text-gray-600"
            />
          </div>

          {/* Performance Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Activity Trend
            </h2>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="created"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Created"
                  />
                  <Line
                    type="monotone"
                    dataKey="approved"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Approved"
                  />
                  <Line
                    type="monotone"
                    dataKey="rejected"
                    stroke="#EF4444"
                    strokeWidth={2}
                    name="Rejected"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
