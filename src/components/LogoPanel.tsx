import React, { useRef, useState, useEffect } from 'react';
import { useBannerStore } from '../store/bannerStore';
import { Image as ImageIcon, X, Upload, ChevronDown, ChevronUp, Edit, Check, Crop, Square, RectangleHorizontal } from 'lucide-react';
import type { LogoPosition } from '../store/bannerStore';

export const LogoPanel: React.FC = () => {
  const logo = useBannerStore((state) => state.logo);
  const setLogo = useBannerStore((state) => state.setLogo);
  const updateLogo = useBannerStore((state) => state.updateLogo);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [cropAspectRatio, setCropAspectRatio] = useState<'square' | 'rectangle'>('square');
  const [cropArea, setCropArea] = useState({ x: 10, y: 10, width: 80, height: 80 });
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const editCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  const positions: { value: LogoPosition; label: string; icon: string }[] = [
    { value: 'top-left', label: 'Top Left', icon: '↖️' },
    { value: 'top-center', label: 'Top Center', icon: '⬆️' },
    { value: 'top-right', label: 'Top Right', icon: '↗️' },
    { value: 'center', label: 'Center', icon: '⏺️' },
    { value: 'bottom-left', label: 'Bottom Left', icon: '↙️' },
    { value: 'bottom-center', label: 'Bottom Center', icon: '⬇️' },
    { value: 'bottom-right', label: 'Bottom Right', icon: '↘️' },
  ];

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setEditingImage(e.target.result as string);
          setIsEditing(true);
          setIsExpanded(true);
          // Reset crop area for new image
          setCropArea({ x: 10, y: 10, width: 80, height: 80 });
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  // Draw the editing canvas with crop overlay
  useEffect(() => {
    if (isEditing && editingImage && editCanvasRef.current) {
      const canvas = editCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        imageObjRef.current = img;
        
        // Set canvas size to fit container (300x300)
        const maxSize = 300;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // Draw image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Draw crop overlay
        const cropX = (cropArea.x / 100) * canvas.width;
        const cropY = (cropArea.y / 100) * canvas.height;
        const cropW = (cropArea.width / 100) * canvas.width;
        const cropH = (cropArea.height / 100) * canvas.height;

        // Darken outside area
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, cropY);
        ctx.fillRect(0, cropY, cropX, cropH);
        ctx.fillRect(cropX + cropW, cropY, canvas.width - cropX - cropW, cropH);
        ctx.fillRect(0, cropY + cropH, canvas.width, canvas.height - cropY - cropH);

        // Draw crop border
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.strokeRect(cropX, cropY, cropW, cropH);

        // Draw corner handles
        const handleSize = 8;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#3b82f6';
        [[cropX, cropY], [cropX + cropW, cropY], [cropX, cropY + cropH], [cropX + cropW, cropY + cropH]].forEach(([x, y]) => {
          ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
          ctx.strokeRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
        });
      };
      img.src = editingImage;
    }
  }, [isEditing, editingImage, cropArea]);

  const handleCropApply = () => {
    if (!imageObjRef.current || !editCanvasRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageObjRef.current;
    const displayScale = Math.min(300 / img.width, 300 / img.height);
    
    // Calculate crop in original image coordinates
    const cropX = (cropArea.x / 100) * img.width;
    const cropY = (cropArea.y / 100) * img.height;
    const cropW = (cropArea.width / 100) * img.width;
    const cropH = (cropArea.height / 100) * img.height;

    canvas.width = cropW;
    canvas.height = cropH;

    // Draw cropped area
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    // Convert to base64
    const croppedImage = canvas.toDataURL('image/png');

    // Set logo
    setLogo({
      image: croppedImage,
      position: logo?.position || 'top-left',
      size: logo?.size || 15,
      padding: logo?.padding || 20,
    });

    setIsEditing(false);
    setEditingImage(null);
  };

  const handleCropAspectChange = (aspect: 'square' | 'rectangle') => {
    setCropAspectRatio(aspect);
    if (aspect === 'square') {
      // Force square crop
      const size = Math.min(cropArea.width, cropArea.height);
      setCropArea({ ...cropArea, width: size, height: size });
    } else {
      // Rectangle: 16:9 or similar
      const width = cropArea.width;
      const height = width * 0.625; // 16:10 ratio
      setCropArea({ ...cropArea, height: Math.min(height, 90 - cropArea.y) });
    }
  };

  const handleRemoveLogo = () => {
    if (confirm('Remove logo from all banners?')) {
      setLogo(null);
      setIsExpanded(false);
    }
  };

  return (
    <>
      <div className="flex-shrink-0 border-t border-gray-200 pt-4 mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            w-full flex items-center justify-between p-3 rounded-lg transition-all
            ${logo 
              ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 hover:border-purple-300' 
              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <ImageIcon className={`w-4 h-4 ${logo ? 'text-purple-600' : 'text-gray-600'}`} />
            <span className={`text-sm font-bold uppercase tracking-wide ${logo ? 'text-purple-900' : 'text-gray-700'}`}>
              Global Logo
              {logo && <span className="ml-2 text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">Active</span>}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {logo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveLogo();
                }}
                className="text-red-600 hover:text-red-800 p-1 hover:bg-red-100 rounded transition-colors"
                title="Remove logo"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-3">
            {!logo ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md font-medium transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload & Crop Logo
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  You'll be able to crop and adjust before adding
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Logo Preview */}
                <div className="relative bg-gray-50 border border-gray-200 rounded-md p-3 flex items-center justify-center">
                  <img
                    src={logo.image}
                    alt="Logo"
                    className="max-h-16 max-w-full object-contain"
                  />
                </div>

                {/* Position Selection */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">
                    Position
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {positions.map((pos) => (
                      <button
                        key={pos.value}
                        onClick={() => updateLogo({ position: pos.value })}
                        className={`
                          p-2 text-xs font-medium rounded border transition-all
                          ${logo.position === pos.value
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                          }
                        `}
                        title={pos.label}
                      >
                        <div className="text-base mb-0.5">{pos.icon}</div>
                        <div className="text-[9px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                          {pos.label.split(' ')[0]}<br/>{pos.label.split(' ')[1] || ''}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Slider */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">
                    Size: {logo.size}% of banner width
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="1"
                    value={logo.size}
                    onChange={(e) => updateLogo({ size: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>Small (5%)</span>
                    <span>Large (40%)</span>
                  </div>
                </div>

                {/* Padding Slider */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">
                    Padding: {logo.padding}px from edges
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={logo.padding}
                    onChange={(e) => updateLogo({ padding: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>No padding</span>
                    <span>Max (50px)</span>
                  </div>
                </div>

                {/* Change Logo */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-md text-xs font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Change & Recrop Logo
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Crop Modal */}
      {isEditing && editingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Crop Your Logo</h3>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingImage(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Aspect Ratio Selection */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Choose Shape
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCropAspectChange('square')}
                  className={`
                    flex-1 px-4 py-2 rounded-md border-2 transition-all flex items-center justify-center gap-2
                    ${cropAspectRatio === 'square'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                    }
                  `}
                >
                  <Square className="w-4 h-4" />
                  Square (1:1)
                </button>
                <button
                  onClick={() => handleCropAspectChange('rectangle')}
                  className={`
                    flex-1 px-4 py-2 rounded-md border-2 transition-all flex items-center justify-center gap-2
                    ${cropAspectRatio === 'rectangle'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                    }
                  `}
                >
                  <RectangleHorizontal className="w-4 h-4" />
                  Rectangle
                </button>
              </div>
            </div>

            {/* Canvas for cropping */}
            <div className="mb-4 bg-gray-100 rounded-md p-2 flex items-center justify-center">
              <canvas
                ref={editCanvasRef}
                className="max-w-full max-h-[300px] cursor-crosshair"
                onMouseDown={(e) => {
                  const canvas = editCanvasRef.current;
                  if (!canvas) return;
                  const rect = canvas.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / canvas.width) * 100;
                  const y = ((e.clientY - rect.top) / canvas.height) * 100;
                  
                  // Simple drag to adjust crop area position
                  const cropX = cropArea.x;
                  const cropY = cropArea.y;
                  const cropW = cropArea.width;
                  const cropH = cropArea.height;
                  
                  if (x >= cropX && x <= cropX + cropW && y >= cropY && y <= cropY + cropH) {
                    // Start dragging
                    const startX = x - cropX;
                    const startY = y - cropY;
                    
                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const newRect = canvas.getBoundingClientRect();
                      const newX = ((moveEvent.clientX - newRect.left) / canvas.width) * 100;
                      const newY = ((moveEvent.clientY - newRect.top) / canvas.height) * 100;
                      
                      setCropArea({
                        ...cropArea,
                        x: Math.max(0, Math.min(100 - cropArea.width, newX - startX)),
                        y: Math.max(0, Math.min(100 - cropArea.height, newY - startY)),
                      });
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }
                }}
              />
            </div>

            {/* Crop Size Controls */}
            <div className="mb-4 space-y-2">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Crop Size: {Math.round(cropArea.width)}%
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="1"
                  value={cropArea.width}
                  onChange={(e) => {
                    const newWidth = parseInt(e.target.value);
                    const newHeight = cropAspectRatio === 'square' ? newWidth : newWidth * 0.625;
                    setCropArea({
                      x: Math.min(cropArea.x, 100 - newWidth),
                      y: Math.min(cropArea.y, 100 - newHeight),
                      width: newWidth,
                      height: newHeight,
                    });
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-4 text-center">
              💡 Drag the blue box to reposition, use slider to resize
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingImage(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCropApply}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Apply Logo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
