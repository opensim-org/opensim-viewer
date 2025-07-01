import React from 'react';
import { useThree } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';

export function SceneTreeBridge({
  onSceneReady,
  onCameraReady
}: {
  onSceneReady: (scene: THREE.Scene) => void;
  onCameraReady: (camera: THREE.Camera) => void;
}) {
  const { camera, scene } = useThree();

  React.useEffect(() => {
    onSceneReady(scene);
    onCameraReady(camera);
  }, [scene, camera]);

  return null; // nothing is rendered inside Canvas
}

export default SceneTreeBridge;