import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTheme } from '@mui/material'
import { useGLTF, OrbitControls, TrackballControls, GizmoHelper, GizmoViewport, Bounds } from '@react-three/drei'
import BottomBar from './BottomBar';
import SettingsDrawer from './SettingsDrawer';
import { useRef } from 'react';

function OpenSimModel() {
  
  const {
    gl, // WebGL renderer
    camera, // Default camera
    raycaster, // Default raycaster
    size, // Bounds of the view (which stretches 100% and auto-adjusts)
    viewport, // Bounds of the viewport in 3d units + factor (size/viewport)
    mouse, // Current, centered, normalized 2D mouse coordinates
    clock, // THREE.Clock (useful for useFrame deltas)
    invalidate, // Invalidates a single frame (for <Canvas invalidateFrameloop />)
  } = useThree();

  window.addEventListener("keyup", (event) => {
    if (event.code==='KeyP'){ // P for print screen
      const link = document.createElement('a')
      link.setAttribute('download', 'viewer_snapshot.png')
      link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'))
      link.click()
      event.preventDefault();
    }
  });
  
  // useGLTF suspends the component, it literally stops processing
  const { scene } = useGLTF('builtin/gait10dof.gltf' )
  // By the time we're here the model is guaranteed to be available
  return <primitive object={scene} />
}

const ModelViewPage = () => {
  const theme = useTheme();
  console.log(theme.palette.mode);
  return (
    <div id="canvas-container">
      <Canvas gl={{ preserveDrawingBuffer: true }} shadows 
          style={{ width: "100vw", height: "80vh" }}
          camera={{ position: [1500, 2000, 1000], fov: 75, far: 10000}}>
        <color attach="background" 
            args={(theme.palette.mode==='dark')?['#151518']:['#7d7d7d']} />
        <ambientLight intensity={0.01} />
        <directionalLight position={[1500, 2000, 1000]} intensity={0.1} shadow-mapSize={128} castShadow />
        <Bounds fit clip>
          <OpenSimModel />
        </Bounds>
        <TrackballControls />
        <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
          <GizmoViewport labelColor="white" axisHeadScale={1} />
        </GizmoHelper>
        <OrbitControls makeDefault />
      </Canvas>
      <SettingsDrawer/>
      <BottomBar/>
    </div>
  );
};

export default ModelViewPage;