import React, { useRef, useState } from 'react';
import { useBannerStore } from '../store/bannerStore';
import { LayersPanel } from './LayersPanel';
import { LogoPanel } from './LogoPanel';
import { CTAPanel } from './CTAPanel';
import { LayoutGrid, Home } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const addElement = useBannerStore((state) => state.addElement);
  const loadProject = useBannerStore((state) => state.loadProject);
  const setShowGallery = useBannerStore((state) => state.setShowGallery);
  const getAllProjects = useBannerStore((state) => state.getAllProjects);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const [selectedShapeType, setSelectedShapeType] = useState<'rectangle' | 'circle' | 'rounded-rectangle' | 'button'>('rectangle');

  const projectsCount = getAllProjects().length;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const img = new Image();
          img.onload = () => {
            addElement('image', e.target?.result as string, undefined, {
              width: img.naturalWidth,
              height: img.naturalHeight
            });
          };
          img.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleAddShape = () => {
    if (selectedShapeType === 'button') {
      addElement('button', 'Click Me');
    } else {
      addElement('shape', '#3b82f6', selectedShapeType);
    }
  };

  const handleProjectLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          loadProject(e.target.result as string);
        }
      };
      reader.readAsText(file);
    }
    if (event.target) event.target.value = '';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full z-10 shadow-sm">
      <div className="p-4 flex flex-col h-full overflow-hidden">
        {/* Dashboard/Home Button - Fixed at Top */}
        <div className="flex-shrink-0 mb-4">
          <button
            onClick={() => setShowGallery(true)}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] flex items-center justify-center gap-2 relative group"
            title="Open Projects Dashboard (⌘+H or Ctrl+H)"
          >
            <Home className="w-5 h-5" />
            <span>Projects Dashboard</span>
            <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              ⌘H
            </span>
          </button>
          {projectsCount > 0 && (
            <div className="mt-2 text-center">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                <LayoutGrid className="w-3 h-3" />
                {projectsCount} project{projectsCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Import Section - Fixed */}
        <div className="flex-shrink-0 mb-4">
          <h3 className="text-sm font-bold text-black uppercase tracking-wide mb-3">Import</h3>
          <input
            type="file"
            ref={projectInputRef}
            onChange={handleProjectLoad}
            accept=".bsp,.json"
            className="hidden"
          />
          <button
            onClick={() => projectInputRef.current?.click()}
            className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-md text-xs font-bold transition-colors shadow-sm"
          >
            📁 Import Project File
          </button>
          <p className="text-[10px] text-gray-500 mt-1 text-center">Load .bsp file</p>
        </div>

        {/* Elements Section - Fixed */}
        <div className="flex-shrink-0 border-t border-gray-200 pt-4 mb-4">
          <h3 className="text-sm font-bold text-black uppercase tracking-wide mb-3">Elements</h3>
          <div className="space-y-3">
            <button
              onClick={() => addElement('text', 'New Text')}
              className="w-full text-left px-4 py-3 bg-white border border-gray-300 hover:bg-gray-50 rounded-md text-black font-medium transition-colors shadow-sm"
            >
              Add Text
            </button>

            <div className="flex gap-2">
              <select
                value={selectedShapeType}
                onChange={(e) => setSelectedShapeType(e.target.value as typeof selectedShapeType)}
                className="flex-1 p-2 bg-white border border-gray-300 rounded-md text-sm text-black font-medium shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                <option value="rectangle">Rectangle</option>
                <option value="circle">Circle</option>
                <option value="rounded-rectangle">Rounded Rect</option>
                <option value="button">Button</option>
              </select>
              <button
                onClick={handleAddShape}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                Add
              </button>
            </div>

            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-left px-4 py-3 bg-white border border-gray-300 hover:bg-gray-50 rounded-md text-black font-medium transition-colors shadow-sm"
              >
                Upload Image
              </button>
            </div>
          </div>
        </div>

        {/* Logo Section - Fixed */}
        <LogoPanel />

        {/* CTA Section - Fixed */}
        <CTAPanel />

        {/* Layers Section - Flexible, takes remaining space */}
        <div className="flex-1 border-t border-gray-200 pt-4 min-h-0 flex flex-col">
          <LayersPanel />
        </div>
      </div>
    </div>
  );
};
