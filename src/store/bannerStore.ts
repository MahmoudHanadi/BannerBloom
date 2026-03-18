import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  defaultBannerPresetId,
  getBannerSizesForPreset,
  normalizeBannerSizesForPreset,
} from '../config/bannerPresets';
import {
  blobToDataUrl,
  createEditorAssetFromBlob,
  dataUrlToBlob,
  isDataUrl,
  revokeEditorAsset,
} from '../lib/assetUtils';
import {
  createDefaultBackground,
  createDefaultCTA,
  createDefaultElements,
  createDefaultLogo,
  createNewProjectElements,
} from '../lib/editorDefaults';
import {
  createFolderRecord,
  createStoredAssetRef,
  deleteFolderRecord,
  deleteProjectRecord,
  duplicateProjectRecord,
  getFallbackPresetId,
  getProjectAssetBlob,
  getProjectDocument,
  isStoredAssetRef,
  listFolders,
  listProjects,
  moveProjectRecord,
  renameFolderRecord,
  renameProjectRecord,
  saveProjectDocument,
  type ProjectAssetRecord,
  type StoredProjectDocument,
} from '../lib/projectStorage';
import { getBackupFilename } from '../lib/fileNaming';
import type {
  BackgroundConfig,
  BannerElement,
  BannerPresetId,
  BannerSize,
  CTAConfig,
  EditorAsset,
  ElementType,
  Folder,
  LogoConfig,
  Override,
  ProjectSummary,
  SavedProject,
} from '../types/banner';

export type {
  BackgroundConfig,
  BannerCategory,
  BannerElement,
  BannerPreset,
  BannerPresetId,
  BannerSize,
  CTAAnimation,
  CTAConfig,
  CTAPosition,
  EditorAsset,
  ElementType,
  ExportType,
  Folder,
  LogoConfig,
  LogoPosition,
  Override,
  ProjectSummary,
  SavedProject,
} from '../types/banner';

interface PortableProjectAsset {
  assetId: string;
  name?: string;
  mimeType?: string;
  dataUrl: string;
}

interface PortableProjectFile {
  version: '2.0';
  projectName: string;
  bannerPresetId: BannerPresetId;
  lastSaved: number;
  elements: Array<Omit<BannerElement, 'content'> & { content: string | { kind: 'project-asset'; assetId: string } }>;
  overrides: Record<string, Record<string, Override>>;
  bannerSizes: BannerSize[];
  background: Omit<BackgroundConfig, 'value'> & { value: string | { kind: 'project-asset'; assetId: string } };
  logo: (Omit<LogoConfig, 'image'> & { image: string | { kind: 'project-asset'; assetId: string } }) | null;
  cta: CTAConfig | null;
  assets: PortableProjectAsset[];
}

interface BannerState {
  elements: BannerElement[];
  overrides: Record<string, Record<string, Override>>;
  selectedElementId: string | null;
  selectedBannerId: string | null;
  bannerPresetId: BannerPresetId;
  bannerSizes: BannerSize[];
  background: BackgroundConfig;
  isolatedBannerId: string | null;
  logo: LogoConfig | null;
  cta: CTAConfig | null;
  projectName: string;
  currentProjectId: string | null;
  currentFolderId: string | null;
  lastSaved: number | null;
  showGallery: boolean;
  editorAssets: EditorAsset[];
  addElement: (
    type: ElementType,
    content: string,
    shapeType?: string,
    dimensions?: { width: number; height: number },
  ) => void;
  addImageElementFromBlob: (blob: Blob, name?: string) => Promise<void>;
  setBackgroundImageFromBlob: (blob: Blob, name?: string) => Promise<void>;
  setLogoFromBlob: (blob: Blob, name?: string) => Promise<void>;
  updateElement: (id: string, updates: Partial<BannerElement>) => void;
  setOverride: (bannerId: string, elementId: string, override: Override) => void;
  selectElement: (id: string | null) => void;
  selectBanner: (id: string | null) => void;
  removeElement: (id: string) => void;
  reorderElement: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  setBackground: (bg: BackgroundConfig) => void;
  setBannerPreset: (presetId: BannerPresetId) => void;
  setIsolatedBanner: (bannerId: string | null) => void;
  setLogo: (logo: LogoConfig | null) => void;
  updateLogo: (updates: Partial<LogoConfig>) => void;
  setCTA: (cta: CTAConfig | null) => void;
  updateCTA: (updates: Partial<CTAConfig>) => void;
  setProjectName: (name: string) => void;
  setShowGallery: (show: boolean) => void;
  saveCurrentProject: () => Promise<void>;
  loadProjectById: (id: string) => Promise<void>;
  createNewProject: (name: string, folderId?: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<void>;
  renameProject: (id: string, newName: string) => Promise<void>;
  moveProjectToFolder: (projectId: string, folderId: string | null) => Promise<void>;
  getAllProjects: () => Promise<ProjectSummary[]>;
  getAllFolders: () => Promise<Folder[]>;
  createFolder: (name: string, color?: string) => Promise<void>;
  renameFolder: (id: string, newName: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  saveToLocalStorage: () => Promise<void>;
  loadFromLocalStorage: () => Promise<boolean>;
  saveProject: () => Promise<void>;
  loadProject: (jsonString: string) => Promise<void>;
}

const revokeAssets = (assets: EditorAsset[]) => {
  for (const asset of assets) {
    revokeEditorAsset(asset);
  }
};

const collectReferencedAssetSources = ({
  elements,
  background,
  logo,
}: Pick<BannerState, 'elements' | 'background' | 'logo'>) => {
  const sources = new Set<string>();

  for (const element of elements) {
    if (element.type === 'image') {
      sources.add(element.content);
    }
  }

  if (background.type === 'image') {
    sources.add(background.value);
  }

  if (logo) {
    sources.add(logo.image);
  }

  return sources;
};

const pruneUnusedEditorAssets = ({
  editorAssets,
  elements,
  background,
  logo,
}: Pick<BannerState, 'editorAssets' | 'elements' | 'background' | 'logo'>) => {
  const referencedSources = collectReferencedAssetSources({ elements, background, logo });
  const nextAssets: EditorAsset[] = [];

  for (const asset of editorAssets) {
    if (referencedSources.has(asset.src)) {
      nextAssets.push(asset);
      continue;
    }

    revokeEditorAsset(asset);
  }

  return nextAssets;
};

const buildNextEditorAssets = (
  state: Pick<BannerState, 'editorAssets' | 'elements' | 'background' | 'logo'>,
  updates: Partial<Pick<BannerState, 'editorAssets' | 'elements' | 'background' | 'logo'>>,
) =>
  pruneUnusedEditorAssets({
    editorAssets: updates.editorAssets ?? state.editorAssets,
    elements: updates.elements ?? state.elements,
    background: updates.background ?? state.background,
    logo: updates.logo ?? state.logo,
  });

const replaceEditorAssets = (
  set: (partial: Partial<BannerState>) => void,
  nextAssets: EditorAsset[],
  previousAssets: EditorAsset[],
) => {
  revokeAssets(previousAssets);
  set({ editorAssets: nextAssets });
};

const getAssetBySrc = (assets: EditorAsset[], src: string) =>
  assets.find((asset) => asset.src === src);

const mergeOverride = (existing: Override | undefined, nextOverride: Override): Override => {
  const merged = { ...(existing ?? {}), ...nextOverride };
  if (existing?.style && nextOverride.style) {
    merged.style = { ...existing.style, ...nextOverride.style };
  }
  return merged;
};

const hasMeaningfulOverride = (override: Override | undefined) =>
  Boolean(
    override &&
      (override.content !== undefined ||
        override.x !== undefined ||
        override.y !== undefined ||
        override.width !== undefined ||
        override.height !== undefined ||
        override.rotation !== undefined ||
        override.scale !== undefined ||
        override.aspectRatio !== undefined ||
        (override.style && Object.keys(override.style).length > 0)),
  );

const stripOverridePatch = (existing: Override | undefined, patch: Override): Override | undefined => {
  if (!existing) return existing;

  const nextOverride: Override = { ...existing };

  if (patch.content !== undefined) delete nextOverride.content;
  if (patch.x !== undefined) delete nextOverride.x;
  if (patch.y !== undefined) delete nextOverride.y;
  if (patch.width !== undefined) delete nextOverride.width;
  if (patch.height !== undefined) delete nextOverride.height;
  if (patch.rotation !== undefined) delete nextOverride.rotation;
  if (patch.scale !== undefined) delete nextOverride.scale;
  if (patch.aspectRatio !== undefined) delete nextOverride.aspectRatio;

  if (patch.style) {
    const nextStyle = { ...(nextOverride.style ?? {}) };
    for (const styleKey of Object.keys(patch.style) as Array<keyof NonNullable<Override['style']>>) {
      delete nextStyle[styleKey];
    }

    if (Object.keys(nextStyle).length > 0) {
      nextOverride.style = nextStyle;
    } else {
      delete nextOverride.style;
    }
  }

  return hasMeaningfulOverride(nextOverride) ? nextOverride : undefined;
};

const isGlobalSquareMaster = (banner: BannerSize | undefined) =>
  Boolean(banner?.isMaster && banner.category === 'square');

const shouldSquareMasterStripOverride = (
  targetBanner: BannerSize | undefined,
  sourceBannerId: string,
  currentOverride: Override,
) =>
  targetBanner?.id === sourceBannerId ||
  Boolean(targetBanner?.isMaster) ||
  Boolean(currentOverride.isAutoPropagated);

const applyPatchToElement = (element: BannerElement, patch: Override): BannerElement => ({
  ...element,
  ...(patch.content !== undefined ? { content: patch.content } : {}),
  ...(patch.x !== undefined ? { x: patch.x } : {}),
  ...(patch.y !== undefined ? { y: patch.y } : {}),
  ...(patch.width !== undefined ? { width: patch.width } : {}),
  ...(patch.height !== undefined ? { height: patch.height } : {}),
  ...(patch.rotation !== undefined ? { rotation: patch.rotation } : {}),
  ...(patch.aspectRatio !== undefined ? { aspectRatio: patch.aspectRatio } : {}),
  ...(patch.style ? { style: { ...element.style, ...patch.style } } : {}),
});

const buildStoredAssetValue = async (
  value: string,
  editorAssets: EditorAsset[],
  pendingAssets: Map<string, ProjectAssetRecord>,
) => {
  const existingAsset = getAssetBySrc(editorAssets, value);
  if (existingAsset) {
    pendingAssets.set(existingAsset.id, {
      assetId: existingAsset.id,
      blob: existingAsset.blob,
    });
    return createStoredAssetRef(existingAsset.id);
  }

  if (isDataUrl(value)) {
    const blob = await dataUrlToBlob(value);
    const asset = await createEditorAssetFromBlob(blob);
    pendingAssets.set(asset.id, { assetId: asset.id, blob: asset.blob });
    return createStoredAssetRef(asset.id);
  }

  return value;
};

const serializeProject = async (state: BannerState, projectId: string): Promise<{
  document: StoredProjectDocument;
  assets: ProjectAssetRecord[];
}> => {
  const assetRecords = new Map<string, ProjectAssetRecord>();
  const serializedElements = [];

  for (const element of state.elements) {
    const content =
      element.type === 'image'
        ? await buildStoredAssetValue(element.content, state.editorAssets, assetRecords)
        : element.content;
    serializedElements.push({ ...element, content });
  }

  const background: StoredProjectDocument['background'] =
    state.background.type === 'image'
      ? {
          ...state.background,
          value: await buildStoredAssetValue(state.background.value, state.editorAssets, assetRecords),
        }
      : state.background;

  const logo = state.logo
    ? {
        ...state.logo,
        image: await buildStoredAssetValue(state.logo.image, state.editorAssets, assetRecords),
      }
    : null;

  return {
    document: {
      version: '2.0',
      id: projectId,
      name: state.projectName,
      lastModified: Date.now(),
      folderId: state.currentFolderId,
      thumbnail: undefined,
      bannerPresetId: state.bannerPresetId,
      elements: serializedElements,
      overrides: state.overrides,
      bannerSizes: state.bannerSizes,
      background,
      logo,
      cta: state.cta,
    },
    assets: [...assetRecords.values()],
  };
};

const resolveStoredValue = async (
  value: string | { kind: 'project-asset'; assetId: string },
  projectId: string,
  assets: EditorAsset[],
) => {
  if (typeof value === 'string') return value;
  if (!isStoredAssetRef(value)) return '';

  const existing = assets.find((asset) => asset.id === value.assetId);
  if (existing) return existing.src;

  const blob = await getProjectAssetBlob(projectId, value.assetId);
  if (!blob) return '';

  const asset = await createEditorAssetFromBlob(blob, { id: value.assetId });
  assets.push(asset);
  return asset.src;
};

const hydrateStoredProject = async (document: StoredProjectDocument): Promise<{
  project: SavedProject;
  editorAssets: EditorAsset[];
}> => {
  const editorAssets: EditorAsset[] = [];
  const elements: BannerElement[] = [];

  for (const element of document.elements) {
    const content = await resolveStoredValue(element.content, document.id, editorAssets);
    elements.push({ ...element, content });
  }

  const background: BackgroundConfig =
    document.background.type === 'image'
      ? {
          ...document.background,
          value: await resolveStoredValue(document.background.value, document.id, editorAssets),
        }
      : {
          ...document.background,
          value: document.background.value as string,
        };

  const logo = document.logo
    ? {
        ...document.logo,
        image: await resolveStoredValue(document.logo.image, document.id, editorAssets),
      }
    : null;

  return {
    project: {
      id: document.id,
      name: document.name,
      lastModified: document.lastModified,
      folderId: document.folderId ?? null,
      thumbnail: document.thumbnail,
      bannerPresetId: document.bannerPresetId,
      elements,
      overrides: document.overrides,
      bannerSizes: normalizeBannerSizesForPreset(document.bannerPresetId, document.bannerSizes),
      background,
      logo,
      cta: document.cta,
    },
    editorAssets,
  };
};

const buildPortableProject = async (state: BannerState): Promise<PortableProjectFile> => {
  const referencedAssetSources = collectReferencedAssetSources(state);
  const referencedAssets = state.editorAssets.filter((asset) => referencedAssetSources.has(asset.src));
  const assets = await Promise.all(
    referencedAssets.map(async (asset) => ({
      assetId: asset.id,
      name: asset.name,
      mimeType: asset.mimeType,
      dataUrl: await blobToDataUrl(asset.blob),
    })),
  );
  const assetIds = new Set(assets.map((asset) => asset.assetId));
  const toPortableValue = (value: string) => {
    const asset = getAssetBySrc(state.editorAssets, value);
    if (asset && assetIds.has(asset.id)) {
      return createStoredAssetRef(asset.id);
    }
    return value;
  };

  return {
    version: '2.0',
    projectName: state.projectName,
    bannerPresetId: state.bannerPresetId,
    lastSaved: Date.now(),
    elements: state.elements.map((element) => ({
      ...element,
      content: element.type === 'image' ? toPortableValue(element.content) : element.content,
    })),
    overrides: state.overrides,
    bannerSizes: normalizeBannerSizesForPreset(state.bannerPresetId, state.bannerSizes),
    background: (state.background.type === 'image'
      ? { ...state.background, value: toPortableValue(state.background.value) }
      : state.background) as PortableProjectFile['background'],
    logo: state.logo ? { ...state.logo, image: toPortableValue(state.logo.image) } : null,
    cta: state.cta,
    assets,
  };
};

const hydratePortableProject = async (
  data: PortableProjectFile,
): Promise<{
  bannerPresetId: BannerPresetId;
  bannerSizes: BannerSize[];
  elements: BannerElement[];
  overrides: Record<string, Record<string, Override>>;
  background: BackgroundConfig;
  logo: LogoConfig | null;
  cta: CTAConfig | null;
  editorAssets: EditorAsset[];
  projectName: string;
  lastSaved: number | null;
}> => {
  const editorAssets = await Promise.all(
    (data.assets ?? []).map(async (asset) =>
      createEditorAssetFromBlob(await dataUrlToBlob(asset.dataUrl), {
        id: asset.assetId,
        name: asset.name,
      }),
    ),
  );

  const resolvePortableValue = async (
    value: string | { kind: 'project-asset'; assetId: string },
  ): Promise<string> => {
    if (typeof value === 'string') {
      if (isDataUrl(value)) {
        const asset = await createEditorAssetFromBlob(await dataUrlToBlob(value));
        editorAssets.push(asset);
        return asset.src;
      }
      return value;
    }

    const asset = editorAssets.find((item) => item.id === value.assetId);
    return asset?.src ?? '';
  };

  const elements: BannerElement[] = [];
  for (const element of data.elements) {
    const content = await resolvePortableValue(element.content);
    elements.push({ ...element, content });
  }

  const background: BackgroundConfig =
    data.background.type === 'image'
      ? {
          ...data.background,
          value: await resolvePortableValue(data.background.value),
        }
      : {
          ...data.background,
          value: data.background.value as string,
        };

  const logo = data.logo
    ? {
        ...data.logo,
        image: await resolvePortableValue(data.logo.image),
      }
    : null;

  return {
    bannerPresetId: getFallbackPresetId(data.bannerPresetId),
    bannerSizes: normalizeBannerSizesForPreset(
      getFallbackPresetId(data.bannerPresetId),
      data.bannerSizes ?? getBannerSizesForPreset(getFallbackPresetId(data.bannerPresetId)),
    ),
    elements,
    overrides: data.overrides ?? {},
    background,
    logo,
    cta: data.cta ?? null,
    editorAssets,
    projectName: data.projectName ?? 'Imported Campaign',
    lastSaved: data.lastSaved ?? null,
  };
};

const getDefaultBannerSizes = () => getBannerSizesForPreset(defaultBannerPresetId);

export const useBannerStore = create<BannerState>((set, get) => ({
  elements: createDefaultElements(),
  overrides: {},
  selectedElementId: null,
  selectedBannerId: null,
  bannerPresetId: defaultBannerPresetId,
  bannerSizes: getDefaultBannerSizes(),
  background: createDefaultBackground(),
  isolatedBannerId: null,
  logo: createDefaultLogo(),
  cta: createDefaultCTA(),
  projectName: 'Untitled Campaign',
  currentProjectId: null,
  currentFolderId: null,
  lastSaved: null,
  showGallery: true,
  editorAssets: [],

  addElement: (type, content, shapeType, dimensions) =>
    set((state) => {
      const currentBanner =
        state.bannerSizes.find((banner) => banner.id === state.selectedBannerId) ??
        state.bannerSizes.find((banner) => banner.isMaster) ??
        state.bannerSizes[0];

      let widthPercent = 0;
      let heightPercent = 0;
      let aspectRatio = 1;

      if (type === 'image' && dimensions) {
        aspectRatio = dimensions.width / dimensions.height;
        widthPercent = (dimensions.width / currentBanner.width) * 100;
        const targetPixelHeight = dimensions.width / aspectRatio;
        heightPercent = (targetPixelHeight / currentBanner.height) * 100;
      } else {
        const targetPixelWidth = Math.min(300, currentBanner.width * 0.4);
        widthPercent = (targetPixelWidth / currentBanner.width) * 100;

        if (type === 'shape' && shapeType !== 'button') {
          aspectRatio = 1;
          const targetPixelHeight = targetPixelWidth / aspectRatio;
          heightPercent = (targetPixelHeight / currentBanner.height) * 100;
        } else if (type === 'button') {
          aspectRatio = 3;
          const targetPixelHeight = targetPixelWidth / aspectRatio;
          heightPercent = (targetPixelHeight / currentBanner.height) * 100;
        } else {
          aspectRatio = type === 'text' ? 4 : 1.5;
          const targetPixelHeight = targetPixelWidth / aspectRatio;
          heightPercent = (targetPixelHeight / currentBanner.height) * 100;
        }
      }

      return {
        elements: [
          ...state.elements,
          {
            id: uuidv4(),
            type,
            content,
            x: 50 - widthPercent / 2,
            y: 50 - heightPercent / 2,
            width: widthPercent,
            height: heightPercent,
            rotation: 0,
            aspectRatioLocked: type === 'shape' ? false : true,
            aspectRatio,
            shapeType:
              type === 'shape'
                ? ((shapeType as BannerElement['shapeType']) ?? 'rectangle')
                : undefined,
            style:
              type === 'text'
                ? { color: '#000000', fontSize: '100px', fontFamily: 'Inter' }
                : type === 'button'
                  ? {
                       backgroundColor: '#19C37D',
                      color: '#ffffff',
                      fontSize: '60px',
                      borderRadius: '8px',
                      fontFamily: 'Inter',
                    }
                  : {},
          },
        ],
      };
    }),

  addImageElementFromBlob: async (blob, name) => {
    const asset = await createEditorAssetFromBlob(blob, { name });
    set((state) => ({ editorAssets: [...state.editorAssets, asset] }));
    get().addElement('image', asset.src, undefined, {
      width: asset.width ?? 300,
      height: asset.height ?? 300,
    });
  },

  setBackgroundImageFromBlob: async (blob, name) => {
    const asset = await createEditorAssetFromBlob(blob, { name });
    set((state) => {
      const background = { type: 'image', value: asset.src } as BackgroundConfig;
      return {
        background,
        editorAssets: buildNextEditorAssets(state, {
          background,
          editorAssets: [...state.editorAssets, asset],
        }),
      };
    });
  },

  setLogoFromBlob: async (blob, name) => {
    const asset = await createEditorAssetFromBlob(blob, { name });
    set((state) => {
      const logo = {
        image: asset.src,
        position: state.logo?.position ?? 'top-left',
        size: state.logo?.size ?? 15,
        padding: state.logo?.padding ?? 20,
      } satisfies LogoConfig;

      return {
        logo,
        editorAssets: buildNextEditorAssets(state, {
          logo,
          editorAssets: [...state.editorAssets, asset],
        }),
      };
    });
  },

  updateElement: (id, updates) =>
    set((state) => ({
      elements: state.elements.map((element) =>
        element.id === id ? { ...element, ...updates } : element,
      ),
    })),

  setOverride: (bannerId, elementId, override) =>
    set((state) => {
      const banner = state.bannerSizes.find((item) => item.id === bannerId);

      if (!state.isolatedBannerId && isGlobalSquareMaster(banner)) {
        const elements = state.elements.map((element) =>
          element.id === elementId ? applyPatchToElement(element, override) : element,
        );

        const bannerById = new Map(state.bannerSizes.map((item) => [item.id, item]));
        const nextOverrides = Object.fromEntries(
          Object.entries(state.overrides)
            .map(([targetBannerId, targetOverrides]) => {
              const currentOverride = targetOverrides[elementId];
              if (!currentOverride) {
                return [targetBannerId, targetOverrides];
              }

              const shouldStrip = shouldSquareMasterStripOverride(
                bannerById.get(targetBannerId),
                bannerId,
                currentOverride,
              );
              if (!shouldStrip) {
                return [targetBannerId, targetOverrides];
              }

              const strippedOverride = stripOverridePatch(currentOverride, override);
              if (!strippedOverride) {
                const remainingOverrides = { ...targetOverrides };
                delete remainingOverrides[elementId];
                return [targetBannerId, remainingOverrides];
              }

              return [
                targetBannerId,
                {
                  ...targetOverrides,
                  [elementId]: strippedOverride,
                },
              ];
            })
            .filter(([, targetOverrides]) => Object.keys(targetOverrides).length > 0),
        );

        return {
          elements,
          overrides: nextOverrides,
          editorAssets: buildNextEditorAssets(state, { elements }),
        };
      }

      const nextOverrides = { ...state.overrides };
      nextOverrides[bannerId] = {
        ...(nextOverrides[bannerId] ?? {}),
        [elementId]: mergeOverride(nextOverrides[bannerId]?.[elementId], {
          ...override,
          isAutoPropagated: false,
        }),
      };

      if (state.isolatedBannerId) {
        return { overrides: nextOverrides };
      }

      if (banner?.isMaster) {
        for (const target of state.bannerSizes) {
          if (target.id === banner.id || target.category !== banner.category) continue;
          nextOverrides[target.id] = {
            ...(nextOverrides[target.id] ?? {}),
            [elementId]: mergeOverride(nextOverrides[target.id]?.[elementId], {
              ...override,
              isAutoPropagated: true,
            }),
          };
        }
      }

      return { overrides: nextOverrides };
    }),

  selectElement: (id) => set({ selectedElementId: id }),
  selectBanner: (id) => set({ selectedBannerId: id }),
  setBannerPreset: (presetId) =>
    set({
      bannerPresetId: presetId,
      bannerSizes: normalizeBannerSizesForPreset(presetId, getBannerSizesForPreset(presetId)),
      selectedBannerId: null,
      isolatedBannerId: null,
    }),
  setIsolatedBanner: (bannerId) => set({ isolatedBannerId: bannerId }),
  setLogo: (logo) =>
    set((state) => ({
      logo,
      editorAssets: buildNextEditorAssets(state, { logo }),
    })),
  updateLogo: (updates) =>
    set((state) => ({
      logo: state.logo ? { ...state.logo, ...updates } : null,
    })),
  setCTA: (cta) => set({ cta }),
  updateCTA: (updates) =>
    set((state) => ({
      cta: state.cta ? { ...state.cta, ...updates } : null,
    })),
  setProjectName: (name) => set({ projectName: name }),
  setShowGallery: (show) => set({ showGallery: show }),

  getAllProjects: async () => listProjects(),
  getAllFolders: async () => listFolders(),

  createFolder: async (name, color) => {
    await createFolderRecord({
      id: uuidv4(),
      name,
      color: color || '#19C37D',
      createdAt: Date.now(),
    });
  },

  renameFolder: async (id, newName) => {
    await renameFolderRecord(id, newName);
  },

  deleteFolder: async (id) => {
    await deleteFolderRecord(id);
    if (get().currentFolderId === id) {
      set({ currentFolderId: null });
    }
  },

  moveProjectToFolder: async (projectId, folderId) => {
    await moveProjectRecord(projectId, folderId);
    if (get().currentProjectId === projectId) {
      set({ currentFolderId: folderId });
    }
  },

  saveCurrentProject: async () => {
    const state = get();
    const projectId = state.currentProjectId ?? `project-${Date.now()}`;
    const { document, assets } = await serializeProject(state, projectId);

    try {
      await saveProjectDocument(document, assets);
      set({
        currentProjectId: projectId,
        currentFolderId: document.folderId ?? null,
        lastSaved: document.lastModified,
      });
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Failed to save project. Your browser storage might be full.');
    }
  },

  loadProjectById: async (id) => {
    const document = await getProjectDocument(id);
    if (!document) {
      alert('Project not found');
      return;
    }

    const { project, editorAssets } = await hydrateStoredProject(document);
    const previousAssets = get().editorAssets;
    replaceEditorAssets(set, editorAssets, previousAssets);
    set({
      currentProjectId: project.id,
      currentFolderId: project.folderId ?? null,
      projectName: project.name,
      bannerPresetId: project.bannerPresetId,
      elements: project.elements,
      overrides: project.overrides,
      bannerSizes: project.bannerSizes.length
        ? normalizeBannerSizesForPreset(project.bannerPresetId, project.bannerSizes)
        : getBannerSizesForPreset(project.bannerPresetId),
      background: project.background,
      logo: project.logo,
      cta: project.cta,
      lastSaved: project.lastModified,
      selectedElementId: null,
      selectedBannerId: null,
      isolatedBannerId: null,
      showGallery: false,
    });
  },

  createNewProject: async (name, folderId) => {
    const previousAssets = get().editorAssets;
    replaceEditorAssets(set, [], previousAssets);
    set({
      currentProjectId: null,
      currentFolderId: folderId ?? null,
      projectName: name,
      bannerPresetId: defaultBannerPresetId,
      bannerSizes: getBannerSizesForPreset(defaultBannerPresetId),
      elements: createNewProjectElements(),
      overrides: {},
      background: createDefaultBackground(),
      logo: createDefaultLogo(),
      cta: createDefaultCTA(),
      lastSaved: null,
      selectedElementId: null,
      selectedBannerId: null,
      isolatedBannerId: null,
      showGallery: false,
    });
    await get().saveCurrentProject();
  },

  deleteProject: async (id) => {
    await deleteProjectRecord(id);
    if (get().currentProjectId === id) {
      const previousAssets = get().editorAssets;
      replaceEditorAssets(set, [], previousAssets);
      set({
        currentProjectId: null,
        currentFolderId: null,
        projectName: 'Untitled Campaign',
        bannerPresetId: defaultBannerPresetId,
        bannerSizes: getBannerSizesForPreset(defaultBannerPresetId),
        elements: createDefaultElements(),
        overrides: {},
        background: createDefaultBackground(),
        logo: createDefaultLogo(),
        cta: createDefaultCTA(),
        lastSaved: null,
        selectedElementId: null,
        selectedBannerId: null,
        isolatedBannerId: null,
      });
    }
  },

  duplicateProject: async (id) => {
    const source = await getProjectDocument(id);
    if (!source) return;

    const duplicateId = `project-${Date.now()}`;
    await duplicateProjectRecord(id, duplicateId, `${source.name} (Copy)`);
  },

  renameProject: async (id, newName) => {
    await renameProjectRecord(id, newName);
    if (get().currentProjectId === id) {
      set({ projectName: newName });
    }
  },

  saveToLocalStorage: async () => {
    await get().saveCurrentProject();
  },

  loadFromLocalStorage: async () => {
    const projects = await listProjects();
    if (projects.length === 0) return false;
    const mostRecent = [...projects].sort((left, right) => right.lastModified - left.lastModified)[0];
    await get().loadProjectById(mostRecent.id);
    return true;
  },

  removeElement: (id) =>
    set((state) => {
      const elements = state.elements.filter((element) => element.id !== id);
      return {
        elements,
        editorAssets: buildNextEditorAssets(state, { elements }),
        selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
      };
    }),

  reorderElement: (id, direction) =>
    set((state) => {
      const index = state.elements.findIndex((element) => element.id === id);
      if (index === -1) return state;

      const elements = [...state.elements];
      const [moved] = elements.splice(index, 1);

      if (direction === 'up' && index < elements.length) {
        elements.splice(index + 1, 0, moved);
      } else if (direction === 'down' && index > 0) {
        elements.splice(index - 1, 0, moved);
      } else if (direction === 'top') {
        elements.push(moved);
      } else if (direction === 'bottom') {
        elements.unshift(moved);
      } else {
        elements.splice(index, 0, moved);
      }

      return { elements };
    }),

  setBackground: (background) =>
    set((state) => ({
      background,
      editorAssets: buildNextEditorAssets(state, { background }),
    })),

  saveProject: async () => {
    const state = get();
    const portableProject = await buildPortableProject(state);
    const blob = new Blob([JSON.stringify(portableProject, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = getBackupFilename(state.projectName);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  },

  loadProject: async (jsonString) => {
    try {
      const rawData = JSON.parse(jsonString) as PortableProjectFile | Record<string, unknown>;
      const previousAssets = get().editorAssets;
      const normalizedData: PortableProjectFile =
        rawData.version === '2.0'
          ? (rawData as PortableProjectFile)
          : {
              version: '2.0',
              projectName: (rawData.projectName as string) || 'Imported Campaign',
              bannerPresetId: getFallbackPresetId(rawData.bannerPresetId as string | undefined),
              lastSaved: (rawData.lastSaved as number) || Date.now(),
              elements: (rawData.elements as PortableProjectFile['elements']) ?? [],
              overrides:
                (rawData.overrides as Record<string, Record<string, Override>>) ?? {},
              bannerSizes: normalizeBannerSizesForPreset(
                getFallbackPresetId(rawData.bannerPresetId as string | undefined),
                (rawData.bannerSizes as BannerSize[]) ??
                  getBannerSizesForPreset(
                    getFallbackPresetId(rawData.bannerPresetId as string | undefined),
                  ),
              ),
              background: (rawData.background as PortableProjectFile['background']) ?? createDefaultBackground(),
              logo: (rawData.logo as PortableProjectFile['logo']) ?? null,
              cta: (rawData.cta as CTAConfig | null) ?? null,
              assets: [],
            };

      if (!normalizedData.elements || !normalizedData.background) {
        alert('Invalid project file');
        return;
      }

      const hydrated = await hydratePortableProject(normalizedData);
      replaceEditorAssets(set, hydrated.editorAssets, previousAssets);
      set({
        currentProjectId: null,
        currentFolderId: null,
        elements: hydrated.elements,
        overrides: hydrated.overrides,
        background: hydrated.background,
        bannerPresetId: hydrated.bannerPresetId,
        bannerSizes: hydrated.bannerSizes,
        isolatedBannerId: null,
        logo: hydrated.logo,
        cta: hydrated.cta,
        projectName: hydrated.projectName,
        lastSaved: hydrated.lastSaved,
        selectedElementId: null,
        selectedBannerId: null,
        showGallery: false,
      });
    } catch (error) {
      console.error('Failed to load project:', error);
      alert('Failed to load project file');
    }
  },
}));
