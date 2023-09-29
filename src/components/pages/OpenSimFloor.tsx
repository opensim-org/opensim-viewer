

import { useLoader} from '@react-three/fiber'
import { RepeatWrapping, TextureLoader } from 'three';

const OpenSimFloor = () => {
    const floorTexture =  useLoader(TextureLoader, '/tile.jpg');
    floorTexture.wrapS = floorTexture.wrapT = RepeatWrapping;
    floorTexture.offset.set(0, 0);
    floorTexture.repeat.set(8, 8);
    return <>
        <mesh name='Floor' rotation-x={-Math.PI / 2} position-y={-.01} receiveShadow >
        <planeGeometry attach="geometry" args={[20, 20]} />
        <meshPhongMaterial attach="material" color="white" map={floorTexture}/>
        </mesh>
    </>
}

export default OpenSimFloor
