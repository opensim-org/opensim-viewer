// utils/watermarkUtils.tsx
import { WebGLRenderer, Scene, Camera } from 'three';

// Variables
let canvasWidthPercentage = 0.1 // 10% of canvas width
let watermarkMaxSize = 150 // Maximum size in pixels
let watermarkMinSize = 50 // At least 8% of height or 50px
let watermarkSizeRelativePercentage = 0.08 // At least 8% of height or 50px

let watermarkMinPadding = 10 // Minimum size in pixels
let watermarkMaxPadding = 20 // At least 5% of height or 20px
let watermarkPaddingRelativePercentage = 0.05 // At least 5% of height or 20px

let watermarkTransparency = 0.85

// Cache for loaded watermark image
let watermarkImageCache: HTMLImageElement | null = null;
let watermarkLoadPromise: Promise<HTMLImageElement> | null = null;

// Draw watermark on canvas context
export const drawWatermark = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  watermarkImage: HTMLImageElement
): void => {
  if (!watermarkImage) return;

  // Calculate watermark size - consistent relative to video dimensions
  const relativeSize = Math.min(
    canvasWidth * canvasWidthPercentage,
    watermarkMaxSize,
    Math.max(watermarkMinSize, canvasHeight * watermarkSizeRelativePercentage)
  );

  // Maintain aspect ratio
  const aspectRatio = watermarkImage.width / watermarkImage.height;
  const watermarkWidth = relativeSize;
  const watermarkHeight = relativeSize / aspectRatio;

  // Position at bottom left with padding
  const padding = Math.max(watermarkMinPadding, Math.min(canvasWidth * watermarkPaddingRelativePercentage, watermarkMaxPadding)); // 2% padding, min 10px, max 20px
  const x = padding;
  const y = canvasHeight - watermarkHeight - padding;

  // Draw with slight transparency
  ctx.save();
  ctx.globalAlpha = watermarkTransparency;
  ctx.drawImage(watermarkImage, x, y, watermarkWidth, watermarkHeight);
  ctx.restore();
};

// Load watermark image with caching
export const loadWatermarkImage = async (watermarkPath: string = '/assets/opensimLogo23.png'): Promise<HTMLImageElement> => {
  // Return cached image if available
  if (watermarkImageCache) {
    return watermarkImageCache;
  }

  // If already loading, wait for that promise
  if (watermarkLoadPromise) {
    return watermarkLoadPromise;
  }

  // Create new load promise
  watermarkLoadPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      watermarkImageCache = img;
      watermarkLoadPromise = null;
      resolve(img);
    };
    img.onerror = () => {
      watermarkLoadPromise = null;
      reject(new Error(`Failed to load watermark image: ${watermarkPath}`));
    };
    img.src = watermarkPath;
  });

  return watermarkLoadPromise;
};

// Check if watermark is ready
export const isWatermarkReady = (): boolean => {
  return watermarkImageCache !== null;
};

// Get cached watermark image (throws if not loaded)
export const getWatermarkImage = (): HTMLImageElement => {
  if (!watermarkImageCache) {
    throw new Error('Watermark image not loaded. Call loadWatermarkImage first.');
  }
  return watermarkImageCache;
};

// Utility to add watermark to an existing canvas
export const addWatermarkToCanvas = (
  canvas: HTMLCanvasElement,
  watermarkImage: HTMLImageElement
): HTMLCanvasElement => {
  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = canvas.width;
  resultCanvas.height = canvas.height;
  const ctx = resultCanvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Draw original canvas content
  ctx.drawImage(canvas, 0, 0);

  // Add watermark
  drawWatermark(ctx, canvas.width, canvas.height, watermarkImage);

  return resultCanvas;
};

// Render scene with watermark (for snapshot use)
export const renderSceneWithWatermark = async (
  scene: Scene,
  camera: Camera,
  renderWidth: number,
  renderHeight: number,
  transparentBackground: boolean = false,
  cropOptions?: {
    cropWidth: number;
    cropHeight: number;
    cropOffsetX: number;
    cropOffsetY: number;
  },
  watermarkEnabled: boolean = true
): Promise<string> => {
  // Create temporary renderer
  const tempRenderer = new WebGLRenderer({
    preserveDrawingBuffer: true,
    alpha: transparentBackground,
    antialias: true
  });

  tempRenderer.setSize(renderWidth, renderHeight);
  tempRenderer.setPixelRatio(1);

  // Set clear color
  if (transparentBackground) {
    tempRenderer.setClearColor(0x000000, 0);
  } else {
    tempRenderer.setClearColor(0xffffff, 1);
  }

  // Render scene
  tempRenderer.render(scene, camera);

  // Read pixels
  const glContext = tempRenderer.getContext();
  const buffer = new Uint8Array(renderWidth * renderHeight * 4);
  glContext.readPixels(0, 0, renderWidth, renderHeight, glContext.RGBA, glContext.UNSIGNED_BYTE, buffer);

  // Create canvas from buffer
  const fullCanvas = document.createElement('canvas');
  fullCanvas.width = renderWidth;
  fullCanvas.height = renderHeight;
  const fullCtx = fullCanvas.getContext('2d');

  if (!fullCtx) {
    tempRenderer.dispose();
    throw new Error('Could not get canvas context');
  }

  const imageData = fullCtx.createImageData(renderWidth, renderHeight);

  // Flip Y (WebGL reads from bottom)
  for (let y = 0; y < renderHeight; y++) {
    for (let x = 0; x < renderWidth; x++) {
      const src = ((renderHeight - y - 1) * renderWidth + x) * 4;
      const dst = (y * renderWidth + x) * 4;
      imageData.data[dst] = buffer[src];
      imageData.data[dst + 1] = buffer[src + 1];
      imageData.data[dst + 2] = buffer[src + 2];
      imageData.data[dst + 3] = buffer[src + 3];
    }
  }

  fullCtx.putImageData(imageData, 0, 0);

  // Crop if needed
  let finalCanvas = fullCanvas;
  if (cropOptions) {
    finalCanvas = document.createElement('canvas');
    finalCanvas.width = cropOptions.cropWidth;
    finalCanvas.height = cropOptions.cropHeight;
    const finalCtx = finalCanvas.getContext('2d');

    if (finalCtx) {
      finalCtx.drawImage(
        fullCanvas,
        cropOptions.cropOffsetX, cropOptions.cropOffsetY,
        cropOptions.cropWidth, cropOptions.cropHeight,
        0, 0, cropOptions.cropWidth, cropOptions.cropHeight
      );
    }
  }

  // Add watermark if enabled and not transparent background (or always if desired)
  if (watermarkEnabled && watermarkImageCache) {
    try {
      finalCanvas = addWatermarkToCanvas(finalCanvas, watermarkImageCache);
    } catch (error) {
      console.error('Failed to add watermark to snapshot:', error);
    }
  }

  // Convert to data URL
  const dataURL = finalCanvas.toDataURL('image/png');

  // Clean up
  tempRenderer.dispose();

  return dataURL;
};