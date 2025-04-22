import { OrbitControls, TransformControls, CameraControls} from '@react-three/drei'
import { observer } from 'mobx-react'
import { useModelContext } from '../../state/ModelUIStateContext';

import { useFrame, useThree } from '@react-three/fiber'

import viewerState from "../../state/ViewerState";
import { Box3, Object3D, PerspectiveCamera, Vector3 } from 'three';

const OpenSimControl = () => {
    const {
        gl, // WebGL renderer
        camera,
        controls
    } = useThree()

   const curState = useModelContext();

   useFrame((_, delta) => {
        if (curState.pending_key !== "") {
            switch (curState.pending_key) {
                case 'i':
                case 'I':
                    (controls as unknown as CameraControls).dolly(0.5, true)
                    break;
                case 'o':
                case 'O':
                    (controls as unknown as CameraControls).dolly(-0.5, true)
                    break;
                case 'ArrowLeft':
                    (controls as unknown as CameraControls).truck(0.2, 0.0, true)
                    break;
                case 'ArrowRight':
                    (controls as unknown as CameraControls).truck(-0.2, 0.0, true)
                    break;
                case 'ArrowUp':
                    (controls as unknown as CameraControls).truck(0.0, 0.2, true)
                    break;
                case 'ArrowDown':
                    (controls as unknown as CameraControls).truck(0.0, -0.2, true)
                    break;
                case 'f':
                case 'F':
                    if (curState.selectedObject !== null)
                        (controls as unknown as CameraControls).fitToBox(curState.selectedObject!, true)
                    else {
                        const useScene = curState.scene
                        useScene?.traverse((object: Object3D)=>{
                            if (object.type === "Group" && object.name === "OpenSimModels"){
                                (controls as unknown as CameraControls).fitToBox(object, true)
                            }
                        })
                    }
                    break;
                case 's':
                case 'S':
                    (controls as unknown as CameraControls).saveState();
                    break;
                case 'r':
                case 'R':
                    (controls as unknown as CameraControls).reset(true);
                    break;

            }
            curState.pending_key = "";
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
        if (curState.fitToBox !== null) {
            fitToBox(curState.fitToBox)
            curState.fitToBox = null
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

    function fitToBox(boundingBox: Box3) {
        const center = boundingBox.getCenter(new Vector3());
        const size = boundingBox.getSize(new Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = (camera as PerspectiveCamera).fov * (Math.PI / 180);
        const offset = Math.abs(maxDim / 2 / Math.tan(fov / 2));

        var dir = new Vector3(0.0, 0.0, 1.0);
        dir.x = camera.matrix.elements[8];
        dir.y = camera.matrix.elements[9];
        dir.z = camera.matrix.elements[10];
        dir.multiplyScalar(offset);
        var newPos = new Vector3();
        newPos.addVectors(center, dir);

        (controls as unknown as CameraControls).moveTo(newPos.x, newPos.y, newPos.z, true);
        if (controls) 
            (controls as unknown as CameraControls).setTarget(center.x, center.y, center.z, true);


    }
    //console.log(viewerState.rotating);
    return <>
        {curState.draggable ?
            (<TransformControls camera={camera} object={curState.selectedObject!} onChange={transformSelected} onMouseUp={completeTransform}/>) :
            <CameraControls camera={camera} makeDefault />
        }
    </>
}

export default observer(OpenSimControl)
