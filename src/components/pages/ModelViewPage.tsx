import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect } from 'react'
import { useGLTF, OrbitControls, TrackballControls, GizmoHelper, GizmoViewport, Bounds } from '@react-three/drei'
import BottomBar from './BottomBar';
import LeftDrawer from './LeftDrawer';

function DefaultModel() {
  // useGLTF suspends the component, it literally stops processing
  const { scene } = useGLTF('builtin/gait10dof.gltf' )
  // By the time we're here the model is guaranteed to be available
  return <primitive object={scene} />
}
const ModelViewPage = () => {
  return (
    <div id="canvas-container">
      <Canvas style={{ width: "100vw", height: "80vh" }} 
              camera={{ position: [1500, 2000, 1000], fov: 50, far: 10000}}>
        <color attach="background" args={['#151518']} />
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 0]} />
        <Bounds fit clip>
          <DefaultModel />
        </Bounds>
        <TrackballControls />
        <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
          <GizmoViewport labelColor="white" axisHeadScale={1} />
        </GizmoHelper>
        <OrbitControls makeDefault />
      </Canvas>
      <LeftDrawer/>
      <BottomBar/>
    </div>
  );
};

export default ModelViewPage;