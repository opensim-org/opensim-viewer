import { useLoader} from '@react-three/fiber'
import { observer } from 'mobx-react';
import { useRef } from 'react';
import { Mesh, RepeatWrapping, TextureLoader } from 'three';
import { useModelContext } from '../../state/ModelUIStateContext';

interface OpenSimFloorProps {
  texturePath?: string;
}

const OpenSimFloor = ({ texturePath }: OpenSimFloorProps) => {
    const viewerState = useModelContext().viewerState;
    const floorTexture = useLoader(
      TextureLoader,
      viewerState.defaultFloorTextures[viewerState.textureIndex]
    )
    floorTexture.wrapS = floorTexture.wrapT = RepeatWrapping;
    floorTexture.offset.set(0, 0);
    floorTexture.repeat.set(12, 12);
    const floorColor = "white"
    const floorRef=useRef<Mesh>(null);

    return <>
        <mesh name='Floor' ref={floorRef} rotation-x={-Math.PI / 2} 
                position-y={viewerState.floorHeight} visible={viewerState.floorVisible} receiveShadow >
        {viewerState.floorRound ? (
          <circleGeometry args={[10, 64]} />
        ) : (
          <planeGeometry args={[20, 20]} />
        )}
        <meshPhongMaterial attach="material" color={floorColor} map={floorTexture}/>
        </mesh>
    </>
};

export default observer(OpenSimFloor)
