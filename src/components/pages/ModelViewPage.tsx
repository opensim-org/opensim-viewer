import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import { useGLTF, OrbitControls, Stage, CameraShake, useAnimations } from '@react-three/drei'
import { Camera } from 'three';

function DefaultModel() {
  // useGLTF suspends the component, it literally stops processing
  const { scene } = useGLTF('builtin/gait10dof.gltf' )
  // By the time we're here the model is guaranteed to be available
  return <primitive object={scene} />
}
const ModelViewPage = () => {
  return (
    <div id="canvas-container">
      <Canvas style={{ width: "100vw", height: "100vh" }} camera={{ position: [1500, 1500, 1000], fov: 50, far: 10000 }}>
        <color attach="background" args={['#151518']} />
        <directionalLight position={[10, 10, 0]} intensity={1.5} />
        <DefaultModel />
        <OrbitControls  />
      </Canvas>
    </div>
  );
};

export default ModelViewPage;