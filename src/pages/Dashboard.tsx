import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useBusinessStore } from '../store/useBusinessStore';
import { useUIStore } from '../store/useUIStore';
import { LayoutDashboard, Building2, User, LogOut, Sun, Moon } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { selectedBusiness } = useBusinessStore();
    const { isLoggedIn, login, logout } = useAuthStore();
    const { theme, setTheme } = useUIStore();

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-200">
                        <LayoutDashboard size={28} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Dashboard</h1>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                        className={`p-2 rounded-xl transition-all ${theme === 'light' ? 'bg-amber-50 text-amber-600' : 'bg-slate-800 text-slate-200'}`}
                    >
                        {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    {isLoggedIn ? (
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    ) : (
                        <button
                            onClick={login}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md font-medium"
                        >
                            <User size={18} />
                            Demo Login
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Business Status Card */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                            <Building2 size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Active Business</h3>
                    </div>

                    {selectedBusiness ? (
                        <div>
                            <p className="text-4xl font-black text-blue-600 mb-2 truncate" title={selectedBusiness}>
                                {selectedBusiness}
                            </p>
                            <p className="text-gray-500 font-medium">Session Active</p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-2xl font-bold text-gray-400 mb-2">No Business Selected</p>
                            <p className="text-gray-400">Please select a business to continue</p>
                        </div>
                    )}
                </div>

                {/* User Status Card */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                            <User size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">User Session</h3>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${isLoggedIn ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                        <p className={`text-xl font-bold ${isLoggedIn ? 'text-green-600' : 'text-gray-400'}`}>
                            {isLoggedIn ? 'Logged In' : 'Logged Out'}
                        </p>
                    </div>
                    <p className="mt-2 text-gray-500 font-medium">
                        {isLoggedIn ? 'Admin Access' : 'Guest Mode'}
                    </p>
                </div>

                {/* Analytics Card Placeholder */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-3xl shadow-lg text-white">
                    <h3 className="text-lg font-bold mb-4 opacity-90">Quick Stats</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/20 pb-2">
                            <span className="opacity-80">Total Revenue</span>
                            <span className="font-bold">$12,450.00</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/20 pb-2">
                            <span className="opacity-80">Active Users</span>
                            <span className="font-bold">245</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="opacity-80">System Load</span>
                            <span className="font-bold text-green-300">Normal</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
