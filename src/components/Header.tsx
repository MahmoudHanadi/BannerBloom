import React from 'react';
import { Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm z-20 relative">
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg text-white">
                    <Sparkles size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                        Banner Spore
                    </h1>
                    <p className="text-xs text-gray-500 font-medium">Professional Banner Studio</p>
                </div>
            </div>

            <div className="ml-auto flex items-center gap-4">
                {/* Placeholdder for future nav items or user profile */}
            </div>
        </header>
    );
};
