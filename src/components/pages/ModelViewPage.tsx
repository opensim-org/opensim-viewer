import { Canvas, useFrame } from '@react-three/fiber'

import { useGLTF, OrbitControls, TrackballControls, GizmoHelper, GizmoViewport, Bounds } from '@react-three/drei'
import BottomBar from './BottomBar';
import SettingsDrawer from './SettingsDrawer';

function DefaultModel() {
  // useGLTF suspends the component, it literally stops processing
  const { scene } = useGLTF('builtin/gait10dof.gltf' )
  // By the time we're here the model is guaranteed to be available
  return <primitive object={scene} />
}

const ModelViewPage = () => {
  return (
    <div id="canvas-container">
      <Canvas shadows style={{ width: "100vw", height: "80vh" }} 
               camera={{ position: [1500, 2000, 1000], fov: 75, far: 10000}}>
        <color attach="background" args={['#151518']} />
        <ambientLight intensity={0.01} />
        <directionalLight position={[1500, 2000, 1000]} intensity={0.1} shadow-mapSize={128} castShadow />
        <Bounds fit clip>
          <DefaultModel />
        </Bounds>
        <TrackballControls />
        <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
          <GizmoViewport labelColor="white" axisHeadScale={1} />
        </GizmoHelper>
        <OrbitControls makeDefault autoRotateSpeed={1}/>
      </Canvas>
      <SettingsDrawer/>
      <BottomBar/>
    </div>
  );
};

export default ModelViewPage;