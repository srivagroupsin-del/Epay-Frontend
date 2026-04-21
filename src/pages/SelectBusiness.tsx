import React from 'react';
import { useBusinessStore } from '../store/useBusinessStore';
import { Building2, CheckCircle2 } from 'lucide-react';

const businesses = [
    { id: '1', name: 'Retail Store' },
    { id: '2', name: 'Wholesale Hub' },
    { id: '3', name: 'E-commerce Center' },
    { id: '4', name: 'Service Point' },
];

const SelectBusiness: React.FC = () => {
    const { selectedBusiness, setBusiness } = useBusinessStore();

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Select Business</h1>
                <p className="text-gray-600">Choose the active business environment to manage.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {businesses.map((biz) => (
                    <div
                        key={biz.id}
                        onClick={() => setBusiness(biz.name)}
                        className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between group ${selectedBusiness === biz.name
                            ? 'border-blue-500 bg-blue-50/50 shadow-lg'
                            : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-md'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl transition-colors ${selectedBusiness === biz.name ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-500'
                                }`}>
                                <Building2 size={24} />
                            </div>
                            <span className={`font-semibold text-lg ${selectedBusiness === biz.name ? 'text-blue-700' : 'text-gray-700'
                                }`}>
                                {biz.name}
                            </span>
                        </div>
                        {selectedBusiness === biz.name && (
                            <CheckCircle2 className="text-blue-500" size={24} />
                        )}
                    </div>
                ))}
            </div>

            {selectedBusiness && (
                <div className="mt-12 p-6 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-green-800 font-medium">Business Selected</p>
                        <p className="text-green-600">You are now managing <strong>{selectedBusiness}</strong></p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SelectBusiness;
