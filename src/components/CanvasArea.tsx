import React from 'react';
import { useBannerStore } from '../store/bannerStore';
import { BannerRenderer } from './BannerRenderer';
import { calculateElementLayout } from '../utils/layoutUtils';
import { getCategoryMasterSize } from '../config/bannerPresets';

const MIN_WORKSPACE_ZOOM = 0.2;
const MAX_WORKSPACE_ZOOM = 2.5;
const FIT_PADDING = 56;
const MIN_CLEAR_TEXT_ZOOM = 0.9;

type WorkspacePoint = {
  x: number;
  y: number;
};

type WorkspaceSize = {
  width: number;
  height: number;
};

type WorkspaceBounds = WorkspacePoint & WorkspaceSize;

const clampZoom = (zoom: number) =>
  Math.min(MAX_WORKSPACE_ZOOM, Math.max(MIN_WORKSPACE_ZOOM, zoom));

const isEditableTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;

  return (
    !!element &&
    (element.tagName === 'INPUT' ||
      element.tagName === 'TEXTAREA' ||
      element.tagName === 'SELECT' ||
      element.isContentEditable)
  );
};

export const CanvasArea: React.FC = () => {
  const bannerSizes = useBannerStore((state) => state.bannerSizes);
  const elements = useBannerStore((state) => state.elements);
  const overrides = useBannerStore((state) => state.overrides);
  const isolatedBannerId = useBannerStore((state) => state.isolatedBannerId);
  const removeElement = useBannerStore((state) => state.removeElement);
  const selectedElementId = useBannerStore((state) => state.selectedElementId);
  const selectedBannerId = useBannerStore((state) => state.selectedBannerId);
  const addElement = useBannerStore((state) => state.addElement);
  const addImageElementFromBlob = useBannerStore((state) => state.addImageElementFromBlob);
  const setShowGallery = useBannerStore((state) => state.setShowGallery);

  const [isSpacePressed, setIsSpacePressed] = React.useState(false);
  const [isPanning, setIsPanning] = React.useState(false);
  const [workspaceZoom, setWorkspaceZoom] = React.useState(1);
  const [workspaceOffset, setWorkspaceOffset] = React.useState<WorkspacePoint>({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = React.useState<WorkspaceSize>({ width: 0, height: 0 });
  const [workspaceSize, setWorkspaceSize] = React.useState<WorkspaceSize>({ width: 0, height: 0 });

  const viewportRef = React.useRef<HTMLDivElement>(null);
  const workspaceRef = React.useRef<HTMLDivElement>(null);
  const panOriginRef = React.useRef<{
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const hasInitializedViewRef = React.useRef(false);

  const squareBanners = bannerSizes.filter((banner) => banner.category === 'square');
  const horizontalBanners = bannerSizes.filter((banner) => banner.category === 'horizontal');
  const verticalBanners = bannerSizes.filter((banner) => banner.category === 'vertical');
  const isolatedBanner = isolatedBannerId
    ? bannerSizes.find((banner) => banner.id === isolatedBannerId)
    : null;

  const applyZoomAtPoint = React.useCallback(
    (nextZoom: number, anchor: WorkspacePoint) => {
      const clampedZoom = clampZoom(nextZoom);
      const localX = (anchor.x - workspaceOffset.x) / workspaceZoom;
      const localY = (anchor.y - workspaceOffset.y) / workspaceZoom;

      setWorkspaceZoom(clampedZoom);
      setWorkspaceOffset({
        x: anchor.x - localX * clampedZoom,
        y: anchor.y - localY * clampedZoom,
      });
    },
    [workspaceOffset, workspaceZoom],
  );

  const centerWorkspace = React.useCallback(
    (zoomLevel = 1) => {
      if (viewportSize.width === 0 || workspaceSize.width === 0) {
        return;
      }

      const clampedZoom = clampZoom(zoomLevel);
      setWorkspaceZoom(clampedZoom);
      setWorkspaceOffset({
        x: (viewportSize.width - workspaceSize.width * clampedZoom) / 2,
        y: (viewportSize.height - workspaceSize.height * clampedZoom) / 2,
      });
    },
    [viewportSize, workspaceSize],
  );

  const fitBounds = React.useCallback(
    (bounds: WorkspaceBounds, maxZoom = MAX_WORKSPACE_ZOOM) => {
      if (
        viewportSize.width === 0 ||
        viewportSize.height === 0 ||
        bounds.width <= 0 ||
        bounds.height <= 0
      ) {
        return;
      }

      const targetZoom = clampZoom(
        Math.min(
          maxZoom,
          (viewportSize.width - FIT_PADDING * 2) / bounds.width,
          (viewportSize.height - FIT_PADDING * 2) / bounds.height,
        ),
      );

      setWorkspaceZoom(targetZoom);
      setWorkspaceOffset({
        x: (viewportSize.width - bounds.width * targetZoom) / 2 - bounds.x * targetZoom,
        y: (viewportSize.height - bounds.height * targetZoom) / 2 - bounds.y * targetZoom,
      });
    },
    [viewportSize],
  );

  const getFitZoom = React.useCallback(
    (bounds: WorkspaceBounds, maxZoom = MAX_WORKSPACE_ZOOM) => {
      if (
        viewportSize.width === 0 ||
        viewportSize.height === 0 ||
        bounds.width <= 0 ||
        bounds.height <= 0
      ) {
        return null;
      }

      return clampZoom(
        Math.min(
          maxZoom,
          (viewportSize.width - FIT_PADDING * 2) / bounds.width,
          (viewportSize.height - FIT_PADDING * 2) / bounds.height,
        ),
      );
    },
    [viewportSize],
  );

  const fitAll = React.useCallback(() => {
    fitBounds(
      {
        x: 0,
        y: 0,
        width: workspaceSize.width,
        height: workspaceSize.height,
      },
      1,
    );
  }, [fitBounds, workspaceSize]);

  const focusBanner = React.useCallback(
    (bannerId: string | null | undefined) => {
      if (!bannerId || !workspaceRef.current) {
        return;
      }

      const target = workspaceRef.current.querySelector<HTMLElement>(
        `[data-banner-id="${bannerId}"]`,
      );

      if (!target) {
        return;
      }

      const workspaceRect = workspaceRef.current.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      fitBounds(
        {
          x: (targetRect.left - workspaceRect.left) / workspaceZoom,
          y: (targetRect.top - workspaceRect.top) / workspaceZoom,
          width: targetRect.width / workspaceZoom,
          height: targetRect.height / workspaceZoom,
        },
        1.8,
      );
    },
    [fitBounds, workspaceZoom],
  );

  const adjustZoomFromCenter = React.useCallback(
    (direction: 1 | -1) => {
      applyZoomAtPoint(direction > 0 ? workspaceZoom * 1.15 : workspaceZoom / 1.15, {
        x: viewportSize.width / 2,
        y: viewportSize.height / 2,
      });
    },
    [applyZoomAtPoint, viewportSize, workspaceZoom],
  );

  React.useEffect(() => {
    const viewportNode = viewportRef.current;
    const workspaceNode = workspaceRef.current;

    if (!viewportNode || !workspaceNode || typeof ResizeObserver === 'undefined') {
      return;
    }

    const updateSizes = () => {
      setViewportSize({
        width: viewportNode.clientWidth,
        height: viewportNode.clientHeight,
      });
      setWorkspaceSize({
        width: workspaceNode.offsetWidth,
        height: workspaceNode.offsetHeight,
      });
    };

    updateSizes();

    const observer = new ResizeObserver(() => updateSizes());
    observer.observe(viewportNode);
    observer.observe(workspaceNode);

    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (
      hasInitializedViewRef.current ||
      viewportSize.width === 0 ||
      viewportSize.height === 0 ||
      workspaceSize.width === 0 ||
      workspaceSize.height === 0
    ) {
      return;
    }

    const initialZoom = getFitZoom(
      {
        x: 0,
        y: 0,
        width: workspaceSize.width,
        height: workspaceSize.height,
      },
      1,
    );

    if (initialZoom !== null && initialZoom >= MIN_CLEAR_TEXT_ZOOM) {
      fitAll();
    } else {
      centerWorkspace(1);
    }

    hasInitializedViewRef.current = true;
  }, [centerWorkspace, fitAll, getFitZoom, viewportSize, workspaceSize]);

  React.useEffect(() => {
    if (!isolatedBannerId) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      focusBanner(isolatedBannerId);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [focusBanner, isolatedBannerId]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        if (isEditableTarget(event.target)) return;

        const state = useBannerStore.getState();
        const selectedId = state.selectedElementId;

        if (selectedId) {
          event.preventDefault();

          const bannerId = state.selectedBannerId;
          const banner = state.bannerSizes.find((item) => item.id === bannerId);
          const element = state.elements.find((item) => item.id === selectedId);

          if (banner && element) {
            const stepPixels = event.shiftKey ? 10 : 1;
            const layout = calculateElementLayout(
              element,
              state.overrides[banner.id],
              banner.width,
              banner.height,
              banner.category as 'square' | 'horizontal' | 'vertical',
              1,
              getCategoryMasterSize(state.bannerSizes, banner.category)?.height ?? banner.height,
            );

            let newPixelX = layout.pixelX;
            let newPixelY = layout.pixelY;

            switch (event.key) {
              case 'ArrowUp':
                newPixelY -= stepPixels;
                break;
              case 'ArrowDown':
                newPixelY += stepPixels;
                break;
              case 'ArrowLeft':
                newPixelX -= stepPixels;
                break;
              case 'ArrowRight':
                newPixelX += stepPixels;
                break;
            }

            state.setOverride(banner.id, selectedId, {
              x: (newPixelX / banner.width) * 100,
              y: (newPixelY / banner.height) * 100,
            });
          }
        }
      }

      if (event.code === 'Space' && !event.repeat && !isEditableTarget(event.target)) {
        event.preventDefault();
        setIsSpacePressed(true);
      }

      if ((event.metaKey || event.ctrlKey) && event.key === 'h' && !isEditableTarget(event.target)) {
        event.preventDefault();
        setShowGallery(true);
      }

      if ((event.key === 'Backspace' || event.key === 'Delete') && selectedElementId) {
        if (!isEditableTarget(event.target)) {
          event.preventDefault();
          removeElement(selectedElementId);
        }
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      if ((event.key === '=' || event.key === '+') && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        adjustZoomFromCenter(1);
      }

      if (event.key === '-' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        adjustZoomFromCenter(-1);
      }

      if (event.key === '0') {
        event.preventDefault();
        fitAll();
      }

      if (event.key === '1') {
        event.preventDefault();
        centerWorkspace(1);
      }

      if ((event.key === 'f' || event.key === 'F') && selectedBannerId) {
        event.preventDefault();
        focusBanner(selectedBannerId);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
        panOriginRef.current = null;
      }
    };

    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let index = 0; index < items.length; index += 1) {
        if (items[index].type.indexOf('image') !== -1) {
          const blob = items[index].getAsFile();
          if (!blob) continue;
          void addImageElementFromBlob(blob, 'clipboard-image.png');
        }
      }

      const text = event.clipboardData?.getData('text/plain');
      if (text && !isEditableTarget(event.target)) {
        addElement('text', text);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('paste', handlePaste);
    };
  }, [
    addElement,
    addImageElementFromBlob,
    adjustZoomFromCenter,
    centerWorkspace,
    fitAll,
    focusBanner,
    removeElement,
    selectedBannerId,
    selectedElementId,
    setShowGallery,
  ]);

  React.useEffect(() => {
    if (!isPanning) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!panOriginRef.current) {
        return;
      }

      setWorkspaceOffset({
        x: panOriginRef.current.offsetX + (event.clientX - panOriginRef.current.x),
        y: panOriginRef.current.offsetY + (event.clientY - panOriginRef.current.y),
      });
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      panOriginRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning]);

  const handleViewportMouseDownCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 1 && !isSpacePressed) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setIsPanning(true);
    panOriginRef.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: workspaceOffset.x,
      offsetY: workspaceOffset.y,
    };
  };

  const handleViewportWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!viewportRef.current) {
      return;
    }

    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      const rect = viewportRef.current.getBoundingClientRect();
      const zoomFactor = Math.exp(-event.deltaY * 0.002);

      applyZoomAtPoint(workspaceZoom * zoomFactor, {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });

      return;
    }

    setWorkspaceOffset((current) => ({
      x: current.x - event.deltaX,
      y: current.y - event.deltaY,
    }));
  };

  const renderBannerColumn = (banners: typeof bannerSizes, title: string) => (
    <div className="studio-banner-column flex flex-col gap-6 pt-1">
      <h3 className="studio-banner-column-title text-[1.05rem] font-extrabold text-slate-900">{title}</h3>
      {banners.map((size) => (
        <div key={size.id} className="studio-banner-card flex flex-col gap-3">
          <div className="studio-banner-meta">
            <span className="text-[0.95rem] font-bold text-slate-800">{size.name}</span>
            {size.isMaster && (
              <span className="studio-pill studio-badge-master px-2.5 py-1 text-[0.72rem]">
                Source
              </span>
            )}
            <span className="studio-pill studio-badge-size px-2.5 py-1 text-[0.72rem]">
              {size.width} x {size.height}
            </span>
          </div>
          <div className="studio-banner-frame w-fit p-4" data-banner-id={size.id}>
            <BannerRenderer
              bannerId={size.id}
              width={size.width}
              height={size.height}
              elements={elements}
              overrides={overrides[size.id]}
              isMaster={size.isMaster}
              category={size.category}
              interactionScale={workspaceZoom}
            />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={viewportRef}
      className={`studio-canvas-scroll studio-canvas-viewport relative flex-1 overflow-hidden ${isPanning ? 'cursor-grabbing' : isSpacePressed ? 'cursor-grab' : ''}`}
      onMouseDownCapture={handleViewportMouseDownCapture}
      onWheel={handleViewportWheel}
    >
      {isolatedBanner && (
        <div className="pointer-events-none absolute left-6 top-4 z-20">
          <div className="studio-canvas-status flex w-fit items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white/90"></span>
            Placement focus: {isolatedBanner.name}
          </div>
        </div>
      )}

      <div className="absolute right-6 top-4 z-20 flex flex-wrap items-center gap-2 rounded-[1.1rem] border border-white/70 bg-white/88 px-3 py-2 shadow-[0_12px_30px_rgba(15,23,42,0.1)] backdrop-blur-xl">
        <button
          type="button"
          onClick={() => adjustZoomFromCenter(-1)}
          className="studio-button-ghost px-3 py-2 text-sm"
          title="Zoom out (-)"
        >
          -
        </button>
        <button
          type="button"
          onClick={() => centerWorkspace(1)}
          className="studio-button-ghost px-3 py-2 text-sm"
          title="Reset zoom (1)"
        >
          {Math.round(workspaceZoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() => adjustZoomFromCenter(1)}
          className="studio-button-ghost px-3 py-2 text-sm"
          title="Zoom in (+)"
        >
          +
        </button>
        <button
          type="button"
          onClick={fitAll}
          className="studio-button-primary px-3 py-2 text-sm"
          title="Fit all placements (0)"
        >
          Fit all
        </button>
        <button
          type="button"
          onClick={() => focusBanner(selectedBannerId)}
          disabled={!selectedBannerId}
          className="studio-button-ghost px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          title="Focus selected banner (F)"
        >
          Selected
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/60 bg-white/82 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        Space + drag to pan / Ctrl-Cmd + wheel to zoom / 0 fits all
      </div>

      <div
        ref={workspaceRef}
        className={`studio-canvas-workspace ${isSpacePressed ? 'pointer-events-none' : ''}`}
        style={{
          transform: `translate3d(${workspaceOffset.x}px, ${workspaceOffset.y}px, 0) scale(${workspaceZoom})`,
        }}
      >
        <div
          className={`studio-canvas-grid pt-4 ${isSpacePressed ? 'pointer-events-none' : ''}`}
          style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
        >
          {renderBannerColumn(squareBanners, 'Square formats (1:1)')}
          {renderBannerColumn(horizontalBanners, 'Landscape formats')}
          {renderBannerColumn(verticalBanners, 'Vertical formats')}
        </div>
      </div>
    </div>
  );
};
