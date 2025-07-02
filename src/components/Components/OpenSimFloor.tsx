import { useLoader} from '@react-three/fiber'
import { observer } from 'mobx-react';
import { useRef } from 'react';
import { Mesh, RepeatWrapping, TextureLoader } from 'three';
import viewerState from '../../state/ViewerState';
import { useModelContext } from '../../state/ModelUIStateContext';

const OpenSimFloor = () => {
    const relativePath='/assets/images'
    const floorTextures =  [ 
        useLoader(TextureLoader, relativePath + '/tile.jpg'),
        useLoader(TextureLoader, relativePath + '/wood-floor.jpg'),
        useLoader(TextureLoader, relativePath + '/Cobblestone.png'),
        useLoader(TextureLoader, relativePath + '/cement.jpg'),
        useLoader(TextureLoader, relativePath + '/grassy_d.png')
    ]
    const viewerState = useModelContext().viewerState;
    
    var floorTexture = floorTextures[viewerState.textureIndex]
    floorTexture.wrapS = floorTexture.wrapT = RepeatWrapping;
    floorTexture.offset.set(0, 0);
    floorTexture.repeat.set(8, 8);
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
}

export default observer(OpenSimFloor)
