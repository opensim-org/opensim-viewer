import { OrbitControls, CameraControls } from '@react-three/drei'
import { observer } from 'mobx-react'
import viewerState from '../../state/ViewerState'
import { useFrame, useThree } from '@react-three/fiber'
import { Ref, useRef } from 'react'

const OpenSimControl = () => {
    const {
        gl, // WebGL renderer
        camera,
    } = useThree()

    const ref = useRef<CameraControls>();
    
    window.addEventListener('keyup', (event) => {
        if (event.code === 'KeyP') {
            // P for print screen
            
        }
    })
    useFrame(() => {
        if (viewerState.zooming){
            let zoomFactor = viewerState.zoom_inOut;
            camera.zoom *= zoomFactor;
            camera.updateProjectionMatrix();
            viewerState.zooming = false;
        }
        else if (viewerState.takeSnapshot){
            const link = document.createElement('a')
            link.setAttribute('download', 'viewer_snapshot.png')
            link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'))
            link.click()
            viewerState.takeSnapshot = false;
        }
      })
    //console.log(viewerState.rotating);
    return <>
        <OrbitControls autoRotate autoRotateSpeed={viewerState.rotating ? 2 : 0.0} makeDefault  />
        <CameraControls enabled={false} ref={(ref as unknown) as Ref<CameraControls> | undefined}/>
    </>
}

export default observer(OpenSimControl)
