import { Canvas } from '@react-three/fiber'
import { useTheme } from '@mui/material'
import { GizmoHelper, GizmoViewport, Bounds, Environment, Loader} from '@react-three/drei'
import BottomBar from './BottomBar';
import SettingsDrawer from './SettingsDrawer';
import OpenSimControl from './OpenSimControl';
import OpenSimModel from './OpenSimModel';
import { Suspense } from 'react';

interface ModelViewPageProps {
  curentModelPath: string;
}

const ModelViewPage: React.FC<ModelViewPageProps> = ({ curentModelPath }) => {

  
  const theme = useTheme();
  console.log(theme.palette.mode);
  return (
    <div id="canvas-container">
      <Suspense fallback={<Loader />}>
      <Canvas gl={{ preserveDrawingBuffer: true }} shadows="soft" 
          style={{ width: "100vw", height: "85vh" }}
          camera={{ position: [1500, 2000, 1000], fov: 75, far: 10000}}>
        <color attach="background" 
            args={(theme.palette.mode==='dark')?['#151518']:['#cccccc']} />
        <Bounds fit clip>
          <OpenSimModel curentModelPath={curentModelPath}/>
        </Bounds>
        <Environment preset='city' blur={0.8} />
        <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
          <GizmoViewport labelColor="white" axisHeadScale={1} />
        </GizmoHelper>
        <OpenSimControl />
      </Canvas>
      </Suspense>
      <SettingsDrawer placement='left'/>
      <BottomBar />
    </div>
  );
};

export default ModelViewPage;