import React, { useState, useEffect } from 'react';
import { useBannerStore } from '../store/bannerStore';
import { Plus, FolderOpen, MoreVertical, Trash2, Copy, Edit2, X, Clock, Folder, FolderPlus, ChevronDown, ChevronRight, Move } from 'lucide-react';
import type { ProjectSummary, Folder as FolderType } from '../store/bannerStore';
import { bannerBloomMarkUrl } from '../lib/brandAssets';

export const ProjectGallery: React.FC = () => {
  const showGallery = useBannerStore((state) => state.showGallery);
  const setShowGallery = useBannerStore((state) => state.setShowGallery);
  const getAllProjects = useBannerStore((state) => state.getAllProjects);
  const getAllFolders = useBannerStore((state) => state.getAllFolders);
  const loadProjectById = useBannerStore((state) => state.loadProjectById);
  const createNewProject = useBannerStore((state) => state.createNewProject);
  const deleteProject = useBannerStore((state) => state.deleteProject);
  const duplicateProject = useBannerStore((state) => state.duplicateProject);
  const renameProject = useBannerStore((state) => state.renameProject);
  const createFolder = useBannerStore((state) => state.createFolder);
  const renameFolder = useBannerStore((state) => state.renameFolder);
  const deleteFolder = useBannerStore((state) => state.deleteFolder);
  const moveProjectToFolder = useBannerStore((state) => state.moveProjectToFolder);

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectFolderId, setNewProjectFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState('');
  const [renamingType, setRenamingType] = useState<'project' | 'folder'>('project');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [movingProjectId, setMovingProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (showGallery) {
      Promise.all([getAllProjects(), getAllFolders()]).then(([allProjects, allFolders]) => {
        setProjects(allProjects.sort((a, b) => b.lastModified - a.lastModified));
        setFolders(allFolders.sort((a, b) => a.name.localeCompare(b.name)));
        // Auto-expand all folders by default
        setExpandedFolders(new Set(allFolders.map(f => f.id)));
      });
    }
  }, [showGallery, getAllProjects, getAllFolders]);

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      await createNewProject(newProjectName.trim(), newProjectFolderId || undefined);
      setNewProjectName('');
      setNewProjectFolderId(null);
      setShowNewProjectDialog(false);
      setShowGallery(false);
    }
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await createFolder(newFolderName.trim());
      const allFolders = await getAllFolders();
      setFolders(allFolders.sort((a, b) => a.name.localeCompare(b.name)));
      setNewFolderName('');
      setShowNewFolderDialog(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleOpenProject = (id: string) => {
    loadProjectById(id);
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      await deleteProject(id);
      const allProjects = await getAllProjects();
      setProjects(allProjects.sort((a, b) => b.lastModified - a.lastModified));
    }
    setActiveMenu(null);
  };

  const handleDuplicateProject = async (id: string) => {
    await duplicateProject(id);
    const allProjects = await getAllProjects();
    setProjects(allProjects.sort((a, b) => b.lastModified - a.lastModified));
    setActiveMenu(null);
  };

  const handleStartRename = (id: string, currentName: string, type: 'project' | 'folder') => {
    setRenamingId(id);
    setRenamingValue(currentName);
    setRenamingType(type);
    setActiveMenu(null);
  };

  const handleFinishRename = async (id: string) => {
    if (renamingValue.trim()) {
      if (renamingType === 'project') {
        await renameProject(id, renamingValue.trim());
        const allProjects = await getAllProjects();
        setProjects(allProjects.sort((a, b) => b.lastModified - a.lastModified));
      } else {
        await renameFolder(id, renamingValue.trim());
        const allFolders = await getAllFolders();
        setFolders(allFolders.sort((a, b) => a.name.localeCompare(b.name)));
      }
    }
    setRenamingId(null);
  };

  const handleDeleteFolder = async (id: string, name: string) => {
    if (confirm(`Delete folder "${name}"? All campaigns in this folder will be moved to "All Campaigns".`)) {
      await deleteFolder(id);
      const allFolders = await getAllFolders();
      const allProjects = await getAllProjects();
      setFolders(allFolders.sort((a, b) => a.name.localeCompare(b.name)));
      setProjects(allProjects.sort((a, b) => b.lastModified - a.lastModified));
    }
    setActiveMenu(null);
  };

  const handleMoveProject = async (projectId: string, folderId: string | null) => {
    await moveProjectToFolder(projectId, folderId);
    const allProjects = await getAllProjects();
    setProjects(allProjects.sort((a, b) => b.lastModified - a.lastModified));
    setMovingProjectId(null);
    setActiveMenu(null);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderProjectCard = (project: ProjectSummary) => (
    <div
      key={project.id}
      className="studio-gallery-card group overflow-hidden rounded-[1.25rem] transition-all hover:border-emerald-300"
    >
      {/* Thumbnail */}
      <div
        className="relative flex h-48 cursor-pointer items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50"
        onClick={() => handleOpenProject(project.id)}
      >
        {project.thumbnail ? (
          <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
              <FolderOpen className="w-8 h-8 text-white" />
            </div>
            <p className="text-sm font-medium text-gray-600">{project.elementCount ?? 0} element{project.elementCount === 1 ? '' : 's'}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Info */}
      <div className="p-5 bg-gradient-to-br from-white to-gray-50">
        {renamingId === project.id && renamingType === 'project' ? (
          <input
            type="text"
            value={renamingValue}
            onChange={(e) => setRenamingValue(e.target.value)}
            onBlur={() => handleFinishRename(project.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFinishRename(project.id);
              if (e.key === 'Escape') setRenamingId(null);
            }}
            autoFocus
            className="w-full px-3 py-2 border-2 border-emerald-500 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        ) : (
          <div>
            <h3
              className="font-bold text-gray-900 cursor-pointer hover:text-emerald-700 transition-colors text-base mb-2"
              onClick={() => handleOpenProject(project.id)}
              title={project.name}
            >
              {project.name}
            </h3>

            <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-500 font-medium">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(project.lastModified)}
            </div>

            {/* Action Buttons - Always Visible */}
            <div className="flex gap-2">
              <button
                onClick={() => handleOpenProject(project.id)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                Open
              </button>
              <button
                onClick={() => handleStartRename(project.id, project.name, 'project')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-medium transition-colors"
                title="Rename"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMovingProjectId(project.id)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-medium transition-colors"
                title="Move to Folder"
              >
                <Move className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveMenu(activeMenu === project.id ? null : project.id)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-medium transition-colors"
                title="More Options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Dropdown Menu for More Options */}
            {activeMenu === project.id && (
              <div className="mt-2 bg-white rounded-lg shadow-xl border-2 border-gray-200 py-1.5 z-10">
                <button
                  onClick={() => handleDuplicateProject(project.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <div className="border-t border-gray-200 my-1" />
                <button
                  onClick={() => handleDeleteProject(project.id, project.name)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Project
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const currentProjectId = useBannerStore((state) => state.currentProjectId);
  const hasActiveProject = currentProjectId !== null;

  if (!showGallery) return null;

  const uncategorizedProjects = projects.filter(p => !p.folderId);

  return (
    <div className="studio-gallery fixed inset-0 z-[10000] flex items-stretch justify-stretch overflow-hidden">
      <div className="studio-gallery-shell flex h-full min-h-full w-full flex-col">
        {/* Header */}
        <div className="studio-gallery-header flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/70 bg-white/70 p-6 backdrop-blur-xl">
          <div className="studio-gallery-header__meta flex min-w-0 flex-wrap items-center gap-4">
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3 text-white shadow-lg">
              <img src={bannerBloomMarkUrl} alt="BannerBloom" className="h-7 w-7 rounded-lg bg-white/20 p-0.5" />
            </div>
            <div>
              <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Campaign library
              </div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-teal-700">
                BannerBloom
              </h2>
              <p className="mt-0.5 text-sm font-medium text-slate-600">Create once. Deploy everywhere.</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {projects.length === 0
                  ? 'Turn one creative into every banner size, format, and placement.'
                  : `${projects.length} campaign${projects.length !== 1 ? 's' : ''} | ${folders.length} folder${folders.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
          <div className="studio-gallery-header__actions flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowNewFolderDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all shadow-sm"
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </button>
            <button
              onClick={() => setShowNewProjectDialog(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              New Campaign
            </button>
            {hasActiveProject && (
              <button
                onClick={() => setShowGallery(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to editor"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Projects Grid with Folders */}
        <div className="studio-gallery-content flex-1 overflow-y-auto p-8">
          {projects.length === 0 && folders.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="studio-empty-state max-w-xl px-10 py-12 text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 shadow-lg">
                  <img src={bannerBloomMarkUrl} alt="BannerBloom" className="h-12 w-12 rounded-2xl" />
                </div>
                <div className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">BannerBloom</div>
                <h3 className="mb-3 text-2xl font-bold text-slate-900">Create once. Deploy everywhere.</h3>
                <p className="mb-6 text-slate-600">
                  Turn one creative into every banner size, format, and placement.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowNewFolderDialog(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    <FolderPlus className="w-5 h-5" />
                    Create Folder
                  </button>
                  <button
                    onClick={() => setShowNewProjectDialog(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                    Start a Campaign
                  </button>
                </div>
                <div className="mt-8 grid grid-cols-3 gap-4 text-sm text-slate-500">
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Organize</div>
                    Folder-based project groups
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Protect</div>
                    Auto-save your work
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Deploy</div>
                    Scale one creative across placements
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* All Projects (uncategorized) */}
              {uncategorizedProjects.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4 px-2 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                    <FolderOpen className="w-6 h-6 text-gray-600" />
                    <h3 className="text-lg font-bold text-gray-700 flex-1">All Campaigns</h3>
                    <span className="px-2.5 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full">
                      {uncategorizedProjects.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {uncategorizedProjects.map((project) => renderProjectCard(project))}
                  </div>
                </div>
              )}

              {/* Folders with their projects */}
              {folders.map((folder) => {
                const folderProjects = projects.filter(p => p.folderId === folder.id);
                const isExpanded = expandedFolders.has(folder.id);

                return (
                  <div key={folder.id}>
                    <div className="flex items-center gap-3 mb-4 px-2 py-3 bg-white/50 rounded-lg border border-gray-200">
                      <button
                        onClick={() => toggleFolder(folder.id)}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                        title={isExpanded ? "Collapse folder" : "Expand folder"}
                      >
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-600" /> : <ChevronRight className="w-5 h-5 text-gray-600" />}
                      </button>
                      <Folder className="w-6 h-6" style={{ color: folder.color || '#19C37D' }} />

                      {renamingId === folder.id && renamingType === 'folder' ? (
                        <input
                          type="text"
                          value={renamingValue}
                          onChange={(e) => setRenamingValue(e.target.value)}
                          onBlur={() => handleFinishRename(folder.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleFinishRename(folder.id);
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          autoFocus
                          className="px-3 py-1.5 border-2 border-emerald-500 rounded-lg text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 flex-1"
                        />
                      ) : (
                        <h3 className="text-lg font-bold text-gray-700 flex-1">{folder.name}</h3>
                      )}

                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                        {folderProjects.length}
                      </span>

                      {/* Folder Action Buttons - Always Visible */}
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={() => handleStartRename(folder.id, folder.name, 'folder')}
                          className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5"
                          title="Rename folder"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Rename
                        </button>
                        <button
                          onClick={() => handleDeleteFolder(folder.id, folder.name)}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5"
                          title="Delete folder"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>

                    {isExpanded && folderProjects.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {folderProjects.map((project) => renderProjectCard(project))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* New Project Dialog */}
      {showNewProjectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Campaign</h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject();
                if (e.key === 'Escape') setShowNewProjectDialog(false);
              }}
              placeholder="Campaign name..."
              autoFocus
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none mb-4"
            />
            {folders.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Folder (optional)</label>
                <select
                  value={newProjectFolderId || ''}
                  onChange={(e) => setNewProjectFolderId(e.target.value || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">No Folder (All Campaigns)</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowNewProjectDialog(false);
                  setNewProjectName('');
                  setNewProjectFolderId(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Dialog */}
      {showNewFolderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') setShowNewFolderDialog(false);
              }}
              placeholder="Folder name (e.g., 'Countries', 'Campaigns')..."
              autoFocus
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowNewFolderDialog(false);
                  setNewFolderName('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Project to Folder Dialog */}
      {movingProjectId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Move Campaign to Folder</h3>
            <p className="text-sm text-gray-600 mb-4">Select a folder or "All Campaigns"</p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <button
                onClick={() => handleMoveProject(movingProjectId, null)}
                className="w-full text-left px-4 py-3 border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-lg transition-all"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">All Campaigns (No Folder)</span>
                </div>
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleMoveProject(movingProjectId, folder.id)}
                  className="w-full text-left px-4 py-3 border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-lg transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-5 h-5" style={{ color: folder.color || '#19C37D' }} />
                    <span className="font-medium">{folder.name}</span>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setMovingProjectId(null)}
              className="w-full mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
