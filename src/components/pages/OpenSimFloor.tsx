

import { useLoader} from '@react-three/fiber'
import GUI from 'lil-gui';
import React from 'react';
import { useRef } from 'react';
import { Mesh, RepeatWrapping, TextureLoader } from 'three';

const OpenSimFloor = () => {
    const textureFile = '/tile.jpg'
    const floorTexture =  useLoader(TextureLoader, textureFile);
    floorTexture.wrapS = floorTexture.wrapT = RepeatWrapping;
    floorTexture.offset.set(0, 0);
    floorTexture.repeat.set(8, 8);
    const floorColor = "white"
    const floorRef=useRef<Mesh>(null);
    
    React.useEffect(() => {
        const gui = new GUI()
        const floorFolder = gui.addFolder("Floor");
        floorFolder.add(floorRef.current!.position, 'y', -2, 2, .01).name("Height")
        floorFolder.add(floorRef.current!, 'visible', 0, Math.PI * 2)
        floorFolder.addColor(floorRef.current!.material, 'color')
        return () => {
            gui.destroy()
          }
      }, [floorRef.current?.position]);

    return <>
        <mesh name='Floor' ref={floorRef} rotation-x={-Math.PI / 2} position-y={.0} receiveShadow >
        <planeGeometry attach="geometry" args={[20, 20]} />
        <meshPhongMaterial attach="material" color={floorColor} map={floorTexture}/>
        </mesh>
    </>
}

export default OpenSimFloor
