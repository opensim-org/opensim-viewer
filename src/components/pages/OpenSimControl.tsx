import { OrbitControls, CameraControls } from '@react-three/drei'
import { observer } from 'mobx-react'
import { useModelContext } from '../../state/ModelUIStateContext';

import { useFrame, useThree } from '@react-three/fiber'
import { Ref, useRef } from 'react'

const OpenSimControl = () => {
    const {
        gl, // WebGL renderer
        camera,
    } = useThree()

    const ref = useRef<CameraControls>();
    const curState = useModelContext();

    useFrame((_, delta) => {
        if (curState.zooming){
            console.log(delta)
            let zoomFactor = curState.zoom_inOut;
            camera.zoom *= zoomFactor;
            camera.updateProjectionMatrix();
            curState.zooming = false;
        }
        else if (curState.takeSnapshot){
            const link = document.createElement('a')
            link.setAttribute('download', 'viewer_snapshot.png')
            link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'))
            link.click()
            curState.takeSnapshot = false;
        }
      })
    //console.log(viewerState.rotating);
    return <>
        <OrbitControls autoRotate autoRotateSpeed={curState.rotating ? 2 : 0.0} makeDefault  />
        <CameraControls enabled={false} ref={(ref as unknown) as Ref<CameraControls> | undefined}/>
    </>
}

export default observer(OpenSimControl)
