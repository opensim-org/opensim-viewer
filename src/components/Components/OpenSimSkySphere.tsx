import { useLoader } from '@react-three/fiber';
import { observer } from 'mobx-react';
import { useRef } from 'react';
import { Mesh, TextureLoader } from 'three';
import { useModelContext } from '../../state/ModelUIStateContext';

interface SkySphereProps {
  texturePath: string;
}

const SkySphere = ({ texturePath }: SkySphereProps) => {
  const viewerState = useModelContext().viewerState;
  const skyTexture = useLoader(TextureLoader, viewerState.defaultSkyTextures[viewerState.skyTextureIndex]);
  const skySphereRef = useRef<Mesh>(null);

  return <>
      <mesh
        name="SkySphere"
        ref={skySphereRef}
        renderOrder={-1}
      >
        <sphereGeometry args={[50, 60, 40]} />
        <meshBasicMaterial
          attach="material"
          map={skyTexture}
          side={2} // THREE.BackSide
          depthWrite={false}
        />
      </mesh>
    </>
};

export default observer(SkySphere);