// helpers/inheritRendererCharacteristics.ts
import { WebGLRenderer, Color } from 'three';

export interface RendererCharacteristics {
  // Color Management & Tone Mapping
  outputColorSpace?: string;
  outputEncoding?: string;
  toneMapping: any;
  toneMappingExposure: number;

  // Lighting Modes
  useLegacyLights?: boolean;
  physicallyCorrectLights?: boolean;

  // Shadows
  shadowMap: {
    enabled: boolean;
    type: any;
    autoUpdate: boolean;
  };

  // Clipping
  localClippingEnabled: boolean;

  // Clear color
  clearColor: Color;
  clearAlpha: number;
}

/**
 * Extracts renderer characteristics from a source WebGLRenderer
 */
export function getRendererCharacteristics(sourceRenderer: WebGLRenderer): RendererCharacteristics {
  const clearColor = new Color();
  sourceRenderer.getClearColor(clearColor);

  return {
    // Color Management & Tone Mapping
    outputColorSpace: (sourceRenderer as any).outputColorSpace,
    outputEncoding: (sourceRenderer as any).outputEncoding,
    toneMapping: sourceRenderer.toneMapping,
    toneMappingExposure: sourceRenderer.toneMappingExposure,

    // Lighting Modes
    useLegacyLights: (sourceRenderer as any).useLegacyLights,
    physicallyCorrectLights: (sourceRenderer as any).physicallyCorrectLights,

    // Shadows
    shadowMap: {
      enabled: sourceRenderer.shadowMap.enabled,
      type: sourceRenderer.shadowMap.type,
      autoUpdate: sourceRenderer.shadowMap.autoUpdate
    },

    // Clipping
    localClippingEnabled: sourceRenderer.localClippingEnabled,

    // Clear color
    clearColor: clearColor,
    clearAlpha: sourceRenderer.getClearAlpha()
  };
}

/**
 * Applies renderer characteristics to a target WebGLRenderer
 */
export function applyRendererCharacteristics(
  targetRenderer: WebGLRenderer,
  characteristics: RendererCharacteristics
): void {
  // 1. Color Management & Tone Mapping
  if (characteristics.outputColorSpace !== undefined) {
    (targetRenderer as any).outputColorSpace = characteristics.outputColorSpace;
  }
  if (characteristics.outputEncoding !== undefined) {
    (targetRenderer as any).outputEncoding = characteristics.outputEncoding;
  }

  targetRenderer.toneMapping = characteristics.toneMapping;
  targetRenderer.toneMappingExposure = characteristics.toneMappingExposure;

  // 2. Lighting Modes
  if (characteristics.useLegacyLights !== undefined) {
    (targetRenderer as any).useLegacyLights = characteristics.useLegacyLights;
  }
  if (characteristics.physicallyCorrectLights !== undefined) {
    (targetRenderer as any).physicallyCorrectLights = characteristics.physicallyCorrectLights;
  }

  // 3. Shadows
  targetRenderer.shadowMap.enabled = characteristics.shadowMap.enabled;
  targetRenderer.shadowMap.type = characteristics.shadowMap.type;
  targetRenderer.shadowMap.autoUpdate = characteristics.shadowMap.autoUpdate;

  // 4. Clipping
  targetRenderer.localClippingEnabled = characteristics.localClippingEnabled;

  // 5. Clear color
  targetRenderer.setClearColor(characteristics.clearColor, characteristics.clearAlpha);
}

/**
 * Convenience function to inherit all characteristics from source renderer to target renderer
 */
export function inheritRendererCharacteristics(
  targetRenderer: WebGLRenderer,
  sourceRenderer: WebGLRenderer
): void {
  const characteristics = getRendererCharacteristics(sourceRenderer);
  applyRendererCharacteristics(targetRenderer, characteristics);
}

/**
 * Convenience function to create a new renderer with inherited characteristics
 */
export function createRendererWithInheritedCharacteristics(
  sourceRenderer: WebGLRenderer,
  options?: {
    preserveDrawingBuffer?: boolean;
    alpha?: boolean;
    antialias?: boolean;
  }
): WebGLRenderer {
  const renderer = new WebGLRenderer({
    preserveDrawingBuffer: options?.preserveDrawingBuffer ?? true,
    alpha: options?.alpha ?? false,
    antialias: options?.antialias ?? true
  });

  inheritRendererCharacteristics(renderer, sourceRenderer);
  return renderer;
}