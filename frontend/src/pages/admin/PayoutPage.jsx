import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { host } from '../../utils/APIRoutes';

const PayoutPage = () => {
    const [role, setRole] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [userBalance, setUserBalance] = useState(0);
    const [loading, setLoading] = useState(false);

    // Get token from localStorage
    const token = localStorage.getItem("token");

    // Fetch users based on selected role
    useEffect(() => {
        const fetchUsers = async () => {
            if (role) {
                setLoading(true);
                try {
                    const response = await axios.get(`${host}/api/admin/users/${role}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    setUsers(response.data);
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to fetch users.');
                    console.error('Error fetching users:', error);
                } finally {
                    setLoading(false);
                }
            }
        }; // Removed else block for setUsers([])
        fetchUsers();
    }, [role, token]); // Add token to dependency array

    // Fetch transactions and balance for selected user
    useEffect(() => {
        const fetchData = async () => {
            if (selectedUser) {
                setLoading(true);
                try {
                    // Fetch transactions
                    const transactionsResponse = await axios.get(`${host}/api/admin/payout/transactions/${selectedUser}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    setTransactions(transactionsResponse.data.transactions);

                    // Fetch user balance
                    const balanceResponse = await axios.get(`${host}/api/admin/users/${selectedUser}/balance`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    setUserBalance(balanceResponse.data.balance);

                } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to fetch user data.');
                    console.error('Error fetching user data:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                setTransactions([]);
                setUserBalance(0); // Reset balance when no user is selected
            }
        };
        fetchData();
    }, [selectedUser, token]); // Add token to dependency array

    const handlePayout = async (e) => {
        e.preventDefault();
        if (!selectedUser || !amount || !description) {
            return toast.error('Please fill all payout fields.');
        }

        setLoading(true);
        try {
            await axios.post(`${host}/api/admin/payout`, { userId: selectedUser, amount: Number(amount), description }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            toast.success('Payout successful!');
            setAmount('');
            setDescription('');
            // Refresh transactions and balance after payout
            const transactionsResponse = await axios.get(`${host}/api/admin/payout/transactions/${selectedUser}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            setTransactions(transactionsResponse.data.transactions);

            const balanceResponse = await axios.get(`${host}/api/admin/users/${selectedUser}/balance`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            setUserBalance(balanceResponse.data.balance);

        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Payout failed.';
            toast.error(errorMessage);
            console.error('Payout error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
      <div className="p-6 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Manage Payouts
        </h1>

        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Record New Payout
          </h2>
          <form onSubmit={handlePayout} className="space-y-4">
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700"
              >
                Select Role
              </label>
              <select
                id="role"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setSelectedUser(""); // Reset selected user when role changes
                  setTransactions([]); // Clear transactions
                  setUserBalance(0); // Clear balance
                }}
              >
                <option value="">-- Select Role --</option>
                <option value="maker">Maker</option>
                <option value="checker">Checker</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="user"
                className="block text-sm font-medium text-gray-700"
              >
                Select User
              </label>
              <select
                id="user"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                disabled={!role || users.length === 0}
              >
                <option value="">-- Select User --</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedUser && (
              <div className="text-lg font-medium text-gray-800">
                Current Balance:{" "}
                <span className="text-indigo-600">
                  ₹{userBalance.toFixed(2)}
                </span>
              </div>
            )}

            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700"
              >
                Amount
              </label>
              <input
                type="number"
                id="amount"
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                rows="3"
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description for the payout"
              ></textarea>
            </div>

            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              {loading ? "Processing..." : "Record Payout"}
            </button>
          </form>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Transaction History
          </h2>
          {loading && selectedUser ? (
            <p>Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p>No transactions found for the selected user.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.timestamp).toLocaleString()}
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
};

export default PayoutPage;
