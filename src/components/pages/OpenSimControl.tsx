import { OrbitControls, TransformControls, CameraControls} from '@react-three/drei'
import { observer } from 'mobx-react'
import { useModelContext } from '../../state/ModelUIStateContext';

import { useFrame, useThree } from '@react-three/fiber'
import { Ref, useRef } from 'react'

import viewerState from "../../state/ViewerState";

const OpenSimControl = () => {
    const {
        gl, // WebGL renderer
        camera
    } = useThree()

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
            link.setAttribute('download', viewerState.snapshotName + "." + viewerState.snapshotFormat)
            link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'))
            link.click()
            curState.takeSnapshot = false;
        }
        else if (curState.cameraLayersMask !== camera.layers.mask) {
            for (let layernumber =0; layernumber < 31; layernumber++){
                let newState = curState.getLayerVisibility(layernumber)
                if (newState)
                    camera.layers.enable(layernumber)
                else
                    camera.layers.disable(layernumber)
            }
        }
       })
    function transformSelected(e?: THREE.Event | undefined): void {
        console.log(e)
    }

    function completeTransform(e?: THREE.Event | undefined): void {
        console.log(e!.target!.object)
        curState.draggable = false;
        var json = JSON.stringify({
                                    "event": "translate",
                                    "uuid": e!.target!.object.uuid,
                                    "location": e!.target!.object.position
                                });
        curState.sendText(json);
    }

    //console.log(viewerState.rotating);
    return <>
        {curState.draggable ?
            (<TransformControls camera={camera} object={curState.selectedObject!} onChange={transformSelected} onMouseUp={completeTransform}/>) :
            (curState.useOrbitControl ?
                (<OrbitControls camera={camera} makeDefault />):
                (<CameraControls camera={camera} makeDefault />)
            )
        }
    </>
}

export default observer(OpenSimControl)
