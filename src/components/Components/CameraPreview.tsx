import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { observer } from 'mobx-react'

interface Props {
  selectedCameraUuid: string | null;
  marginRight?: number;
  size?: { w: number; h: number };
  margin?: number;
}

/**
 * Renders a live thumbnail of the last-selected camera.
 */
export const CameraPreview: React.FC<Props> = ({
  selectedCameraUuid,
  marginRight = 0,
  size = { w: 220, h: 140 },
  margin = 12,
}) => {
  const { gl, scene, size: canvasSize } = useThree();

  const currentCam   = useRef<THREE.Camera | null>(null);
  const fallbackCam  = useRef<THREE.Camera | null>(null);

  useEffect(() => {
    if (!scene || !selectedCameraUuid) {
      currentCam.current = null;
      return;
    }

    const candidate = scene.getObjectByProperty(
      'uuid',
      selectedCameraUuid
    ) as THREE.Camera | null;

    if (candidate?.isCamera) {
      currentCam.current  = candidate;
      fallbackCam.current = candidate;
    } else {
      currentCam.current = null;
    }
  }, [scene, selectedCameraUuid]);

  useFrame(() => {
    const cam = currentCam.current ?? fallbackCam.current;
    if (!cam) return;

    const { w, h } = size;
    const x = canvasSize.width  - w - margin - marginRight;
    const y = canvasSize.height - h - margin;

    gl.autoClear = false;
    gl.clearDepth();
    gl.setScissorTest(true);
    gl.setViewport(x, y, w, h);
    gl.setScissor(x, y, w, h);

    gl.render(scene, cam);

    // Restore defaults
    gl.setScissorTest(false);
    gl.setViewport(0, 0, canvasSize.width, canvasSize.height);
  }, 1);

  return null;
};

export default observer(CameraPreview);