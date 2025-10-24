import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { host } from '../../utils/APIRoutes';
import Loader from '../../components/Loader';

const PricingInput = ({ label, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
            {label.replace(/_/g, ' ')}
        </label>
        <input
            type="number"
            value={value}
            onChange={onChange}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
    </div>
);

const UpdatePricing = () => {
    const [pricing, setPricing] = useState(null);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const { data } = await axios.get(`${host}/api/admin/pricing`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setPricing(data);
            } catch (error) {
                toast.error('Failed to fetch pricing data.');
            } finally {
                setLoading(false);
            }
        };
        fetchPricing();
    }, [token]);

    const handleChange = (role, field, value) => {
        setPricing(prev => ({
            ...prev,
            [role]: {
                ...prev[role],
                [field]: value === '' ? '' : Number(value),
            },
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading("Updating pricing...");
        try {
            await axios.put(`${host}/api/admin/pricing`, pricing, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            toast.success('Pricing updated successfully!', { id: toastId });
        } catch (error) {
            toast.error('Failed to update pricing.', { id: toastId });
        }
    };

    if (loading) {
        return <Loader />;
    }

    if (!pricing) {
        return <div className="p-6 text-center text-gray-500">Could not load pricing configuration.</div>;
    }

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Update Pricing</h1>
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* --- Maker Pricing Section --- */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-3">Maker Pricing</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            {Object.keys(pricing.MAKER).map(key => (
                                <PricingInput
                                    key={key}
                                    label={key}
                                    value={pricing.MAKER[key]}
                                    onChange={(e) => handleChange('MAKER', key, e.target.value)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* --- Checker Pricing Section --- */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-3">Checker Pricing</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            {Object.keys(pricing.CHECKER).map(key => (
                                <PricingInput
                                    key={key}
                                    label={key}
                                    value={pricing.CHECKER[key]}
                                    onChange={(e) => handleChange('CHECKER', key, e.target.value)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdatePricing;
