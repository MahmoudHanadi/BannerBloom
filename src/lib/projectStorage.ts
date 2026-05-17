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
  TemplateSummary,
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

export interface StoredTemplateDocument extends TemplateSummary {
  version: '1.0';
  elements: Array<Omit<BannerElement, 'content'> & { content: string | StoredAssetRef }>;
  overrides: Record<string, Record<string, Override>>;
  bannerSizes: BannerSize[];
  background: Omit<BackgroundConfig, 'value'> & { value: string | StoredAssetRef };
  outputPackHint?: BannerPresetId | null;
}

export interface ProjectAssetRecord {
  assetId: string;
  blob: Blob;
}

const PROJECT_INDEX_KEY = 'banner-spore-project-index-v2';
const FOLDER_INDEX_KEY = 'banner-spore-folder-index-v2';
const PROJECT_KEY_PREFIX = 'banner-spore-project-v2:';
const PROJECT_ASSET_KEY_PREFIX = 'banner-spore-project-asset-v2:';
const TEMPLATE_INDEX_KEY = 'banner-spore-template-index-v1';
const TEMPLATE_KEY_PREFIX = 'banner-spore-template-v1:';
const TEMPLATE_ASSET_KEY_PREFIX = 'banner-spore-template-asset-v1:';

const getProjectKey = (projectId: string) => `${PROJECT_KEY_PREFIX}${projectId}`;
const getProjectAssetKey = (projectId: string, assetId: string) =>
  `${PROJECT_ASSET_KEY_PREFIX}${projectId}:${assetId}`;
const getTemplateKey = (templateId: string) => `${TEMPLATE_KEY_PREFIX}${templateId}`;
const getTemplateAssetKey = (templateId: string, assetId: string) =>
  `${TEMPLATE_ASSET_KEY_PREFIX}${templateId}:${assetId}`;

const readProjectIndex = async (): Promise<ProjectSummary[]> =>
  (await get<ProjectSummary[]>(PROJECT_INDEX_KEY)) ?? [];

const writeProjectIndex = async (index: ProjectSummary[]) => {
  await set(PROJECT_INDEX_KEY, index);
};

const readTemplateIndex = async (): Promise<TemplateSummary[]> => {
  const index =
    (await get<Array<TemplateSummary & { outputPackHint?: BannerPresetId | null }>>(TEMPLATE_INDEX_KEY)) ?? [];

  return index.map((template) => ({
    id: template.id,
    name: template.name,
    lastModified: template.lastModified,
    thumbnail: template.thumbnail,
    elementCount: template.elementCount,
    bannerPresetId:
      template.bannerPresetId ?? getFallbackPresetId(template.outputPackHint ?? undefined),
  }));
};

const writeTemplateIndex = async (index: TemplateSummary[]) => {
  await set(TEMPLATE_INDEX_KEY, index);
};

export const listProjects = async () => readProjectIndex();

export const getProjectDocument = async (projectId: string) =>
  (await get<StoredProjectDocument>(getProjectKey(projectId))) ?? null;

export const getProjectAssetBlob = async (projectId: string, assetId: string) =>
  (await get<Blob>(getProjectAssetKey(projectId, assetId))) ?? null;

export const listTemplates = async () => readTemplateIndex();

export const getTemplateDocument = async (templateId: string) =>
  (await get<StoredTemplateDocument>(getTemplateKey(templateId))) ?? null;

export const getTemplateAssetBlob = async (templateId: string, assetId: string) =>
  (await get<Blob>(getTemplateAssetKey(templateId, assetId))) ?? null;

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
    templateId: document.templateId ?? null,
  };
  const existingIndex = index.findIndex((project) => project.id === document.id);

  if (existingIndex >= 0) {
    index[existingIndex] = summary;
  } else {
    index.push(summary);
  }

  await writeProjectIndex(index);
};

export const saveTemplateDocument = async (
  document: StoredTemplateDocument,
  assets?: ProjectAssetRecord[],
) => {
  const previous = await getTemplateDocument(document.id);
  const nextAssetIds = new Set((assets ?? []).map((asset) => asset.assetId));
  const previousAssetIds = previous ? collectTemplateAssetIds(previous) : [];

  await set(getTemplateKey(document.id), document);
  if (assets) {
    await Promise.all(
      assets.map((asset) => set(getTemplateAssetKey(document.id, asset.assetId), asset.blob)),
    );
  }

  if (assets) {
    await Promise.all(
      previousAssetIds
        .filter((assetId) => !nextAssetIds.has(assetId))
        .map((assetId) => del(getTemplateAssetKey(document.id, assetId))),
    );
  }

  const index = await readTemplateIndex();
  const summary: TemplateSummary = {
    id: document.id,
    name: document.name,
    lastModified: document.lastModified,
    thumbnail: document.thumbnail,
    elementCount: document.elements.length,
    bannerPresetId:
      document.bannerPresetId ?? getFallbackPresetId(document.outputPackHint ?? undefined),
  };
  const existingIndex = index.findIndex((template) => template.id === document.id);

  if (existingIndex >= 0) {
    index[existingIndex] = summary;
  } else {
    index.push(summary);
  }

  await writeTemplateIndex(index);
};

export const renameProjectRecord = async (projectId: string, name: string) => {
  const document = await getProjectDocument(projectId);
  if (!document) return;

  const updatedDocument = { ...document, name, lastModified: Date.now() };
  await saveProjectDocument(updatedDocument);
};

export const renameTemplateRecord = async (templateId: string, name: string) => {
  const document = await getTemplateDocument(templateId);
  if (!document) return;

  const updatedDocument = { ...document, name, lastModified: Date.now() };
  await saveTemplateDocument(updatedDocument);
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

export const deleteTemplateRecord = async (templateId: string) => {
  const document = await getTemplateDocument(templateId);
  if (document) {
    await Promise.all(
      collectTemplateAssetIds(document).map((assetId) =>
        del(getTemplateAssetKey(templateId, assetId)),
      ),
    );
  }

  await del(getTemplateKey(templateId));
  const index = await readTemplateIndex();
  await writeTemplateIndex(index.filter((template) => template.id !== templateId));
};

export const duplicateTemplateRecord = async (
  sourceTemplateId: string,
  duplicateTemplateId: string,
  duplicateName: string,
) => {
  const source = await getTemplateDocument(sourceTemplateId);
  if (!source) return null;

  const clonedDocument: StoredTemplateDocument = {
    ...source,
    id: duplicateTemplateId,
    name: duplicateName,
    lastModified: Date.now(),
  };

  const assetIds = collectTemplateAssetIds(source);
  const clonedAssets: ProjectAssetRecord[] = [];

  for (const assetId of assetIds) {
    const blob = await getTemplateAssetBlob(sourceTemplateId, assetId);
    if (blob) {
      clonedAssets.push({ assetId, blob });
    }
  }

  await saveTemplateDocument(clonedDocument, clonedAssets);
  return clonedDocument;
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

export const collectTemplateAssetIds = (template: StoredTemplateDocument) => {
  const assetIds = new Set<string>();

  for (const element of template.elements) {
    if (typeof element.content !== 'string' && element.content.kind === 'project-asset') {
      assetIds.add(element.content.assetId);
    }
  }

  if (
    typeof template.background.value !== 'string' &&
    template.background.value.kind === 'project-asset'
  ) {
    assetIds.add(template.background.value.assetId);
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
  value === 'google-responsive-display' || value === 'meta-social' || value === 'web-app-global'
    ? value
    : 'google-ads-upload';
