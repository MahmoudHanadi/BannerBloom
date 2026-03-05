import React, { useState, useEffect } from 'react';
import { useBannerStore } from '../store/bannerStore';
import { Save, Clock, Edit2, Check, Download, LayoutGrid } from 'lucide-react';

export const SaveBar: React.FC = () => {
  const projectName = useBannerStore((state) => state.projectName);
  const lastSaved = useBannerStore((state) => state.lastSaved);
  const setProjectName = useBannerStore((state) => state.setProjectName);
  const saveCurrentProject = useBannerStore((state) => state.saveCurrentProject);
  const loadFromLocalStorage = useBannerStore((state) => state.loadFromLocalStorage);
  const saveProject = useBannerStore((state) => state.saveProject);
  const setShowGallery = useBannerStore((state) => state.setShowGallery);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(projectName);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Load from localStorage on mount - show gallery if multiple projects exist
  useEffect(() => {
    const checkInitialProjects = async () => {
      const projects = await useBannerStore.getState().getAllProjects();

      if (projects.length === 0) {
        // No projects - stay in editor with default project
      } else if (projects.length === 1) {
        // Only one project - load it directly
        loadFromLocalStorage();
      } else {
        // Multiple projects - show gallery (home page)
        setShowGallery(true);
      }
    };
    checkInitialProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveCurrentProject();
      setSaveStatus('saved');
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [saveCurrentProject]);

  // Track changes for unsaved indicator
  const elements = useBannerStore((state) => state.elements);
  const background = useBannerStore((state) => state.background);
  const logo = useBannerStore((state) => state.logo);
  const cta = useBannerStore((state) => state.cta);

  useEffect(() => {
    setSaveStatus('unsaved');

    // Debounce auto-save on changes
    const timeout = setTimeout(() => {
      setSaveStatus('saving');
      saveCurrentProject();
      setTimeout(() => setSaveStatus('saved'), 500);
    }, 2000); // Wait 2 seconds after last change

    return () => clearTimeout(timeout);
  }, [elements, background, logo, cta, saveCurrentProject]);

  const handleSaveClick = () => {
    setSaveStatus('saving');
    saveCurrentProject();
    setTimeout(() => setSaveStatus('saved'), 500);
  };

  const handleNameSubmit = () => {
    if (tempName.trim()) {
      setProjectName(tempName.trim());
      setIsEditingName(false);
      saveCurrentProject();
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return 'Never';
    const now = Date.now();
    const diff = now - lastSaved;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(lastSaved).toLocaleDateString();
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm px-6 py-3 flex items-center justify-between">
      {/* Project Name */}
      <div className="flex items-center gap-3">
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit();
                if (e.key === 'Escape') {
                  setTempName(projectName);
                  setIsEditingName(false);
                }
              }}
              autoFocus
              className="px-3 py-1 border border-blue-500 rounded-md text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleNameSubmit}
              className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setIsEditingName(true);
              setTempName(projectName);
            }}
            className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 rounded-md transition-colors group"
          >
            <h1 className="text-lg font-semibold text-gray-800">{projectName}</h1>
            <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </button>
        )}

        {/* Save Status */}
        <div className="flex items-center gap-2 text-sm">
          {saveStatus === 'saving' ? (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              <span>Saving...</span>
            </div>
          ) : saveStatus === 'saved' ? (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-4 h-4" />
              <span>Saved</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-orange-600">
              <Clock className="w-4 h-4" />
              <span>Unsaved changes</span>
            </div>
          )}
          <span className="text-gray-400">•</span>
          <span className="text-gray-500">{formatLastSaved()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowGallery(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors shadow-sm relative group"
          title="View all projects (⌘+H or Ctrl+H)"
        >
          <LayoutGrid className="w-4 h-4" />
          My Projects
          <span className="ml-1 text-xs opacity-70 group-hover:opacity-100">⌘H</span>
        </button>

        <button
          onClick={handleSaveClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" />
          Save
        </button>

        <button
          onClick={saveProject}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-md font-medium transition-colors"
          title="Export project file"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>
    </div>
  );
};
