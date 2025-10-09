import { useLoader } from '@react-three/fiber';
import { observer } from 'mobx-react';
import { useEffect, useRef } from "react";
import { Mesh, TextureLoader, Color, MeshBasicMaterial} from 'three';
import { useModelContext } from '../../state/ModelUIStateContext';

interface SkySphereProps {
  texturePath?: string;
}

const SkySphere = ({ texturePath }: SkySphereProps) => {
  const viewerState = useModelContext().viewerState;
  const skySphereRef = useRef<Mesh>(null);

  const materialRef = useRef<MeshBasicMaterial>(null!);

  const skyTexture = useLoader(TextureLoader, viewerState.defaultSkyTextures[viewerState.skyTextureIndex]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.needsUpdate = true; // forces recompilation
    }
  }, [viewerState.useTexture, viewerState.backgroundColor, skyTexture]);

  return (
    <mesh name="SkySphere" ref={skySphereRef} renderOrder={-1} visible={viewerState.skyVisible}>
      <sphereGeometry args={[50, 60, 40]} />
      <meshBasicMaterial
        ref={materialRef}
        attach="material"
        map={viewerState.useTexture ? skyTexture : null}
        color={viewerState.useTexture ? new Color("#ffffff") : new Color(viewerState.backgroundColor)}
        side={2} // THREE.BackSide
        depthWrite={false}
      />
    </mesh>
  );
};

export default observer(SkySphere);
