import { Canvas } from '@react-three/fiber'
import { useTheme } from '@mui/material'
import { GizmoHelper, GizmoViewport, Bounds, Environment } from '@react-three/drei'
import BottomBar from './BottomBar'
import SettingsDrawer from './SettingsDrawer'
import OpenSimControl from '../Components/OpenSimControl'
import OpenSimScene from '../Components/OpenSimScene'
import { Suspense } from 'react'

interface ModelViewPageProps {
    curentModelPath: string
}

const ModelViewPage: React.FC<ModelViewPageProps> = ({ curentModelPath }) => {
    const theme = useTheme()
    console.log(theme.palette.mode)
    return (
        <div id="canvas-container">
            <Suspense fallback={null}>
                <Canvas
                    gl={{ preserveDrawingBuffer: true }}
                    shadows="soft"
                    style={{ width: '100vw', height: 'calc(100vh - 67px - 7vh)' }}
                    camera={{ position: [1500, 2000, 1000], fov: 75, far: 10000 }}
                >
                    <color attach="background" args={theme.palette.mode === 'dark' ? ['#151518'] : ['#cccccc']} />
                    <Bounds fit clip>
                        <OpenSimScene curentModelPath={curentModelPath} />
                    </Bounds>
                    <Environment preset="city" />
                    <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
                        <GizmoViewport labelColor="white" axisHeadScale={1} />
                    </GizmoHelper>
                    <OpenSimControl />
                </Canvas>
            </Suspense>
            <SettingsDrawer placement="right" />
            <BottomBar />
        </div>
    )
}

export default ModelViewPage
