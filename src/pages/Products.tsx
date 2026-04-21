import React, { useState } from 'react';
import { useCategoryStore } from '../store/useCategoryStore';
import { useBrandStore } from '../store/useBrandStore';
import { ShoppingBag, Box, Tag, Filter, CheckCircle } from 'lucide-react';

const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Beauty'];
const brands = ['Brand A', 'Brand B', 'Brand C', 'Premium Luxe', 'Eco Choice'];

const Products: React.FC = () => {
    const { selectedCategory, setCategory } = useCategoryStore();
    const { selectedBrand, setBrand } = useBrandStore();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const simulateRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            window.location.reload();
        }, 800);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div className="flex items-center gap-4">
                    <div className="bg-orange-100 p-4 rounded-2xl text-orange-600 shadow-sm">
                        <ShoppingBag size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Product Filters</h1>
                        <p className="text-gray-500 font-medium">Manage your product showcase selection</p>
                    </div>
                </div>

                <button
                    onClick={simulateRefresh}
                    className="group relative flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all shadow-xl hover:-translate-y-1"
                >
                    {isRefreshing ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span>Test Non-Persistence</span>
                            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">F5</span>
                        </div>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Category Selection */}
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 text-indigo-50/50 -mr-4 -mt-4">
                        <Box size={120} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <Filter className="text-indigo-600" size={20} />
                            <h2 className="text-xl font-bold text-gray-800">Select Category</h2>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${selectedCategory === cat
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105'
                                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Brand Selection */}
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 text-pink-50/50 -mr-4 -mt-4">
                        <Tag size={120} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <Filter className="text-pink-600" size={20} />
                            <h2 className="text-xl font-bold text-gray-800">Select Brand</h2>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {brands.map((br) => (
                                <button
                                    key={br}
                                    onClick={() => setBrand(br)}
                                    className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${selectedBrand === br
                                            ? 'bg-pink-600 text-white shadow-lg shadow-pink-100 scale-105'
                                            : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
                                        }`}
                                >
                                    {br}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Section */}
            <div className="mt-10 bg-slate-900 p-8 rounded-[2rem] text-white">
                <h3 className="text-lg font-bold mb-6 text-slate-400 uppercase tracking-widest">Active Selections (Local Only)</h3>
                <p className="mb-4 text-sm text-slate-500 italic">* These values will reset on page refresh as Category/Brand stores do not use persistence.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <p className="text-sm text-slate-400 mb-1">Current Category</p>
                        <div className="flex items-center gap-3">
                            <span className={`text-2xl font-bold ${selectedCategory ? 'text-indigo-400' : 'text-slate-600 italic'}`}>
                                {selectedCategory || 'Not Selected'}
                            </span>
                            {selectedCategory && <CheckCircle size={20} className="text-indigo-400" />}
                        </div>
                    </div>

                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <p className="text-sm text-slate-400 mb-1">Current Brand</p>
                        <div className="flex items-center gap-3">
                            <span className={`text-2xl font-bold ${selectedBrand ? 'text-pink-400' : 'text-slate-600 italic'}`}>
                                {selectedBrand || 'Not Selected'}
                            </span>
                            {selectedBrand && <CheckCircle size={20} className="text-pink-400" />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Products;
