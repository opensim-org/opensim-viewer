import { useTexture } from '@react-three/drei';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useModelContext } from '../../state/ModelUIStateContext';
import { observer } from 'mobx-react';
import { useFrame } from '@react-three/fiber';

const SkySphere = () => {  
  
  const viewerState = useModelContext().viewerState;
  // Load 360 sky texture
  const [skyTexture, setCurrentTexture] = useState<THREE.Texture>()
  
  const skySphereRef = useRef<THREE.Mesh>(null);
  const [currentTextureIndex, setTextureIndex] = useState<number>(viewerState.skyTextureIndex);

  const skyGeometry = new THREE.SphereGeometry(20, 60, 40);
  const skyMaterial = new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide,
    depthWrite: false,
  });
  useFrame((state, delta) => {
    if (currentTextureIndex !== viewerState.skyTextureIndex) {
      setTextureIndex(viewerState.skyTextureIndex)
      if (viewerState.skyTextureIndex >= 0)
        setCurrentTexture(new THREE.TextureLoader().load(viewerState.defaultSkyTextures[viewerState.skyTextureIndex]));
    }
  });
  return (
    <mesh
      ref={skySphereRef}
      geometry={skyGeometry}
      material={skyMaterial}
      renderOrder={-1} // Ensure it renders first as background
      visible={viewerState.skyVisible}
    />
  );
};

export default observer(SkySphere);