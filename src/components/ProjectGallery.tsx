import React, { useCallback, useEffect, useState } from 'react';
import { bannerPresets } from '../config/bannerPresets';
import { useBannerStore } from '../store/bannerStore';
import {
  Check,
  Clock,
  Copy,
  Edit2,
  Folder,
  FolderOpen,
  FolderPlus,
  LayoutGrid,
  MoreVertical,
  Move,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type {
  BannerPresetId,
  Folder as FolderType,
  ProjectSummary,
  TemplateSummary,
} from '../store/bannerStore';
import { bannerBloomMarkUrl } from '../lib/brandAssets';

type RenameType = 'project' | 'folder' | 'template';

export const ProjectGallery: React.FC = () => {
  const showGallery = useBannerStore((state) => state.showGallery);
  const setShowGallery = useBannerStore((state) => state.setShowGallery);
  const getAllProjects = useBannerStore((state) => state.getAllProjects);
  const getAllTemplates = useBannerStore((state) => state.getAllTemplates);
  const getAllFolders = useBannerStore((state) => state.getAllFolders);
  const loadProjectById = useBannerStore((state) => state.loadProjectById);
  const createNewProject = useBannerStore((state) => state.createNewProject);
  const createProjectFromTemplate = useBannerStore((state) => state.createProjectFromTemplate);
  const deleteProject = useBannerStore((state) => state.deleteProject);
  const duplicateProject = useBannerStore((state) => state.duplicateProject);
  const renameProject = useBannerStore((state) => state.renameProject);
  const createFolder = useBannerStore((state) => state.createFolder);
  const renameFolder = useBannerStore((state) => state.renameFolder);
  const deleteFolder = useBannerStore((state) => state.deleteFolder);
  const moveProjectToFolder = useBannerStore((state) => state.moveProjectToFolder);
  const saveCurrentAsTemplate = useBannerStore((state) => state.saveCurrentAsTemplate);
  const duplicateTemplate = useBannerStore((state) => state.duplicateTemplate);
  const renameTemplate = useBannerStore((state) => state.renameTemplate);
  const deleteTemplate = useBannerStore((state) => state.deleteTemplate);
  const applyTemplateToCurrentProject = useBannerStore((state) => state.applyTemplateToCurrentProject);
  const currentProjectId = useBannerStore((state) => state.currentProjectId);
  const currentTemplateId = useBannerStore((state) => state.currentTemplateId);
  const currentPresetId = useBannerStore((state) => state.bannerPresetId);

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectFolderId, setNewProjectFolderId] = useState<string | null>(null);
  const [newProjectTemplateId, setNewProjectTemplateId] = useState<string | null>(null);
  const [newProjectBannerPresetId, setNewProjectBannerPresetId] =
    useState<BannerPresetId>('google-ads-upload');
  const [newFolderName, setNewFolderName] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState('');
  const [renamingType, setRenamingType] = useState<RenameType>('project');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [movingProjectId, setMovingProjectId] = useState<string | null>(null);

  const hasActiveProject = currentProjectId !== null;
  const selectedTemplate =
    templates.find((template) => template.id === newProjectTemplateId) ?? null;
  const currentTemplate =
    templates.find((template) => template.id === currentTemplateId) ?? null;

  const refreshLibrary = useCallback(async () => {
    const [allProjects, allTemplates, allFolders] = await Promise.all([
      getAllProjects(),
      getAllTemplates(),
      getAllFolders(),
    ]);

    setProjects(allProjects.sort((a, b) => b.lastModified - a.lastModified));
    setTemplates(allTemplates.sort((a, b) => b.lastModified - a.lastModified));
    setFolders(allFolders.sort((a, b) => a.name.localeCompare(b.name)));
    setExpandedFolders(new Set(allFolders.map((folder) => folder.id)));
  }, [getAllFolders, getAllProjects, getAllTemplates]);

  useEffect(() => {
    if (!showGallery) {
      return;
    }

    void refreshLibrary();
  }, [refreshLibrary, showGallery]);

  const resetProjectDialog = () => {
    setNewProjectName('');
    setNewProjectFolderId(null);
    setNewProjectTemplateId(null);
    setNewProjectBannerPresetId('google-ads-upload');
    setShowNewProjectDialog(false);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      return;
    }

    if (newProjectTemplateId) {
      await createProjectFromTemplate(
        newProjectName.trim(),
        newProjectTemplateId,
        newProjectFolderId || undefined,
        newProjectBannerPresetId,
      );
    } else {
      await createNewProject(
        newProjectName.trim(),
        newProjectFolderId || undefined,
        newProjectBannerPresetId,
      );
    }

    resetProjectDialog();
    setShowGallery(false);
  };

  const handleTemplateSelection = (templateId: string | null) => {
    setNewProjectTemplateId(templateId);

    if (!templateId) {
      return;
    }

    const template = templates.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    setNewProjectBannerPresetId(template.bannerPresetId);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      return;
    }

    await createFolder(newFolderName.trim());
    setNewFolderName('');
    setShowNewFolderDialog(false);
    await refreshLibrary();
  };

  const handleSaveTemplateFromCurrent = async () => {
    const suggestedName = `${currentTemplate?.name ?? 'Layout'} Template`;
    const templateName = window.prompt('Save current layout as a reusable template', suggestedName);
    if (!templateName?.trim()) {
      return;
    }

    await saveCurrentAsTemplate(templateName.trim());
    await refreshLibrary();
  };

  const handleUseTemplate = (template: TemplateSummary) => {
    setNewProjectTemplateId(template.id);
    setNewProjectBannerPresetId(template.bannerPresetId);
    setNewProjectName(`${template.name} Campaign`);
    setShowNewProjectDialog(true);
  };

  const handleApplyTemplateToCurrent = async (templateId: string) => {
    await applyTemplateToCurrentProject(templateId);
    await refreshLibrary();
    setShowGallery(false);
  };

  const handleOpenProject = (id: string) => {
    void loadProjectById(id);
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      setActiveMenu(null);
      return;
    }

    await deleteProject(id);
    setActiveMenu(null);
    await refreshLibrary();
  };

  const handleDuplicateProject = async (id: string) => {
    await duplicateProject(id);
    setActiveMenu(null);
    await refreshLibrary();
  };

  const handleStartRename = (id: string, currentName: string, type: RenameType) => {
    setRenamingId(id);
    setRenamingValue(currentName);
    setRenamingType(type);
    setActiveMenu(null);
  };

  const handleFinishRename = async (id: string) => {
    if (!renamingValue.trim()) {
      setRenamingId(null);
      return;
    }

    if (renamingType === 'project') {
      await renameProject(id, renamingValue.trim());
    } else if (renamingType === 'folder') {
      await renameFolder(id, renamingValue.trim());
    } else {
      await renameTemplate(id, renamingValue.trim());
    }

    setRenamingId(null);
    await refreshLibrary();
  };

  const handleDeleteFolder = async (id: string, name: string) => {
    if (!window.confirm(`Delete folder "${name}"? Campaigns inside it will move to All Campaigns.`)) {
      setActiveMenu(null);
      return;
    }

    await deleteFolder(id);
    setActiveMenu(null);
    await refreshLibrary();
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!window.confirm(`Delete template "${name}"? This cannot be undone.`)) {
      setActiveMenu(null);
      return;
    }

    await deleteTemplate(id);
    setActiveMenu(null);
    await refreshLibrary();
  };

  const handleDuplicateTemplate = async (id: string) => {
    await duplicateTemplate(id);
    setActiveMenu(null);
    await refreshLibrary();
  };

  const handleMoveProject = async (projectId: string, folderId: string | null) => {
    await moveProjectToFolder(projectId, folderId);
    setMovingProjectId(null);
    setActiveMenu(null);
    await refreshLibrary();
  };

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const uncategorizedProjects = projects.filter((project) => !project.folderId);

  const renderProjectCard = (project: ProjectSummary) => (
    <div
      key={project.id}
      className="studio-gallery-card group overflow-hidden rounded-[1.25rem] transition-all hover:border-emerald-300"
    >
      <div
        className="relative flex h-48 cursor-pointer items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50"
        onClick={() => handleOpenProject(project.id)}
      >
        {project.thumbnail ? (
          <>
            <img
              src={project.thumbnail}
              alt={`${project.name} preview`}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/42 via-slate-900/8 to-white/18" />
            <div className="relative z-10 flex h-full w-full items-end justify-between p-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/92 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                <FolderOpen className="h-3.5 w-3.5 text-emerald-700" />
                {project.elementCount ?? 0} element{project.elementCount === 1 ? '' : 's'}
              </div>
              {project.templateId && (
                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100/95 px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
                  <Sparkles className="h-3 w-3" />
                  From template
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="relative z-10 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg transition-transform group-hover:scale-110">
              <FolderOpen className="h-8 w-8 text-white" />
            </div>
            <p className="text-sm font-medium text-gray-600">
              {project.elementCount ?? 0} element{project.elementCount === 1 ? '' : 's'}
            </p>
            {project.templateId && (
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                <Sparkles className="h-3 w-3" />
                From template
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-white to-gray-50 p-5">
        {renamingId === project.id && renamingType === 'project' ? (
          <input
            type="text"
            value={renamingValue}
            onChange={(event) => setRenamingValue(event.target.value)}
            onBlur={() => void handleFinishRename(project.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleFinishRename(project.id);
              if (event.key === 'Escape') setRenamingId(null);
            }}
            autoFocus
            className="w-full rounded-lg border-2 border-emerald-500 px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        ) : (
          <div>
            <h3
              className="mb-2 cursor-pointer text-base font-bold text-gray-900 transition-colors hover:text-emerald-700"
              onClick={() => handleOpenProject(project.id)}
              title={project.name}
            >
              {project.name}
            </h3>

            <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(project.lastModified)}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleOpenProject(project.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Open
              </button>
              <button
                onClick={() => handleStartRename(project.id, project.name, 'project')}
                className="flex items-center justify-center gap-1.5 rounded-md bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                title="Rename"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setMovingProjectId(project.id)}
                className="flex items-center justify-center gap-1.5 rounded-md bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                title="Move to Folder"
              >
                <Move className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setActiveMenu(activeMenu === project.id ? null : project.id)}
                className="flex items-center justify-center gap-1.5 rounded-md bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                title="More Options"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </div>

            {activeMenu === project.id && (
              <div className="z-10 mt-2 rounded-lg border-2 border-gray-200 bg-white py-1.5 shadow-xl">
                <button
                  onClick={() => void handleDuplicateProject(project.id)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-green-50 hover:text-green-700"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>
                <div className="my-1 border-t border-gray-200" />
                <button
                  onClick={() => void handleDeleteProject(project.id, project.name)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete campaign
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderTemplateCard = (template: TemplateSummary) => {
    const isCurrentTemplate = currentTemplateId === template.id;
    const matchesCurrentPreset = currentPresetId === template.bannerPresetId;

    return (
      <div
        key={template.id}
        className={`rounded-[1.15rem] border p-4 shadow-sm transition-all ${
          isCurrentTemplate
            ? 'border-emerald-300 bg-emerald-50/70'
            : 'border-slate-200 bg-white/90 hover:border-slate-300'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {renamingId === template.id && renamingType === 'template' ? (
              <input
                type="text"
                value={renamingValue}
                onChange={(event) => setRenamingValue(event.target.value)}
                onBlur={() => void handleFinishRename(template.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void handleFinishRename(template.id);
                  if (event.key === 'Escape') setRenamingId(null);
                }}
                autoFocus
                className="w-full rounded-lg border-2 border-emerald-500 px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            ) : (
              <>
                <div className="truncate text-base font-bold text-slate-900">{template.name}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {bannerPresets[template.bannerPresetId].name}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setActiveMenu(activeMenu === template.id ? null : template.id)}
            className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            title="Template options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>{template.elementCount ?? 0} saved elements</span>
          <span className="text-slate-300">/</span>
          <span>Updated {formatDate(template.lastModified)}</span>
        </div>

        {activeMenu === template.id && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg">
            <button
              onClick={() => void handleDuplicateTemplate(template.id)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Copy className="h-4 w-4" />
              Duplicate template
            </button>
            <div className="my-1 border-t border-slate-200" />
            <button
              onClick={() => handleStartRename(template.id, template.name, 'template')}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Edit2 className="h-4 w-4" />
              Rename template
            </button>
            <div className="my-1 border-t border-slate-200" />
            <button
              onClick={() => void handleDeleteTemplate(template.id, template.name)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete template
            </button>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => handleUseTemplate(template)}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" />
            New campaign
          </button>
          {hasActiveProject && (
            <button
              onClick={() => void handleApplyTemplateToCurrent(template.id)}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-200"
              disabled={!matchesCurrentPreset}
              title={
                matchesCurrentPreset
                  ? 'Apply this layout to the current campaign'
                  : 'Template preset does not match the current campaign'
              }
            >
              <Check className="h-3.5 w-3.5" />
              Apply here
            </button>
          )}
        </div>

        {!matchesCurrentPreset && hasActiveProject && (
          <p className="mt-2 text-[11px] text-amber-700">
            This template belongs to {bannerPresets[template.bannerPresetId].name}.
          </p>
        )}
      </div>
    );
  };

  if (!showGallery) return null;

  return (
    <div className="studio-gallery fixed inset-0 z-[10000] flex items-stretch justify-stretch overflow-hidden">
      <div className="studio-gallery-shell flex h-full min-h-full w-full flex-col">
        <div className="studio-gallery-header flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/70 bg-white/70 p-6 backdrop-blur-xl">
          <div className="studio-gallery-header__meta flex min-w-0 flex-wrap items-center gap-4">
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3 text-white shadow-lg">
              <img
                src={bannerBloomMarkUrl}
                alt="BannerBloom"
                className="h-7 w-7 rounded-lg bg-white/20 p-0.5"
              />
            </div>
            <div>
              <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Campaign library
              </div>
              <h2 className="bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-2xl font-bold text-transparent">
                BannerBloom
              </h2>
              <p className="mt-0.5 text-sm font-medium text-slate-600">
                Create once. Deploy everywhere.
              </p>
              <p className="mt-0.5 text-sm text-gray-500">
                {projects.length} campaign{projects.length !== 1 ? 's' : ''} | {templates.length}{' '}
                template{templates.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="studio-gallery-header__actions flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowNewFolderDialog(true)}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-all shadow-sm hover:bg-gray-200"
            >
              <FolderPlus className="h-4 w-4" />
              New Folder
            </button>
            <button
              onClick={() => setShowNewProjectDialog(true)}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 font-medium text-white transition-all shadow-md hover:scale-105 hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg"
            >
              <Plus className="h-5 w-5" />
              New Campaign
            </button>
            <button
              onClick={() => void handleSaveTemplateFromCurrent()}
              disabled={!hasActiveProject}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white transition-all shadow-md hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Sparkles className="h-5 w-5" />
              {currentTemplate ? 'Update Template' : 'Save Layout as Template'}
            </button>
            {hasActiveProject && (
              <button
                onClick={() => setShowGallery(false)}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                title="Back to editor"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        <div className="studio-gallery-content flex-1 overflow-y-auto p-8">
          {projects.length === 0 && folders.length === 0 && templates.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="studio-empty-state max-w-xl px-10 py-12 text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 shadow-lg">
                  <img
                    src={bannerBloomMarkUrl}
                    alt="BannerBloom"
                    className="h-12 w-12 rounded-2xl"
                  />
                </div>
                <div className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  BannerBloom
                </div>
                <h3 className="mb-3 text-2xl font-bold text-slate-900">
                  Start blank or from a saved layout.
                </h3>
                <p className="mb-6 text-slate-600">
                  Build a campaign free-form, save the layout as a template, and reuse it when you
                  need fast variations.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setShowNewFolderDialog(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-5 py-3 font-medium text-gray-700 transition-all shadow-md hover:bg-gray-200 hover:shadow-lg"
                  >
                    <FolderPlus className="h-5 w-5" />
                    Create Folder
                  </button>
                  <button
                    onClick={() => setShowNewProjectDialog(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 font-medium text-white transition-all shadow-lg hover:scale-105 hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl"
                  >
                    <Plus className="h-5 w-5" />
                    Start a Campaign
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <section className="rounded-[1.35rem] border border-slate-200/80 bg-white/70 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Templates
                    </div>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">Reusable layouts</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Save exact size-by-size positioning once, then create new campaigns and swap
                      text or images without rebuilding every banner.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {currentTemplate && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                        <Sparkles className="h-3.5 w-3.5" />
                        Current: {currentTemplate.name}
                      </span>
                    )}
                    <button
                      onClick={() => void handleSaveTemplateFromCurrent()}
                      disabled={!hasActiveProject}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <Sparkles className="h-4 w-4" />
                      Save current layout
                    </button>
                  </div>
                </div>

                {templates.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-sm text-slate-500">
                    No templates yet. Create a campaign, arrange the sizes the way you like, then
                    save that layout here.
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {templates.map((template) => renderTemplateCard(template))}
                  </div>
                )}
              </section>

              {uncategorizedProjects.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-2 py-3">
                    <FolderOpen className="h-6 w-6 text-gray-600" />
                    <h3 className="flex-1 text-lg font-bold text-gray-700">All Campaigns</h3>
                    <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700">
                      {uncategorizedProjects.length}
                    </span>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {uncategorizedProjects.map((project) => renderProjectCard(project))}
                  </div>
                </div>
              )}

              {folders.map((folder) => {
                const folderProjects = projects.filter((project) => project.folderId === folder.id);
                const isExpanded = expandedFolders.has(folder.id);

                return (
                  <div key={folder.id}>
                    <div className="mb-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-white/50 px-2 py-3">
                      <button
                        onClick={() =>
                          setExpandedFolders((current) => {
                            const next = new Set(current);
                            if (next.has(folder.id)) {
                              next.delete(folder.id);
                            } else {
                              next.add(folder.id);
                            }
                            return next;
                          })
                        }
                        className="rounded-lg p-1.5 transition-colors hover:bg-gray-200"
                      >
                        <LayoutGrid
                          className={`h-5 w-5 text-gray-600 transition-transform ${
                            isExpanded ? '' : 'rotate-90'
                          }`}
                        />
                      </button>
                      <Folder className="h-6 w-6" style={{ color: folder.color || '#19C37D' }} />

                      {renamingId === folder.id && renamingType === 'folder' ? (
                        <input
                          type="text"
                          value={renamingValue}
                          onChange={(event) => setRenamingValue(event.target.value)}
                          onBlur={() => void handleFinishRename(folder.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') void handleFinishRename(folder.id);
                            if (event.key === 'Escape') setRenamingId(null);
                          }}
                          autoFocus
                          className="flex-1 rounded-lg border-2 border-emerald-500 px-3 py-1.5 text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                      ) : (
                        <h3 className="flex-1 text-lg font-bold text-gray-700">{folder.name}</h3>
                      )}

                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                        {folderProjects.length}
                      </span>

                      <div className="ml-2 flex gap-2">
                        <button
                          onClick={() => handleStartRename(folder.id, folder.name, 'folder')}
                          className="flex items-center gap-1.5 rounded-md bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-200"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Rename
                        </button>
                        <button
                          onClick={() => void handleDeleteFolder(folder.id, folder.name)}
                          className="flex items-center gap-1.5 rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>

                    {isExpanded && folderProjects.length > 0 && (
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

      {showNewProjectDialog && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-gray-900">
              {selectedTemplate ? 'Create Campaign from Template' : 'Create New Campaign'}
            </h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleCreateProject();
                if (event.key === 'Escape') resetProjectDialog();
              }}
              placeholder="Campaign name..."
              autoFocus
              className="mb-4 w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            />

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Template</label>
              <select
                value={newProjectTemplateId ?? ''}
                onChange={(event) => handleTemplateSelection(event.target.value || null)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">No template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {bannerPresets[template.bannerPresetId].name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Preset selection
              </label>
              <select
                value={newProjectBannerPresetId}
                onChange={(event) =>
                  setNewProjectBannerPresetId(event.target.value as BannerPresetId)
                }
                disabled={Boolean(selectedTemplate)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                {Object.values(bannerPresets).map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
              {selectedTemplate ? (
                <p className="mt-2 text-xs text-slate-500">
                  This template is locked to {bannerPresets[selectedTemplate.bannerPresetId].name}.
                </p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  Choose the banner size set for this campaign.
                </p>
              )}
            </div>

            {folders.length > 0 && (
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Folder (optional)
                </label>
                <select
                  value={newProjectFolderId ?? ''}
                  onChange={(event) => setNewProjectFolderId(event.target.value || null)}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">No Folder (All Campaigns)</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={resetProjectDialog}
                className="flex-1 rounded-md bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreateProject()}
                disabled={!newProjectName.trim()}
                className="flex-1 rounded-md bg-emerald-600 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewFolderDialog && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Create New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleCreateFolder();
                if (event.key === 'Escape') setShowNewFolderDialog(false);
              }}
              placeholder="Folder name..."
              autoFocus
              className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setShowNewFolderDialog(false);
                  setNewFolderName('');
                }}
                className="flex-1 rounded-md bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreateFolder()}
                disabled={!newFolderName.trim()}
                className="flex-1 rounded-md bg-emerald-600 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {movingProjectId && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Move Campaign to Folder</h3>
            <p className="mb-4 text-sm text-gray-600">Select a folder or All Campaigns.</p>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              <button
                onClick={() => void handleMoveProject(movingProjectId, null)}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-left transition-all hover:border-emerald-400 hover:bg-emerald-50"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">All Campaigns (No Folder)</span>
                </div>
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => void handleMoveProject(movingProjectId, folder.id)}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-left transition-all hover:border-emerald-400 hover:bg-emerald-50"
                >
                  <div className="flex items-center gap-2">
                    <Folder className="h-5 w-5" style={{ color: folder.color || '#19C37D' }} />
                    <span className="font-medium">{folder.name}</span>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setMovingProjectId(null)}
              className="mt-4 w-full rounded-md bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
