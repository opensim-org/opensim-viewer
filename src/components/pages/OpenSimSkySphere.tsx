import { useTexture } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { observer } from 'mobx-react';

interface SkySphereProps {
  texturePath: string;
}

const SkySphere: React.FC<SkySphereProps> = observer(({ texturePath }) => {
  // Load 360 sky texture
  const skyTexture = useTexture(texturePath);
  const skySphereRef = useRef<THREE.Mesh>(null);

  const skyGeometry = new THREE.SphereGeometry(50, 60, 40);
  const skyMaterial = new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide,
    depthWrite: false,
  });

  return (
    <mesh
      name="SkySphere"
      ref={skySphereRef}
      geometry={skyGeometry}
      material={skyMaterial}
      renderOrder={-1} // Ensure it renders first as background
    />
  );
});

export default SkySphere;