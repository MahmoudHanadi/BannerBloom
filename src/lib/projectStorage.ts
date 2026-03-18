import { del, get, set } from 'idb-keyval';
import type {
  BackgroundConfig,
  BannerElement,
  BannerPresetId,
  BannerSize,
  CTAConfig,
  Folder,
  LogoConfig,
  Override,
  ProjectSummary,
} from '../types/banner';

export interface StoredAssetRef {
  kind: 'project-asset';
  assetId: string;
}

export interface StoredProjectDocument extends ProjectSummary {
  version: '2.0';
  elements: Array<Omit<BannerElement, 'content'> & { content: string | StoredAssetRef }>;
  overrides: Record<string, Record<string, Override>>;
  bannerSizes: BannerSize[];
  background: Omit<BackgroundConfig, 'value'> & { value: string | StoredAssetRef };
  logo: (Omit<LogoConfig, 'image'> & { image: string | StoredAssetRef }) | null;
  cta: CTAConfig | null;
}

export interface ProjectAssetRecord {
  assetId: string;
  blob: Blob;
}

const PROJECT_INDEX_KEY = 'banner-spore-project-index-v2';
const FOLDER_INDEX_KEY = 'banner-spore-folder-index-v2';
const PROJECT_KEY_PREFIX = 'banner-spore-project-v2:';
const PROJECT_ASSET_KEY_PREFIX = 'banner-spore-project-asset-v2:';

const getProjectKey = (projectId: string) => `${PROJECT_KEY_PREFIX}${projectId}`;
const getProjectAssetKey = (projectId: string, assetId: string) =>
  `${PROJECT_ASSET_KEY_PREFIX}${projectId}:${assetId}`;

const readProjectIndex = async (): Promise<ProjectSummary[]> =>
  (await get<ProjectSummary[]>(PROJECT_INDEX_KEY)) ?? [];

const writeProjectIndex = async (index: ProjectSummary[]) => {
  await set(PROJECT_INDEX_KEY, index);
};

export const listProjects = async () => readProjectIndex();

export const getProjectDocument = async (projectId: string) =>
  (await get<StoredProjectDocument>(getProjectKey(projectId))) ?? null;

export const getProjectAssetBlob = async (projectId: string, assetId: string) =>
  (await get<Blob>(getProjectAssetKey(projectId, assetId))) ?? null;

export const saveProjectDocument = async (
  document: StoredProjectDocument,
  assets?: ProjectAssetRecord[],
) => {
  const previous = await getProjectDocument(document.id);
  const nextAssetIds = new Set((assets ?? []).map((asset) => asset.assetId));
  const previousAssetIds = previous ? collectProjectAssetIds(previous) : [];

  await set(getProjectKey(document.id), document);
  if (assets) {
    await Promise.all(
      assets.map((asset) => set(getProjectAssetKey(document.id, asset.assetId), asset.blob)),
    );
  }

  if (assets) {
    await Promise.all(
      previousAssetIds
        .filter((assetId) => !nextAssetIds.has(assetId))
        .map((assetId) => del(getProjectAssetKey(document.id, assetId))),
    );
  }

  const index = await readProjectIndex();
  const summary: ProjectSummary = {
    id: document.id,
    name: document.name,
    lastModified: document.lastModified,
    folderId: document.folderId ?? null,
    thumbnail: document.thumbnail,
    bannerPresetId: document.bannerPresetId,
    elementCount: document.elements.length,
  };
  const existingIndex = index.findIndex((project) => project.id === document.id);

  if (existingIndex >= 0) {
    index[existingIndex] = summary;
  } else {
    index.push(summary);
  }

  await writeProjectIndex(index);
};

export const renameProjectRecord = async (projectId: string, name: string) => {
  const document = await getProjectDocument(projectId);
  if (!document) return;

  const updatedDocument = { ...document, name, lastModified: Date.now() };
  await saveProjectDocument(updatedDocument);
};

export const moveProjectRecord = async (projectId: string, folderId: string | null) => {
  const document = await getProjectDocument(projectId);
  if (!document) return;

  const updatedDocument = { ...document, folderId, lastModified: Date.now() };
  await saveProjectDocument(updatedDocument);
};

export const deleteProjectRecord = async (projectId: string) => {
  const document = await getProjectDocument(projectId);
  if (document) {
    await Promise.all(
      collectProjectAssetIds(document).map((assetId) =>
        del(getProjectAssetKey(projectId, assetId)),
      ),
    );
  }

  await del(getProjectKey(projectId));
  const index = await readProjectIndex();
  await writeProjectIndex(index.filter((project) => project.id !== projectId));
};

export const duplicateProjectRecord = async (
  sourceProjectId: string,
  duplicateProjectId: string,
  duplicateName: string,
) => {
  const source = await getProjectDocument(sourceProjectId);
  if (!source) return null;

  const clonedDocument: StoredProjectDocument = {
    ...source,
    id: duplicateProjectId,
    name: duplicateName,
    lastModified: Date.now(),
  };

  const assetIds = collectProjectAssetIds(source);
  const clonedAssets: ProjectAssetRecord[] = [];

  for (const assetId of assetIds) {
    const blob = await getProjectAssetBlob(sourceProjectId, assetId);
    if (blob) {
      clonedAssets.push({ assetId, blob });
    }
  }

  await saveProjectDocument(clonedDocument, clonedAssets);
  return clonedDocument;
};

export const listFolders = async () => (await get<Folder[]>(FOLDER_INDEX_KEY)) ?? [];

export const saveFolders = async (folders: Folder[]) => {
  await set(FOLDER_INDEX_KEY, folders);
};

export const createFolderRecord = async (folder: Folder) => {
  const folders = await listFolders();
  folders.push(folder);
  await saveFolders(folders);
};

export const renameFolderRecord = async (folderId: string, name: string) => {
  const folders = await listFolders();
  const folder = folders.find((item) => item.id === folderId);
  if (!folder) return;

  folder.name = name;
  await saveFolders(folders);
};

export const deleteFolderRecord = async (folderId: string) => {
  const folders = await listFolders();
  await saveFolders(folders.filter((folder) => folder.id !== folderId));

  const projects = await listProjects();
  for (const project of projects.filter((item) => item.folderId === folderId)) {
    const document = await getProjectDocument(project.id);
    if (!document) continue;

    const updatedDocument = { ...document, folderId: null, lastModified: Date.now() };
    await saveProjectDocument(updatedDocument);
  }
};

export const collectProjectAssetIds = (project: StoredProjectDocument) => {
  const assetIds = new Set<string>();

  for (const element of project.elements) {
    if (typeof element.content !== 'string' && element.content.kind === 'project-asset') {
      assetIds.add(element.content.assetId);
    }
  }

  if (typeof project.background.value !== 'string' && project.background.value.kind === 'project-asset') {
    assetIds.add(project.background.value.assetId);
  }

  if (project.logo && typeof project.logo.image !== 'string' && project.logo.image.kind === 'project-asset') {
    assetIds.add(project.logo.image.assetId);
  }

  return [...assetIds];
};

export const createStoredAssetRef = (assetId: string): StoredAssetRef => ({
  kind: 'project-asset',
  assetId,
});

export const isStoredAssetRef = (value: unknown): value is StoredAssetRef =>
  typeof value === 'object' &&
  value !== null &&
  'kind' in value &&
  (value as { kind?: string }).kind === 'project-asset' &&
  'assetId' in value;

export const getFallbackPresetId = (
  value: string | undefined,
): BannerPresetId =>
  value === 'google-responsive-display' || value === 'meta-social'
    ? value
    : 'google-ads-upload';
