import React, { useEffect, useRef, useState } from 'react';
import { useBannerStore } from '../store/bannerStore';
import { Save, Clock, Edit2, Check, Download, LayoutGrid, ChevronDown, ChevronUp } from 'lucide-react';
import { bannerBloomMarkUrl } from '../lib/brandAssets';

interface SaveBarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const SaveBar: React.FC<SaveBarProps> = ({ isCollapsed, onToggleCollapse }) => {
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
  const [lastSavedLabel, setLastSavedLabel] = useState('Never');
  const hasTrackedChanges = useRef(false);

  useEffect(() => {
    const checkInitialProjects = async () => {
      const projects = await useBannerStore.getState().getAllProjects();

      if (projects.length === 0) {
        return;
      }

      if (projects.length === 1) {
        loadFromLocalStorage();
        return;
      }

      setShowGallery(true);
    };

    checkInitialProjects();
  }, [loadFromLocalStorage, setShowGallery]);

  useEffect(() => {
    const interval = setInterval(() => {
      saveCurrentProject();
      setSaveStatus('saved');
    }, 30000);

    return () => clearInterval(interval);
  }, [saveCurrentProject]);

  const elements = useBannerStore((state) => state.elements);
  const overrides = useBannerStore((state) => state.overrides);
  const background = useBannerStore((state) => state.background);
  const bannerPresetId = useBannerStore((state) => state.bannerPresetId);

  useEffect(() => {
    if (!hasTrackedChanges.current) {
      hasTrackedChanges.current = true;
      return;
    }

    const unsavedTimeout = setTimeout(() => {
      setSaveStatus('unsaved');
    }, 0);

    const timeout = setTimeout(() => {
      setSaveStatus('saving');
      saveCurrentProject();
      setTimeout(() => setSaveStatus('saved'), 500);
    }, 2000);

    return () => {
      clearTimeout(unsavedTimeout);
      clearTimeout(timeout);
    };
  }, [elements, overrides, background, bannerPresetId, saveCurrentProject]);

  useEffect(() => {
    const updateLastSavedLabel = () => {
      if (!lastSaved) {
        setLastSavedLabel('Never');
        return;
      }

      const diff = Date.now() - lastSaved;

      if (diff < 60000) {
        setLastSavedLabel('Just now');
        return;
      }

      if (diff < 3600000) {
        setLastSavedLabel(`${Math.floor(diff / 60000)}m ago`);
        return;
      }

      if (diff < 86400000) {
        setLastSavedLabel(`${Math.floor(diff / 3600000)}h ago`);
        return;
      }

      setLastSavedLabel(new Date(lastSaved).toLocaleDateString());
    };

    updateLastSavedLabel();

    if (!lastSaved) {
      return;
    }

    const interval = setInterval(updateLastSavedLabel, 60000);

    return () => clearInterval(interval);
  }, [lastSaved]);

  const handleSaveClick = () => {
    setSaveStatus('saving');
    saveCurrentProject();
    setTimeout(() => setSaveStatus('saved'), 500);
  };

  const handleNameSubmit = () => {
    if (!tempName.trim()) {
      return;
    }

    setProjectName(tempName.trim());
    setIsEditingName(false);
    saveCurrentProject();
  };

  if (isCollapsed) {
    return (
      <div className="studio-topbar mx-3 mt-3 rounded-[1.25rem] border px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Campaign
            </div>
            <div className="truncate text-sm font-semibold text-slate-900">{projectName}</div>
          </div>
          <button
            onClick={onToggleCollapse}
            className="studio-panel-toggle"
            title="Expand top bar"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="studio-topbar mx-3 mt-3 flex items-center justify-between gap-4 rounded-[1.35rem] border px-5 py-2.5">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex shrink-0 items-center gap-3 rounded-[1.15rem] border border-white/70 bg-white/75 px-3 py-2 shadow-sm">
          <img src={bannerBloomMarkUrl} alt="BannerBloom" className="h-10 w-10 rounded-xl" />
          <div>
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
              BannerBloom
            </div>
            <div className="text-sm font-semibold text-slate-900">Create once. Deploy everywhere.</div>
          </div>
        </div>

        {isEditingName ? (
          <div className="flex min-w-0 items-center gap-2">
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
              className="studio-input px-4 py-2 text-lg font-semibold"
            />
            <button onClick={handleNameSubmit} className="studio-button-primary p-2">
              <Check className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setIsEditingName(true);
              setTempName(projectName);
            }}
            className="group flex min-w-0 items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-left transition-colors hover:border-slate-200 hover:bg-white/75"
          >
            <div className="min-w-0">
              <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Campaign
              </div>
              <h1 className="truncate text-xl font-bold text-slate-900">{projectName}</h1>
            </div>
            <Edit2 className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
          </button>
        )}

        <div className="flex items-center gap-2 text-sm">
          {saveStatus === 'saving' ? (
            <div className="studio-pill studio-pill-primary">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-600" />
              <span>Saving...</span>
            </div>
          ) : saveStatus === 'saved' ? (
            <div className="studio-pill studio-pill-success">
              <Check className="h-4 w-4" />
              <span>Saved</span>
            </div>
          ) : (
            <div className="studio-pill studio-pill-warning">
              <Clock className="h-4 w-4" />
              <span>Unsaved changes</span>
            </div>
          )}
          <span className="text-sm text-slate-500">Last saved {lastSavedLabel}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={onToggleCollapse}
          className="studio-panel-toggle"
          title="Collapse top bar"
        >
          <ChevronUp className="h-4 w-4" />
        </button>

        <button
          onClick={() => setShowGallery(true)}
          className="studio-button-ghost group relative flex items-center gap-2 px-4 py-2.5"
          title="Open campaign library (Ctrl+H)"
        >
          <LayoutGrid className="h-4 w-4" />
          Library
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-500 group-hover:bg-slate-200">
            Ctrl+H
          </span>
        </button>

        <button
          onClick={handleSaveClick}
          className="studio-button-primary flex items-center gap-2 px-4 py-2.5"
        >
          <Save className="h-4 w-4" />
          Save
        </button>

        <button
          onClick={saveProject}
          className="studio-button-ghost flex items-center gap-2 px-4 py-2.5"
          title="Export campaign backup"
        >
          <Download className="h-4 w-4" />
          Export backup
        </button>
      </div>
    </div>
  );
};
