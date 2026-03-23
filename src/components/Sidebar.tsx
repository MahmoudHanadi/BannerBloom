import React, { useEffect, useRef, useState } from 'react';
import { getBannerPreset, bannerPresets } from '../config/bannerPresets';
import { useBannerStore } from '../store/bannerStore';
import { LayersPanel } from './LayersPanel';
import {
  ChevronDown,
  ChevronRight,
  Circle,
  FolderUp,
  Home,
  ImagePlus,
  LayoutGrid,
  MousePointer,
  PanelLeftClose,
  PanelLeftOpen,
  Shapes,
  Square,
  Target,
  Type,
} from 'lucide-react';
import type { BannerPresetId } from '../types/banner';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const addElement = useBannerStore((state) => state.addElement);
  const loadProject = useBannerStore((state) => state.loadProject);
  const addImageElementFromBlob = useBannerStore((state) => state.addImageElementFromBlob);
  const bannerPresetId = useBannerStore((state) => state.bannerPresetId);
  const bannerSizes = useBannerStore((state) => state.bannerSizes);
  const setShowGallery = useBannerStore((state) => state.setShowGallery);
  const setBannerPreset = useBannerStore((state) => state.setBannerPreset);
  const getAllProjects = useBannerStore((state) => state.getAllProjects);
  const showGallery = useBannerStore((state) => state.showGallery);
  const elementsCount = useBannerStore((state) => state.elements.length);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  const [projectsCount, setProjectsCount] = useState(0);
  const [openSections, setOpenSections] = useState({
    target: true,
    workspace: true,
    elements: true,
    layers: true,
  });
  const currentPreset = getBannerPreset(bannerPresetId);

  useEffect(() => {
    getAllProjects().then((projects) => setProjectsCount(projects.length));
  }, [getAllProjects, showGallery]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void addImageElementFromBlob(file, file.name);
    }

    event.target.value = '';
  };

  const handleAddShape = (shapeType: 'rectangle' | 'circle' | 'rounded-rectangle') => {
    addElement('shape', '#19C37D', shapeType);
  };

  const handleProjectLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) {
          void loadProject(loadEvent.target.result as string);
        }
      };
      reader.readAsText(file);
    }

    event.target.value = '';
  };

  const toggleSection = (section: 'target' | 'workspace' | 'elements' | 'layers') => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  if (isCollapsed) {
    return (
      <div className="studio-sidebar studio-sidebar-collapsed flex h-full min-h-0 flex-col items-center justify-start gap-5 overflow-hidden rounded-[1.35rem] border px-2 py-3">
        <button
          onClick={onToggleCollapse}
          className="studio-panel-toggle"
          title="Expand left menu"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
        <div className="studio-collapsed-rail-label">Create</div>
      </div>
    );
  }

  return (
    <div className="studio-sidebar flex h-full min-h-0 flex-col overflow-hidden rounded-[1.35rem] border">
      <div className="studio-sidebar-header flex items-start justify-between gap-3 border-b border-slate-200/70 px-4 pb-4 pt-4">
        <div className="min-w-0">
          <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Creative system
          </div>
          <div className="mt-1 text-base font-semibold text-slate-800">Build campaign</div>
          <p className="studio-sidebar-header-note">
            Keep tools close while you move around the canvas.
          </p>
        </div>
        <button
          onClick={onToggleCollapse}
          className="studio-panel-toggle"
          title="Collapse left menu"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="studio-sidebar-scroll flex h-full flex-col overflow-y-auto px-4 py-4 pr-3">
        <div className="studio-section-card studio-sidebar-card shrink-0 studio-sidebar-hero rounded-[1.25rem]">
          <button
            type="button"
            onClick={() => toggleSection('target')}
            className="studio-sidebar-section-toggle"
            aria-expanded={openSections.target}
          >
              {openSections.target ? (
                <div>
                  <div className="studio-section-label !mb-1">Targets</div>
                  <h2 className="text-lg font-bold text-slate-900">Deployment targets</h2>
                </div>
              ) : (
                <div className="studio-sidebar-section-summary">
                  <span className="studio-sidebar-section-kicker">Targets</span>
                  <span className="studio-sidebar-section-title">Deployment targets</span>
                </div>
              )}
            <span className="studio-sidebar-section-toggle-meta">
              <span className="studio-pill studio-pill-primary">
                <LayoutGrid className="h-3.5 w-3.5" />
                {bannerSizes.length} sizes
              </span>
              {openSections.target ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
            </span>
          </button>

          {openSections.target && (
            <>
              <p className="mt-3 text-sm text-slate-500">
                Choose the placements you need before you start composing or exporting outputs.
              </p>

              <div className="mt-3 studio-sidebar-metrics">
                <span className="studio-pill studio-pill-neutral">{projectsCount} campaigns</span>
                <span className="studio-pill studio-pill-neutral">
                  {currentPreset.supportedExportTypes.join(' / ').toUpperCase()}
                </span>
              </div>

              <label htmlFor="banner-target-select" className="studio-field-label">
                Preset selection
              </label>
              <div className="studio-target-picker">
                <span className="studio-target-icon">
                  <Target className="h-4 w-4" />
                </span>
                <select
                  id="banner-target-select"
                  value={bannerPresetId}
                  onChange={(event) => setBannerPreset(event.target.value as BannerPresetId)}
                  className="studio-select px-3 py-2.5 text-sm font-medium"
                >
                  {Object.values(bannerPresets).map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="studio-target-description">{currentPreset.description}</p>
            </>
          )}
        </div>

        <div className="studio-section-card studio-sidebar-card shrink-0 rounded-[1.25rem]">
          <button
            type="button"
            onClick={() => toggleSection('workspace')}
            className="studio-sidebar-section-toggle"
            aria-expanded={openSections.workspace}
          >
            {openSections.workspace ? (
              <div>
                <div className="studio-section-label !mb-1">Campaigns</div>
                <h3 className="text-base font-bold text-slate-900">Campaign files</h3>
              </div>
            ) : (
              <div className="studio-sidebar-section-summary">
                <span className="studio-sidebar-section-kicker">Campaigns</span>
                <span className="studio-sidebar-section-title">Campaign files</span>
              </div>
            )}
            {openSections.workspace ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {openSections.workspace && (
            <>
              <input
                type="file"
                ref={projectInputRef}
                onChange={handleProjectLoad}
                accept=".bsp,.json"
                className="hidden"
              />
              <div className="studio-sidebar-actions mt-4">
                <button
                  onClick={() => setShowGallery(true)}
                  className="studio-sidebar-action studio-sidebar-action-primary"
                  title="Open campaign library (Ctrl+H)"
                >
                  <span className="studio-sidebar-action-icon">
                    <Home className="h-4 w-4" />
                  </span>
                  <span className="studio-sidebar-action-copy">
                    <span className="studio-sidebar-action-title">Campaign library</span>
                    <span className="studio-sidebar-action-subtitle">
                      Open saved work and recent campaigns.
                    </span>
                  </span>
                  <ChevronRight className="studio-sidebar-action-chevron h-4 w-4" />
                </button>
                <button
                  onClick={() => projectInputRef.current?.click()}
                  className="studio-sidebar-action"
                >
                  <span className="studio-sidebar-action-icon studio-sidebar-action-icon-secondary">
                    <FolderUp className="h-4 w-4" />
                  </span>
                  <span className="studio-sidebar-action-copy">
                    <span className="studio-sidebar-action-title">Import campaign file</span>
                    <span className="studio-sidebar-action-subtitle">
                      Load a `.bsp` or `.json` file into the current workspace.
                    </span>
                  </span>
                  <ChevronRight className="studio-sidebar-action-chevron h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="studio-section-card studio-sidebar-card shrink-0 rounded-[1.25rem]">
          <button
            type="button"
            onClick={() => toggleSection('elements')}
            className="studio-sidebar-section-toggle"
            aria-expanded={openSections.elements}
          >
              {openSections.elements ? (
                <div>
                  <div className="studio-section-label !mb-1">Elements</div>
                  <h3 className="text-base font-bold text-slate-900">Add elements</h3>
                </div>
              ) : (
                <div className="studio-sidebar-section-summary">
                  <span className="studio-sidebar-section-kicker">Elements</span>
                  <span className="studio-sidebar-section-title">Add elements</span>
                </div>
              )}
              <span className="studio-sidebar-section-toggle-meta">
                {openSections.elements && <span className="studio-pill studio-pill-neutral">Text & images</span>}
                {openSections.elements ? (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
            </span>
          </button>

          {openSections.elements && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="mt-3 studio-tool-grid">
                <button
                  onClick={() => addElement('text', 'Headline')}
                  className="studio-tool-button studio-tool-button-wide"
                >
                  <span className="studio-tool-icon bg-emerald-50 text-emerald-700">
                    <Type className="h-4 w-4" />
                  </span>
                  <span className="studio-tool-copy">
                    <span className="studio-tool-title">Add text</span>
                    <span className="studio-tool-subtitle">Headlines, labels, or product copy.</span>
                  </span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="studio-tool-button studio-tool-button-wide"
                >
                  <span className="studio-tool-icon bg-emerald-50 text-emerald-700">
                    <ImagePlus className="h-4 w-4" />
                  </span>
                  <span className="studio-tool-copy">
                    <span className="studio-tool-title">Upload image</span>
                    <span className="studio-tool-subtitle">Place logos, products, or photography.</span>
                  </span>
                </button>
                <button
                  onClick={() => handleAddShape('rectangle')}
                  className="studio-tool-button"
                >
                  <span className="studio-tool-icon bg-slate-100 text-slate-700">
                    <Square className="h-4 w-4" />
                  </span>
                  <span className="studio-tool-copy">
                    <span className="studio-tool-title">Rectangle</span>
                    <span className="studio-tool-subtitle">Hard-edged block.</span>
                  </span>
                </button>
                <button
                  onClick={() => handleAddShape('circle')}
                  className="studio-tool-button"
                >
                  <span className="studio-tool-icon bg-teal-50 text-teal-700">
                    <Circle className="h-4 w-4" />
                  </span>
                  <span className="studio-tool-copy">
                    <span className="studio-tool-title">Circle</span>
                    <span className="studio-tool-subtitle">Badges and highlights.</span>
                  </span>
                </button>
                <button
                  onClick={() => handleAddShape('rounded-rectangle')}
                  className="studio-tool-button"
                >
                  <span className="studio-tool-icon bg-amber-50 text-amber-700">
                    <Shapes className="h-4 w-4" />
                  </span>
                  <span className="studio-tool-copy">
                    <span className="studio-tool-title">Rounded card</span>
                    <span className="studio-tool-subtitle">Soft-corner panel.</span>
                  </span>
                </button>
                <button
                  onClick={() => addElement('button', 'Call to action')}
                  className="studio-tool-button"
                >
                  <span className="studio-tool-icon bg-emerald-100 text-emerald-800">
                    <MousePointer className="h-4 w-4" />
                  </span>
                  <span className="studio-tool-copy">
                    <span className="studio-tool-title">CTA</span>
                    <span className="studio-tool-subtitle">Clickable call-to-action.</span>
                  </span>
                </button>
              </div>
            </>
          )}
        </div>

        <div
          className={`studio-section-card studio-sidebar-card rounded-[1.25rem] ${
            openSections.layers ? 'studio-layers-card flex min-h-[180px] flex-1 flex-col' : ''
          }`}
        >
          <button
            type="button"
            onClick={() => toggleSection('layers')}
            className="studio-sidebar-section-toggle"
            aria-expanded={openSections.layers}
          >
              {openSections.layers ? (
                <div>
                  <div className="studio-section-label !mb-1">Layers</div>
                  <h3 className="text-base font-bold text-slate-900">Layer stack</h3>
                </div>
              ) : (
                <div className="studio-sidebar-section-summary">
                  <span className="studio-sidebar-section-kicker">Layers</span>
                  <span className="studio-sidebar-section-title">Layer stack</span>
                </div>
              )}
            <span className="studio-sidebar-section-toggle-meta">
              <span className="studio-pill studio-pill-neutral">{elementsCount}</span>
              {openSections.layers ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
            </span>
          </button>

          {openSections.layers && (
            <div className="mt-3 min-h-0 flex-1">
              <LayersPanel showHeader={false} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
