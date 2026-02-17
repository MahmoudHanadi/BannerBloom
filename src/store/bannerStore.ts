import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import React from 'react';

export type ElementType = 'text' | 'image' | 'shape' | 'button';

export interface BannerElement {
    id: string;
    type: ElementType;
    content: string; // Text content or Image URL or Shape color
    x: number; // Percentage 0-100
    y: number; // Percentage 0-100
    width: number; // Percentage 0-100
    height: number; // Percentage 0-100
    rotation: number; // Degrees
    aspectRatioLocked: boolean;
    aspectRatio?: number; // Desired aspect ratio (width / height)
    shapeType?: 'rectangle' | 'circle' | 'rounded-rectangle'; // For shape elements
    style?: React.CSSProperties & { fontFamily?: string };
}

export interface Override {
    content?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    scale?: number;
    aspectRatio?: number;
    style?: React.CSSProperties & { fontFamily?: string };
    isAutoPropagated?: boolean;
}

export interface BannerSize {
    id: string;
    name: string;
    width: number;
    height: number;
    category: 'square' | 'horizontal' | 'vertical';
    isMaster?: boolean;
}

export interface BackgroundConfig {
    type: 'solid' | 'gradient' | 'image';
    value: string; // Hex color, or image URL
    gradientType?: 'linear' | 'radial';
    gradientColors?: string[]; // For gradient
    gradientDirection?: string; // e.g., "to right"
}

export type LogoPosition = 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface LogoConfig {
    image: string; // Base64 or URL
    position: LogoPosition;
    size: number; // Percentage of banner width (e.g., 15 = 15% of banner width)
    padding: number; // Padding from edges in pixels
}

export type CTAPosition = 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right';
export type CTAAnimation = 'none' | 'heartbeat' | 'shake' | 'colorwave';

export interface CTAConfig {
    text: string;
    position: CTAPosition;
    width: number; // Percentage of banner width
    height: number; // Pixels
    borderRadius: number; // Pixels
    backgroundColor: string; // Solid color or gradient
    backgroundType: 'solid' | 'gradient';
    gradientColors?: [string, string]; // For gradient
    gradientDirection?: string; // e.g., "to right", "135deg"
    textColor: string;
    fontSize: number; // Percentage of height
    fontWeight: 'normal' | 'bold' | 'bolder';
    padding: number; // Padding from edges in pixels
    animation: CTAAnimation;
    animationSpeed: number; // Duration in seconds (0.5 to 5)
    colorWaveColors?: [string, string]; // For color wave animation
}

export interface Folder {
    id: string;
    name: string;
    color?: string; // Optional color for folder icon
    createdAt: number;
}

export interface SavedProject {
    id: string;
    name: string;
    lastModified: number;
    folderId?: string | null; // Optional folder assignment
    thumbnail?: string;
    elements: BannerElement[];
    overrides: Record<string, Record<string, Override>>;
    bannerSizes: BannerSize[];
    background: BackgroundConfig;
    logo: LogoConfig | null;
    cta: CTAConfig | null;
}

interface BannerState {
    elements: BannerElement[];
    overrides: Record<string, Record<string, Override>>; // { bannerId: { elementId: override } }
    selectedElementId: string | null;
    selectedBannerId: string | null;
    bannerSizes: BannerSize[];
    background: BackgroundConfig;
    isolatedBannerId: string | null; // Banner in isolated edit mode
    logo: LogoConfig | null; // Global logo configuration
    cta: CTAConfig | null; // Global CTA button configuration
    projectName: string; // Current project name
    currentProjectId: string | null; // ID of currently open project
    lastSaved: number | null; // Timestamp of last save
    showGallery: boolean; // Whether to show project gallery

    // Actions
    addElement: (type: ElementType, content: string, shapeType?: string, dimensions?: { width: number; height: number }) => void;
    updateElement: (id: string, updates: Partial<BannerElement>) => void;
    setOverride: (bannerId: string, elementId: string, override: Override) => void;
    selectElement: (id: string | null) => void;
    selectBanner: (id: string | null) => void;
    removeElement: (id: string) => void;
    reorderElement: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
    setBackground: (bg: BackgroundConfig) => void;
    setIsolatedBanner: (bannerId: string | null) => void;
    setLogo: (logo: LogoConfig | null) => void;
    updateLogo: (updates: Partial<LogoConfig>) => void;
    setCTA: (cta: CTAConfig | null) => void;
    updateCTA: (updates: Partial<CTAConfig>) => void;
    setProjectName: (name: string) => void;
    setShowGallery: (show: boolean) => void;
    saveCurrentProject: () => void;
    loadProjectById: (id: string) => void;
    createNewProject: (name: string, folderId?: string) => void;
    deleteProject: (id: string) => void;
    duplicateProject: (id: string) => void;
    renameProject: (id: string, newName: string) => void;
    moveProjectToFolder: (projectId: string, folderId: string | null) => void;
    getAllProjects: () => SavedProject[];
    getAllFolders: () => Folder[];
    createFolder: (name: string, color?: string) => void;
    renameFolder: (id: string, newName: string) => void;
    deleteFolder: (id: string) => void;
    saveToLocalStorage: () => void;
    loadFromLocalStorage: () => boolean;
    saveProject: () => void;
    loadProject: (jsonString: string) => void;
}

export const useBannerStore = create<BannerState>((set, get) => ({
    elements: [
        {
            id: '1',
            type: 'text',
            content: 'Banner Spore',
            x: 10,
            y: 10,
            width: 80,
            height: 20,
            rotation: 0,
            aspectRatioLocked: true,
            aspectRatio: 4, // 80/20 = 4 (assuming square master)
            style: { color: '#000000', fontSize: '100px', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Inter' }
        },
        {
            id: '2',
            type: 'shape',
            content: '#3b82f6',
            x: 30,
            y: 40,
            width: 40,
            height: 40,
            rotation: 0,
            aspectRatioLocked: true,
            aspectRatio: 1,
            shapeType: 'rectangle',
        }
    ],
    overrides: {},
    selectedElementId: null,
    selectedBannerId: null,
    isolatedBannerId: null,
    background: { type: 'solid', value: '#ffffff' },
    logo: null,
    cta: null,
    projectName: 'Untitled Project',
    currentProjectId: null,
    lastSaved: null,
    showGallery: false,
    bannerSizes: [
        // Horizontal Category - Master controls all horizontal
        { id: 'master-horizontal', name: 'Master Landscape (1.91:1)', width: 1200, height: 628, category: 'horizontal', isMaster: true },
        { id: 'landscape-min', name: 'Landscape Min 600x314', width: 600, height: 314, category: 'horizontal' },

        // Square Category - Master controls all squares
        { id: 'master-square', name: 'Master Square (1:1)', width: 1200, height: 1200, category: 'square', isMaster: true },
        { id: 'square-min', name: 'Square Min 300x300', width: 300, height: 300, category: 'square' },

        // Vertical Category - Master controls all vertical
        { id: 'master-vertical', name: 'Master Vertical (4:5)', width: 960, height: 1200, category: 'vertical', isMaster: true },
        { id: 'vertical-min', name: 'Vertical Min 480x600', width: 480, height: 600, category: 'vertical' },
        { id: 'vertical-9-16', name: 'Vertical 900x1600', width: 900, height: 1600, category: 'vertical' },
        { id: 'amp-portrait', name: 'AMP Size 320x480', width: 320, height: 480, category: 'vertical' },

        // AMP Specific (Horizontal)
        { id: 'amp-landscape', name: 'AMP Size 480x320', width: 480, height: 320, category: 'horizontal' },
    ],

    addElement: (type, content, shapeType, dimensions) => set((state) => {
        // Determine current banner context
        const currentBanner = state.bannerSizes.find(b => b.id === state.selectedBannerId) || state.bannerSizes[0];

        let widthPercent = 0;
        let heightPercent = 0;
        let aspectRatio = 1;

        if (type === 'image' && dimensions) {
            // Use native dimensions
            aspectRatio = dimensions.width / dimensions.height;

            // Map native pixels to percentage of current banner
            widthPercent = (dimensions.width / currentBanner.width) * 100;

            // Calculate height percent based on AR
            const targetPixelHeight = dimensions.width / aspectRatio;
            heightPercent = (targetPixelHeight / currentBanner.height) * 100;
        } else {
            // Default width in pixels (relative to current banner)
            // We want roughly 300px width for shapes/images, or 30% if banner is small
            const targetPixelWidth = Math.min(300, currentBanner.width * 0.4);
            widthPercent = (targetPixelWidth / currentBanner.width) * 100;

            if (type === 'shape' && (shapeType === 'circle' || shapeType === 'rectangle' || shapeType === 'rounded-rectangle')) {
                // Force 1:1 aspect ratio for shapes initially
                aspectRatio = 1;
                const targetPixelHeight = targetPixelWidth / aspectRatio;
                heightPercent = (targetPixelHeight / currentBanner.height) * 100;
            } else if (type === 'button') {
                aspectRatio = 3; // 3:1 for buttons
                const targetPixelHeight = targetPixelWidth / aspectRatio;
                heightPercent = (targetPixelHeight / currentBanner.height) * 100;
            } else {
                // Text or Image default (fallback if no dimensions)
                aspectRatio = type === 'text' ? 4 : 1.5; // Default AR
                const targetPixelHeight = targetPixelWidth / aspectRatio;
                heightPercent = (targetPixelHeight / currentBanner.height) * 100;
            }
        }

        return {
            elements: [...state.elements, {
                id: uuidv4(),
                type,
                content,
                x: 50 - (widthPercent / 2), // Center it
                y: 50 - (heightPercent / 2),
                width: widthPercent,
                height: heightPercent,
                rotation: 0,
                aspectRatioLocked: type === 'shape' ? false : true, // Unlock shapes by default
                aspectRatio: aspectRatio,
                shapeType: type === 'shape' ? (shapeType as BannerElement['shapeType'] || 'rectangle') : undefined,
                style: type === 'text' ? { color: '#000000', fontSize: '100px', fontFamily: 'Inter' } :
                    type === 'button' ? { backgroundColor: '#3b82f6', color: '#ffffff', fontSize: '60px', borderRadius: '8px', fontFamily: 'Inter', display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}
            }]
        };
    }),

    updateElement: (id, updates) => set((state) => ({
        elements: state.elements.map((el) => el.id === id ? { ...el, ...updates } : el)
    })),

    setOverride: (bannerId, elementId, override) => set((state) => {
        const banner = state.bannerSizes.find(b => b.id === bannerId);
        const newOverrides = { ...state.overrides };

        // Helper to merge styles if present
        const mergeOverride = (existing: Override | undefined, newOv: Override): Override => {
            const merged = { ...(existing || {}), ...newOv };
            if (newOv.style && existing?.style) {
                merged.style = { ...existing.style, ...newOv.style };
            }
            return merged;
        };

        // Apply override to the current banner
        newOverrides[bannerId] = {
            ...(newOverrides[bannerId] || {}),
            [elementId]: mergeOverride(newOverrides[bannerId]?.[elementId], { ...override, isAutoPropagated: false })
        };

        // If a banner is isolated, ONLY edit that banner (no propagation)
        if (state.isolatedBannerId) {
            // Only apply changes to the isolated banner, skip all propagation
            return { overrides: newOverrides };
        }

        // If this is a master banner, propagate according to hierarchy
        if (banner?.isMaster) {
            if (bannerId === 'master-square') {
                // Square Master affects EVERYONE (Square, Horizontal, Vertical)
                state.bannerSizes.forEach(b => {
                    if (b.id !== bannerId) {
                        newOverrides[b.id] = {
                            ...(newOverrides[b.id] || {}),
                            [elementId]: mergeOverride(newOverrides[b.id]?.[elementId], { ...override, isAutoPropagated: true })
                        };
                    }
                });
            } else if (bannerId === 'master-horizontal') {
                // Horizontal Master affects only Horizontal banners
                state.bannerSizes.forEach(b => {
                    if (b.category === 'horizontal' && b.id !== bannerId) {
                        newOverrides[b.id] = {
                            ...(newOverrides[b.id] || {}),
                            [elementId]: mergeOverride(newOverrides[b.id]?.[elementId], { ...override, isAutoPropagated: true })
                        };
                    }
                });
            } else if (bannerId === 'master-vertical') {
                // Vertical Master affects only Vertical banners
                state.bannerSizes.forEach(b => {
                    if (b.category === 'vertical' && b.id !== bannerId) {
                        newOverrides[b.id] = {
                            ...(newOverrides[b.id] || {}),
                            [elementId]: mergeOverride(newOverrides[b.id]?.[elementId], { ...override, isAutoPropagated: true })
                        };
                    }
                });
            }
        }

        return { overrides: newOverrides };
    }),

    selectElement: (id) => set({ selectedElementId: id }),
    selectBanner: (id) => set({ selectedBannerId: id }),

    setIsolatedBanner: (bannerId) => set({ isolatedBannerId: bannerId }),

    setLogo: (logo) => set({ logo }),

    updateLogo: (updates) => set((state) => ({
        logo: state.logo ? { ...state.logo, ...updates } : null
    })),

    setCTA: (cta) => set({ cta }),

    updateCTA: (updates) => set((state) => ({
        cta: state.cta ? { ...state.cta, ...updates } : null
    })),

    setProjectName: (name) => set({ projectName: name }),

    setShowGallery: (show) => set({ showGallery: show }),

    getAllProjects: () => {
        try {
            const projectsStr = localStorage.getItem('banner-spore-projects');
            if (!projectsStr) return [];
            return JSON.parse(projectsStr) as SavedProject[];
        } catch (e) {
            console.error('Failed to get projects:', e);
            return [];
        }
    },

    getAllFolders: () => {
        try {
            const foldersStr = localStorage.getItem('banner-spore-folders');
            if (!foldersStr) return [];
            return JSON.parse(foldersStr) as Folder[];
        } catch (e) {
            console.error('Failed to get folders:', e);
            return [];
        }
    },

    createFolder: (name, color) => {
        const newFolder: Folder = {
            id: uuidv4(),
            name,
            color: color || '#3b82f6',
            createdAt: Date.now(),
        };

        const existingFolders = get().getAllFolders();
        existingFolders.push(newFolder);
        localStorage.setItem('banner-spore-folders', JSON.stringify(existingFolders));
        console.log('✅ Folder created:', name);
    },

    renameFolder: (id, newName) => {
        const folders = get().getAllFolders();
        const folder = folders.find(f => f.id === id);
        if (folder) {
            folder.name = newName;
            localStorage.setItem('banner-spore-folders', JSON.stringify(folders));
            console.log('✅ Folder renamed:', newName);
        }
    },

    deleteFolder: (id) => {
        // Remove folder
        const folders = get().getAllFolders().filter(f => f.id !== id);
        localStorage.setItem('banner-spore-folders', JSON.stringify(folders));

        // Move all projects in this folder to root
        const projects = get().getAllProjects();
        projects.forEach(project => {
            if (project.folderId === id) {
                project.folderId = null;
            }
        });
        localStorage.setItem('banner-spore-projects', JSON.stringify(projects));
        console.log('✅ Folder deleted and projects moved to root');
    },

    moveProjectToFolder: (projectId, folderId) => {
        const projects = get().getAllProjects();
        const project = projects.find(p => p.id === projectId);
        if (project) {
            project.folderId = folderId;
            project.lastModified = Date.now();
            localStorage.setItem('banner-spore-projects', JSON.stringify(projects));
            console.log('✅ Project moved to folder:', folderId || 'root');
        }
    },

    saveCurrentProject: () => {
        const state = get();
        const projects = state.getAllProjects();
        
        const projectData: SavedProject = {
            id: state.currentProjectId || `project-${Date.now()}`,
            name: state.projectName,
            lastModified: Date.now(),
            elements: state.elements,
            overrides: state.overrides,
            bannerSizes: state.bannerSizes,
            background: state.background,
            logo: state.logo,
            cta: state.cta,
        };

        // Update or add project
        const existingIndex = projects.findIndex(p => p.id === projectData.id);
        if (existingIndex >= 0) {
            projects[existingIndex] = projectData;
        } else {
            projects.push(projectData);
        }

        try {
            localStorage.setItem('banner-spore-projects', JSON.stringify(projects));
            set({ 
                currentProjectId: projectData.id,
                lastSaved: Date.now() 
            });
            console.log('✅ Project saved:', projectData.name);
        } catch (e) {
            console.error('Failed to save project:', e);
            alert('Failed to save project. Your browser storage might be full.');
        }
    },

    loadProjectById: (id) => {
        const state = get();
        const projects = state.getAllProjects();
        const project = projects.find(p => p.id === id);

        if (!project) {
            alert('Project not found');
            return;
        }

        set({
            currentProjectId: project.id,
            projectName: project.name,
            elements: project.elements,
            overrides: project.overrides,
            bannerSizes: project.bannerSizes,
            background: project.background,
            logo: project.logo,
            cta: project.cta,
            lastSaved: project.lastModified,
            selectedElementId: null,
            selectedBannerId: null,
            isolatedBannerId: null,
            showGallery: false,
        });

        console.log('✅ Project loaded:', project.name);
    },

    createNewProject: (name, folderId) => {
        const defaultBannerSizes = get().bannerSizes;
        
        set({
            currentProjectId: null, // Will be set on first save
            projectName: name,
            elements: [
                {
                    id: '1',
                    type: 'text',
                    content: 'Your Banner Text',
                    x: 10,
                    y: 40,
                    width: 80,
                    height: 20,
                    rotation: 0,
                    aspectRatioLocked: true,
                    aspectRatio: 4,
                    style: { color: '#000000', fontSize: '100px', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Inter' }
                },
            ],
            overrides: {},
            background: { type: 'solid', value: '#ffffff' },
            logo: null,
            cta: null,
            lastSaved: null,
            selectedElementId: null,
            selectedBannerId: null,
            isolatedBannerId: null,
            showGallery: false,
        });

        // Save immediately with folder assignment
        const savedState = get();
        const newProjectId = uuidv4();
        const newProject: SavedProject = {
            id: newProjectId,
            name: savedState.projectName,
            lastModified: Date.now(),
            folderId: folderId || null,
            elements: savedState.elements,
            overrides: savedState.overrides,
            bannerSizes: savedState.bannerSizes,
            background: savedState.background,
            logo: savedState.logo,
            cta: savedState.cta,
        };

        const existingProjects = JSON.parse(localStorage.getItem('banner-spore-projects') || '[]');
        existingProjects.push(newProject);
        localStorage.setItem('banner-spore-projects', JSON.stringify(existingProjects));

        set({ currentProjectId: newProjectId, lastSaved: newProject.lastModified });
        console.log('✅ New project created:', name, 'in folder:', folderId || 'root');
    },

    deleteProject: (id) => {
        const state = get();
        const projects = state.getAllProjects();
        const filtered = projects.filter(p => p.id !== id);

        try {
            localStorage.setItem('banner-spore-projects', JSON.stringify(filtered));
            console.log('✅ Project deleted');
        } catch (e) {
            console.error('Failed to delete project:', e);
        }
    },

    duplicateProject: (id) => {
        const state = get();
        const projects = state.getAllProjects();
        const original = projects.find(p => p.id === id);

        if (!original) return;

        const duplicate: SavedProject = {
            ...original,
            id: `project-${Date.now()}`,
            name: `${original.name} (Copy)`,
            lastModified: Date.now(),
        };

        projects.push(duplicate);

        try {
            localStorage.setItem('banner-spore-projects', JSON.stringify(projects));
            console.log('✅ Project duplicated');
        } catch (e) {
            console.error('Failed to duplicate project:', e);
        }
    },

    renameProject: (id, newName) => {
        const state = get();
        const projects = state.getAllProjects();
        const project = projects.find(p => p.id === id);

        if (!project) return;

        project.name = newName;
        project.lastModified = Date.now();

        try {
            localStorage.setItem('banner-spore-projects', JSON.stringify(projects));
            
            // If this is the current project, update the name in state too
            if (state.currentProjectId === id) {
                set({ projectName: newName });
            }
            
            console.log('✅ Project renamed');
        } catch (e) {
            console.error('Failed to rename project:', e);
        }
    },

    saveToLocalStorage: () => {
        // Redirect to saveCurrentProject for compatibility
        get().saveCurrentProject();
    },

    loadFromLocalStorage: () => {
        // Load the most recent project
        const projects = get().getAllProjects();
        if (projects.length === 0) return false;

        // Sort by lastModified and load most recent
        const mostRecent = projects.sort((a, b) => b.lastModified - a.lastModified)[0];
        get().loadProjectById(mostRecent.id);
        return true;
    },

    removeElement: (id) => set((state) => ({
        elements: state.elements.filter((el) => el.id !== id),
        selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
    })),

    reorderElement: (id, direction) => set((state) => {
        const index = state.elements.findIndex(el => el.id === id);
        if (index === -1) return state;

        const newElements = [...state.elements];
        const [movedElement] = newElements.splice(index, 1);

        if (direction === 'up' && index < newElements.length) {
            newElements.splice(index + 1, 0, movedElement);
        } else if (direction === 'down' && index > 0) {
            newElements.splice(index - 1, 0, movedElement);
        } else if (direction === 'top') {
            newElements.push(movedElement);
        } else if (direction === 'bottom') {
            newElements.unshift(movedElement);
        } else {
            // If invalid move, put it back
            newElements.splice(index, 0, movedElement);
        }

        return { elements: newElements };
    }),

    setBackground: (bg) => set({ background: bg }),

    saveProject: () => {
        const state = get();
        const projectData = {
            version: '1.0',
            projectName: state.projectName,
            lastSaved: Date.now(),
            elements: state.elements,
            overrides: state.overrides,
            bannerSizes: state.bannerSizes,
            background: state.background,
            isolatedBannerId: state.isolatedBannerId,
            logo: state.logo,
            cta: state.cta,
        };
        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = state.projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        a.download = `${fileName || 'banner-spore-project'}-${new Date().toISOString().slice(0, 10)}.bsp`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    loadProject: (jsonString) => {
        try {
            const data = JSON.parse(jsonString);
            if (!data.elements || !data.background) {
                alert('Invalid project file');
                return;
            }
            set({
                elements: data.elements,
                overrides: data.overrides || {},
                background: data.background,
                bannerSizes: data.bannerSizes || get().bannerSizes,
                isolatedBannerId: data.isolatedBannerId || null,
                logo: data.logo || null,
                cta: data.cta || null,
                projectName: data.projectName || 'Imported Project',
                lastSaved: data.lastSaved || null,
                selectedElementId: null,
                selectedBannerId: null
            });
        } catch (e) {
            console.error('Failed to load project:', e);
            alert('Failed to load project file');
        }
    }
}));
