import React from 'react';
import { SaveBar } from './SaveBar';
import { Sidebar } from './Sidebar';
import { CanvasArea } from './CanvasArea';
import { PropertiesPanel } from './PropertiesPanel';
import { ExportPanel } from './ExportPanel';
import { ProjectGallery } from './ProjectGallery';

export const Layout: React.FC = () => {
    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-50 text-gray-900 font-sans">
            <SaveBar />
            <div className="flex-1 flex overflow-hidden relative">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
                    <CanvasArea />
                    <ExportPanel />
                </div>
                <PropertiesPanel />
            </div>
            <ProjectGallery />
        </div>
    );
};
