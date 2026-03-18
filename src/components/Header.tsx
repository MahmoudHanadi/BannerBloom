import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm z-20 relative">
            <div className="flex items-center gap-3">
                <img src="/bannerbloom-mark.svg" alt="BannerBloom" className="h-10 w-10 rounded-xl" />
                <div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-teal-700">
                        BannerBloom
                    </h1>
                    <p className="text-xs text-gray-500 font-medium">Create once. Deploy everywhere.</p>
                </div>
            </div>

            <div className="ml-auto flex items-center gap-4">
                {/* Placeholdder for future nav items or user profile */}
            </div>
        </header>
    );
};
