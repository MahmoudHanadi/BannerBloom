import React, { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, Download, Info, Loader2 } from 'lucide-react';
import { getBannerPreset } from '../config/bannerPresets';
import {
  isSizeLimitIssue,
  validateExportSelection,
  validateGeneratedArtifact,
} from '../lib/export/bannerValidation';
import { useBannerStore } from '../store/bannerStore';
import type { ExportType } from '../store/bannerStore';
import type { BannerSize, ExportValidationIssue } from '../types/banner';

const isMasterBanner = (banner: BannerSize) =>
  banner.isMaster ||
  banner.name.toLowerCase().includes('master') ||
  banner.name.toLowerCase().includes('source');

const downloadBlob = (blob: Blob, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.style.display = 'none';

  document.body.appendChild(link);

  setTimeout(() => {
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }, 100);
  }, 0);
};

const hasBlockingErrors = (issues: ExportValidationIssue[], allowSizeLimitBypass = false) =>
  issues.some(
    (issue) => issue.level === 'error' && (!allowSizeLimitBypass || !isSizeLimitIssue(issue)),
  );

const isDynamicImportFailure = (message: string) =>
  message.includes('Failed to fetch dynamically imported module') ||
  message.includes('Importing a module script failed');

export const ExportPanel: React.FC = () => {
  const bannerPresetId = useBannerStore((state) => state.bannerPresetId);
  const bannerSizes = useBannerStore((state) => state.bannerSizes);
  const elements = useBannerStore((state) => state.elements);
  const overrides = useBannerStore((state) => state.overrides);
  const selectElement = useBannerStore((state) => state.selectElement);

  const preset = useMemo(() => getBannerPreset(bannerPresetId), [bannerPresetId]);
  const exportableBanners = useMemo(
    () => bannerSizes.filter((banner) => banner.exportable !== false && !isMasterBanner(banner)),
    [bannerSizes],
  );

  const [selectedBanners, setSelectedBanners] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<ExportType | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [validationIssues, setValidationIssues] = useState<ExportValidationIssue[]>([]);
  const [ignoreSizeLimits, setIgnoreSizeLimits] = useState(false);

  const toggleBannerSelection = (bannerId: string) => {
    setSelectedBanners((previous) => {
      const next = new Set(previous);
      if (next.has(bannerId)) {
        next.delete(bannerId);
      } else {
        next.add(bannerId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedBanners(new Set(exportableBanners.map((banner) => banner.id)));
  };

  const deselectAll = () => {
    setSelectedBanners(new Set());
  };

  const runExport = async (type: ExportType) => {
    const bannersToExport =
      selectedBanners.size > 0
        ? exportableBanners.filter((banner) => selectedBanners.has(banner.id))
        : exportableBanners;

    const preflightIssues = validateExportSelection(preset, bannersToExport, type);
    setValidationIssues(preflightIssues);

    if (hasBlockingErrors(preflightIssues)) {
      return;
    }

    setIsExporting(true);
    setExportType(type);
    selectElement(null);

    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

    try {
      const { renderSelectedBanners, packageRenderedBanners } = await import(
        '../lib/export/exportService'
      );
      const renderedBanners = await renderSelectedBanners({
        banners: bannersToExport,
        elements,
        overrideMap: overrides,
      });

      const packaged = await packageRenderedBanners({
        preset,
        type,
        renderedBanners,
      });

      const generatedIssues = packaged.perBannerSizes.flatMap(({ banner, size }) =>
        validateGeneratedArtifact(preset, type, banner, size),
      );
      const nextIssues = [...preflightIssues, ...generatedIssues];
      setValidationIssues(nextIssues);

      if (hasBlockingErrors(generatedIssues, ignoreSizeLimits)) {
        return;
      }

      downloadBlob(packaged.blob, packaged.filename);
    } catch (error) {
      console.error('Export failed:', error);
      const runtimeMessage = error instanceof Error ? error.message : 'Failed to export banners.';
      setValidationIssues([
        ...preflightIssues,
        {
          id: 'runtime-export-error',
          level: 'error',
          code: 'runtime-error',
          message: isDynamicImportFailure(runtimeMessage)
            ? 'Export tools failed to load. BannerBloom was likely updated in the background. Refresh the page and try again.'
            : runtimeMessage,
        },
      ]);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const renderValidationIssue = (issue: ExportValidationIssue) => {
    const Icon = issue.level === 'error' ? AlertTriangle : Info;
    const styles =
      issue.level === 'error'
        ? 'border-red-200 bg-red-50 text-red-800'
        : issue.level === 'warning'
          ? 'border-amber-200 bg-amber-50 text-amber-800'
          : 'border-teal-200 bg-teal-50 text-teal-800';

    return (
      <div
        key={issue.id}
        className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${styles}`}
      >
        <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>{issue.message}</span>
      </div>
    );
  };

  const actionButton = (type: ExportType, label: string, className: string) => {
    const isPresetSupported = preset.supportedExportTypes.includes(type);
    const isCurrentExport = isExporting && exportType === type;

    return (
      <button
        onClick={() => void runExport(type)}
        disabled={isExporting || !isPresetSupported}
        className={`
          flex-1 rounded-xl px-4 py-3 font-semibold text-white shadow-md transition-all duration-200
          flex items-center justify-center gap-2
          ${
            !isPresetSupported
              ? 'cursor-not-allowed bg-gray-300'
              : isCurrentExport
                ? 'cursor-wait bg-gray-500'
                : isExporting
                  ? 'cursor-not-allowed bg-gray-400'
                  : className
          }
        `}
      >
        {isCurrentExport ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Download size={18} />
            <span>{label}</span>
          </>
        )}
      </button>
    );
  };

  return (
    <div className="studio-export-panel border-t transition-all duration-300">
      <div
        className="flex cursor-pointer items-center justify-between px-6 py-4 hover:bg-white/40"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div>
          <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            Deploy outputs
            <ChevronDown
              className={`h-5 w-5 transform transition-transform duration-200 ${
                isCollapsed ? '-rotate-90' : 'rotate-0'
              }`}
            />
          </h3>
          {!isCollapsed && (
            <p className="mt-1 text-sm text-slate-500">
              Select the placements you want and export a production-ready package.
            </p>
          )}
        </div>
        {!isCollapsed && (
          <div className="flex gap-3" onClick={(event) => event.stopPropagation()}>
            <button
              onClick={selectAll}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              Deselect All
            </button>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="space-y-4 px-6 pb-6 pt-0">
          <div className="studio-section-card rounded-[1.1rem] px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
              <span className="font-semibold">Preset:</span>
              <span>{preset.name}</span>
              <span className="text-slate-300">/</span>
              <span>{preset.description}</span>
            </div>
              <p className="mt-2 text-xs text-slate-500">
                Supported outputs: {preset.supportedExportTypes.map((type) => type.toUpperCase()).join(', ')}. Source canvases stay in the editor and are excluded from export.
              </p>
            </div>

          {validationIssues.length > 0 && (
            <div className="space-y-2">{validationIssues.map(renderValidationIssue)}</div>
          )}

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <input
              type="checkbox"
              checked={ignoreSizeLimits}
              onChange={(event) => setIgnoreSizeLimits(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
            />
            <div className="space-y-1">
              <span className="block font-semibold">Ignore size limits and download anyway</span>
              <span className="block text-xs text-amber-800">
                This only bypasses generated file size errors. Unsupported presets and runtime
                failures still block export.
              </span>
            </div>
          </label>

          <div className="grid max-h-48 grid-cols-1 gap-3 overflow-y-auto pr-2 custom-scrollbar sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {exportableBanners.map((banner) => (
              <label
                key={banner.id}
                className={`
                  flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all duration-200
                  ${
                    selectedBanners.has(banner.id)
                      ? 'border-emerald-200 bg-emerald-50 shadow-sm'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                  }
                `}
              >
                <div
                  className={`
                    flex h-5 w-5 items-center justify-center rounded border transition-colors
                    ${
                      selectedBanners.has(banner.id)
                        ? 'border-emerald-600 bg-emerald-600'
                        : 'border-gray-300 bg-white'
                    }
                  `}
                >
                  {selectedBanners.has(banner.id) && (
                    <svg
                      className="h-3.5 w-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={selectedBanners.has(banner.id)}
                  onChange={() => toggleBannerSelection(banner.id)}
                  className="hidden"
                />
                <div className="flex min-w-0 flex-col">
                  <span
                    className={`truncate text-sm font-medium ${
                      selectedBanners.has(banner.id) ? 'text-emerald-900' : 'text-gray-700'
                    }`}
                  >
                    {banner.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {banner.width} x {banner.height}
                  </span>
                  {banner.notes && (
                    <span className="text-[11px] font-medium text-gray-400">{banner.notes}</span>
                  )}
                </div>
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {actionButton(
              'png',
              'Export PNG set',
              'bg-gradient-to-r from-emerald-600 to-teal-600 hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg',
            )}
            {actionButton(
              'html5',
              'Export HTML5 package',
              'bg-gradient-to-r from-teal-600 to-cyan-600 hover:-translate-y-0.5 hover:from-teal-700 hover:to-cyan-700 hover:shadow-lg',
            )}
            {actionButton(
              'amp',
              'Export AMP package',
              'bg-gradient-to-r from-slate-800 to-teal-900 hover:-translate-y-0.5 hover:from-slate-900 hover:to-teal-950 hover:shadow-lg',
            )}
          </div>
        </div>
      )}
    </div>
  );
};
