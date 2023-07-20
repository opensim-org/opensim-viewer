import { OrbitControls, CameraControls } from '@react-three/drei'
import { observer } from 'mobx-react'
import { modelUIState } from '../../state/ModelUIState'
import { useFrame, useThree } from '@react-three/fiber'
import { Ref, useRef } from 'react'

const OpenSimControl = () => {
    const {
        gl, // WebGL renderer
        camera,
    } = useThree()

    const ref = useRef<CameraControls>();

    useFrame((_, delta) => {
        if (modelUIState.zooming){
            console.log(delta)
            let zoomFactor = modelUIState.zoom_inOut;
            camera.zoom *= zoomFactor;
            camera.updateProjectionMatrix();
            modelUIState.zooming = false;
        }
        else if (modelUIState.takeSnapshot){
            const link = document.createElement('a')
            link.setAttribute('download', 'viewer_snapshot.png')
            link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'))
            link.click()
            modelUIState.takeSnapshot = false;
        }
      })
    //console.log(viewerState.rotating);
    return <>
        <OrbitControls autoRotate autoRotateSpeed={modelUIState.rotating ? 2 : 0.0} makeDefault  />
        <CameraControls enabled={false} ref={(ref as unknown) as Ref<CameraControls> | undefined}/>
    </>
}

export default observer(OpenSimControl)
