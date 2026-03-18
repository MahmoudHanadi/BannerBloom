import React from 'react';
import { SaveBar } from './SaveBar';
import { Sidebar } from './Sidebar';
import { CanvasArea } from './CanvasArea';
import { PropertiesPanel } from './PropertiesPanel';
import { ExportPanel } from './ExportPanel';
import { ProjectGallery } from './ProjectGallery';
import { WelcomeSplash } from './WelcomeSplash';
import { useBannerStore } from '../store/bannerStore';

export const Layout: React.FC = () => {
    const setShowGallery = useBannerStore((state) => state.setShowGallery);
    const [isTopbarCollapsed, setIsTopbarCollapsed] = React.useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
    const [isInspectorCollapsed, setIsInspectorCollapsed] = React.useState(false);
    const [showWelcomeSplash, setShowWelcomeSplash] = React.useState(() => {
        if (typeof window === 'undefined') {
            return true;
        }

        return window.sessionStorage.getItem('bannerbloom-launch-splash-dismissed') !== 'true';
    });

    const handleEnterLibrary = React.useCallback(() => {
        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('bannerbloom-launch-splash-dismissed', 'true');
        }

        setShowGallery(true);
        setShowWelcomeSplash(false);
    }, [setShowGallery]);

    return (
        <div className="studio-shell flex h-screen min-h-0 w-screen flex-col overflow-hidden text-slate-900">
            <SaveBar
                isCollapsed={isTopbarCollapsed}
                onToggleCollapse={() => setIsTopbarCollapsed((current) => !current)}
            />
            <div className="studio-workspace relative flex min-h-0 flex-1 overflow-hidden pt-2">
                <Sidebar
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
                />
                <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-[1.4rem] border border-white/40 bg-white/35 shadow-[0_16px_48px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                    <CanvasArea />
                    <ExportPanel />
                </div>
                <PropertiesPanel
                    isCollapsed={isInspectorCollapsed}
                    onToggleCollapse={() => setIsInspectorCollapsed((current) => !current)}
                />
            </div>
            <ProjectGallery />
            {showWelcomeSplash && <WelcomeSplash onEnterLibrary={handleEnterLibrary} />}
        </div>
    );
};
