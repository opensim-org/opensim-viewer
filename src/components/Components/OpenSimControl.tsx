import { TransformControls, CameraControls, OrbitControls} from '@react-three/drei'
import { observer } from 'mobx-react'
import { useModelContext } from '../../state/ModelUIStateContext';

import { useFrame, useThree } from '@react-three/fiber'

import { Box3, Object3D, PerspectiveCamera, Vector2, Vector3 } from 'three';
import { useRef, useState } from 'react';
import type CameraControlsImpl from 'camera-controls'

const OpenSimControl = () => {
    const {
        gl, // WebGL renderer
        camera,
        controls,
        scene
    } = useThree()

   const curState = useModelContext();
   const viewerState = useModelContext().viewerState;
   const controlsRef = useRef<CameraControlsImpl>(null)

   const controlTarget = new Vector3(0., 0., 0.);
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
                        (controls as unknown as CameraControls).fitToSphere(curState.selectedObject!, true)
                    else {
                        fitToModels(true);
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
                case 'x':
                case 'X':
                    (controls as unknown as CameraControls).setLookAt(10, 0, 0, 0, 0, 0, false).then(()=>fitToModels(false));
                    break
                case 'y':
                case 'Y':
                    (controls as unknown as CameraControls).setLookAt(0, 10, 0, 0, 0, 0, false).then(()=>fitToModels(false));
                    break;
                case 'z':
                case 'Z':
                    (controls as unknown as CameraControls).setLookAt(0, 0, 10, 0, 0, 0, false).then(()=>fitToModels(false));
                    break
                case 'C':
                case 'c':
                    if (curState.recordingKeyFrames){
                        (controls as unknown as CameraControls).getTarget(controlTarget)
                        curState.addCamera( (controls as unknown as CameraControls).camera as PerspectiveCamera, controlTarget)
                    }
            }
            curState.pending_key = "";
        }
        else if (curState.takeSnapshot){
            if (curState.snapshotProps.size_choice==="screen"){
                const link = document.createElement('a')
                if (curState.snapshotProps.transparent_background){
                    let clearAlpha = gl.getClearAlpha ();
                    gl.setClearAlpha (0.0);
                    link.setAttribute('download', viewerState.snapshotName + "." + viewerState.snapshotFormat)
                    link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'))
                    link.click()
                    curState.takeSnapshot = false;
                    gl.setClearAlpha (clearAlpha);
                }
                else{
                    link.setAttribute('download', viewerState.snapshotName + "." + viewerState.snapshotFormat)
                    link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'))
                    link.click()
                    curState.takeSnapshot = false;
                }
            }
            else {  // Custom
                const originalSize = new Vector2 ();
                gl.getSize (originalSize);
                let renderWidth = curState.snapshotProps.width;
                let renderHeight = curState.snapshotProps.height;
                if (curState.snapshotProps.preserve_aspect_ratio){
                      const canvasHeight = window.document.getElementById("canvas-element")?.clientHeight
                      const canvasWidth = window.document.getElementById("canvas-element")?.clientWidth
                    renderHeight = renderWidth *canvasHeight!/canvasWidth!
                }
                if (window.devicePixelRatio) {
                    renderWidth /= window.devicePixelRatio;
                    renderHeight /= window.devicePixelRatio;
                }
                resizeRenderer (renderWidth, renderHeight);
                const link = document.createElement('a')
                if (curState.snapshotProps.transparent_background){
                    let clearAlpha = gl.getClearAlpha ();
                    gl.setClearAlpha (0.0);
                    link.setAttribute('download', viewerState.snapshotName + "." + viewerState.snapshotFormat)
                    link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'))
                    link.click()
                    gl.setClearAlpha (clearAlpha);
                }
                else {
                    link.setAttribute('download', viewerState.snapshotName + "." + viewerState.snapshotFormat)
                    link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'))
                    link.click()
                }
                curState.takeSnapshot = false;
                resizeRenderer (originalSize.width, originalSize.height);
            }
        }
        if (curState.fitToBox !== null) {
            fitToBox(curState.fitToBox)
            curState.fitToBox = null
        }
        if (curState.currentCameraIndex!==-1) {
            const nextCam = curState.cameras[curState.currentCameraIndex]
            //camera.position.copy(nextCam.position);
            //camera.rotation.copy(nextCam.rotation);
            //camera.updateProjectionMatrix();
            const target = curState.targets[curState.currentCameraIndex];
            if (controlsRef.current) {
                controlsRef.current.moveTo(nextCam.position.x, nextCam.position.y, nextCam.position.z)
                controlsRef.current.setLookAt(
                    nextCam.position.x, nextCam.position.y, nextCam.position.z,
                    target.x, target.y, target.z, false)
                controlsRef.current.update(delta)
            }
            curState.setCurrentCameraIndex(-1)
        }

       function fitToModels(transition: boolean) {
           const useScene = curState.scene;
           useScene?.traverse((object: Object3D) => {
               if (object.type === "Group" && object.name === "OpenSimModels") {
                   (controls as unknown as CameraControls).fitToSphere(object, transition);
               }
           });
       }
       })

        function resizeRenderer (width:number, height:number)
        {
            if (window.devicePixelRatio) {
                gl.setPixelRatio (window.devicePixelRatio);
            }
            gl.setSize (width, height);
            gl.render (scene, camera);
        }

    function completeTransform(e?: THREE.Event | undefined): void {
        if (curState.debug)
            console.log(e!.target!.object)
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

        if (controls) {
            (controls as unknown as CameraControls).moveTo(newPos.x, newPos.y, newPos.z, true);
            (controls as unknown as CameraControls).setTarget(center.x, center.y, center.z, true);
        }

    }
    function updateTarget(self: CameraControls): void {
        console.log(controls)
    }

    return <>
        {curState.draggable && <TransformControls object={curState.selectedObject!} onMouseUp={completeTransform}/>}
        <CameraControls ref={controlsRef} camera={camera} makeDefault onUpdate={updateTarget}/>
        
    </>
}

export default observer(OpenSimControl)
