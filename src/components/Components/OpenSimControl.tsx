import { TransformControls, CameraControls, OrbitControls} from '@react-three/drei'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { observer } from 'mobx-react'
import { useModelContext } from '../../state/ModelUIStateContext';

import { useFrame, useThree } from '@react-three/fiber'

import THREE, { Box3, Object3D, PerspectiveCamera, Sphere, Vector2, Vector3 } from 'three';
import { useRef } from 'react';


const OpenSimControl = () => {
    const {
        gl, // WebGL renderer
        camera,
        controls,
        scene
    } = useThree()

   const curState = useModelContext();
   const viewerState = useModelContext().viewerState;
   const controlsRef = useRef<OrbitControlsImpl | null>(null)

   const controlTarget = new Vector3(0., 0., 0.);
   function implementDolly(amount: number) {
        if (controlsRef.current) {
            const target = controlsRef.current.target
            const direction = new Vector3()
            direction.subVectors(target, camera.position).normalize()
            camera.position.addScaledVector(direction, amount)
            controlsRef.current.update();
       }
   }
   function implementTruck(amount: number) {
    if (controlsRef.current) {
      const controls = controlsRef.current

      // Define truck direction (e.g., rightward along camera's local X axis)
      const truckDirection = new Vector3()
      camera.getWorldDirection(truckDirection)
      truckDirection.cross(camera.up).normalize() // right vector

      const speed = amount
      const offset = truckDirection.multiplyScalar(speed)

      camera.position.add(offset)
      controls.target.add(offset)
      controls.update()
    }
   }
    function implementTruckUpDn(amount: number) {
        if (controlsRef.current) {
        const controls = controlsRef.current

        // Define truck direction (e.g., rightward along camera's local X axis)
        const truckDirection = new Vector3()
        camera.getWorldDirection(truckDirection)
        truckDirection.cross(new Vector3(1, 0, 0)).normalize() // fwd vector

        const speed = amount
        const offset = truckDirection.multiplyScalar(speed)

        camera.position.add(offset)
        controls.target.add(offset)
        controls.update()
        }
    }
   function implementFitToSphere(object:Object3D) {
        if (controlsRef.current) {
            const box = new Box3().setFromObject(object)
            const sphere = box.getBoundingSphere(new Sphere())

            // Position camera
            const fov = (camera as PerspectiveCamera).fov * Math.PI / 180
            const distance = (sphere.radius * 1.1) / Math.sin(fov / 2)

            const direction = new Vector3()
            .subVectors(camera.position, controlsRef.current.target)
            .normalize()

            camera.position.copy(sphere.center).add(direction.multiplyScalar(distance))
            controlsRef.current.target.copy(sphere.center)
            controlsRef.current.update()
        }
   }
   useFrame((_, delta) => {
        if (curState.pending_key !== "") {
            switch (curState.pending_key) {
                case 'i':
                case 'I':
                    implementDolly(0.1)
                    break;
                case 'o':
                case 'O':
                    implementDolly(-0.1)
                    break;
                case 'ArrowLeft':
                    implementTruck(0.2)
                    break;
                case 'ArrowRight':
                    implementTruck(-0.2)
                    break;
                case 'ArrowUp':
                    implementTruckUpDn(0.2)
                    break;
                case 'ArrowDown':
                    implementTruckUpDn(-0.2)
                    break;
                case 'f':
                case 'F':
                    if (curState.selectedObject !== null)
                        implementFitToSphere(curState.selectedObject!)
                    else {
                        fitToModels(true);
                    }
                    break;
                // case 's':
                // case 'S':
                //     (controls as unknown as CameraControls).saveState();
                //     break;
                // case 'r':
                // case 'R':
                //     (controls as unknown as CameraControls).reset(true);
                //     break;
                case 'C':
                case 'c':
                    if (curState.recordingKeyFrames && controlsRef.current){
                        const controlTarget = controlsRef.current.target
                        curState.addCamera(camera as PerspectiveCamera, controlTarget)
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
            let target = curState.targets[curState.currentCameraIndex]
            if (target === undefined) {
                target = new Vector3(0, 0, 0)
            }
            if (controlsRef.current) {
                camera.position.copy(nextCam.position)
                controlsRef.current.target.copy(target)
                // controlsRef.current.setLookAt(
                //     nextCam.position.x, nextCam.position.y, nextCam.position.z,
                //     target.x, target.y, target.z, false)
                controlsRef.current.update()
            }
            curState.setCurrentCameraIndex(-1)
        }

       function fitToModels(transition: boolean) {
           const useScene = curState.scene;
           useScene?.traverse((object: Object3D) => {
               if (object.type === "Group" && object.name === "OpenSimModels") {
                   implementFitToSphere(object);
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
            camera.position.copy(newPos);
            controlsRef.current!.target.copy(center)
        }

    }

    return <>
        {curState.draggable && <TransformControls object={curState.selectedObject!} onMouseUp={completeTransform}/>}
        <OrbitControls ref={controlsRef} camera={camera} makeDefault />
        
    </>
}
/*
export default observer(OpenSimControl)
import { OrbitControls } from '@react-three/drei'
import { observer } from 'mobx-react'
import { useModelContext } from '../../state/ModelUIStateContext';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { Box3, Object3D, PerspectiveCamera, Sphere, Vector3 } from 'three';

const OpenSimControl = () => {
    const {
        gl, // WebGL renderer
        camera,
        controls,
        scene
    } = useThree()

   const curState = useModelContext();
   const viewerState = useModelContext().viewerState;
   const [cameraIndex, setCameraIndex] = useState<number>(-1)
   const controlsRef = useRef<OrbitControlsImpl | null>(null)
   function implementDolly(amount: number) {
        if (controlsRef.current) {
            const target = controlsRef.current.target
            const direction = new Vector3()
            direction.subVectors(target, camera.position).normalize()
            camera.position.addScaledVector(direction, amount)
            controlsRef.current.update();
       }
   }
   function implementTruck(amount: number) {
    if (controlsRef.current) {
      const controls = controlsRef.current

      // Define truck direction (e.g., rightward along camera's local X axis)
      const truckDirection = new Vector3()
      camera.getWorldDirection(truckDirection)
      truckDirection.cross(camera.up).normalize() // right vector

      const speed = amount
      const offset = truckDirection.multiplyScalar(speed)

      camera.position.add(offset)
      controls.target.add(offset)
      controls.update()
    }
   }
    function implementTruckUpDn(amount: number) {
        if (controlsRef.current) {
        const controls = controlsRef.current

        // Define truck direction (e.g., rightward along camera's local X axis)
        const truckDirection = new Vector3()
        camera.getWorldDirection(truckDirection)
        truckDirection.cross(new Vector3(1, 0, 0)).normalize() // fwd vector

        const speed = amount
        const offset = truckDirection.multiplyScalar(speed)

        camera.position.add(offset)
        controls.target.add(offset)
        controls.update()
        }
    }
    function implementFitToSphere(object:Object3D) {
        if (controlsRef.current) {
            const box = new Box3().setFromObject(object)
            const sphere = box.getBoundingSphere(new Sphere())

            // Position camera
            const fov = (camera as PerspectiveCamera).fov * Math.PI / 180
            const distance = (sphere.radius * 1.1) / Math.sin(fov / 2)

            const direction = new Vector3()
            .subVectors(camera.position, controlsRef.current.target)
            .normalize()

            camera.position.copy(sphere.center).add(direction.multiplyScalar(distance))
            controlsRef.current.target.copy(sphere.center)
            controlsRef.current.update()
        }
   }
   function fitToModels() {
        const useScene = curState.scene;
        useScene?.traverse((object: Object3D) => {
            if (object.type === "Group" && (object.name === "OpenSimModels" || object.name === "Scene")) {
                implementFitToSphere(object);
            }
        });
    }
   useEffect(() => {
        fitToModels();
        setCameraIndex(curState.currentCameraIndex)
   }, [curState.currentCameraIndex])

    useFrame((_, delta) => {
        if (curState.zooming){
            let zoomFactor = curState.zoom_inOut;
            camera.zoom *= zoomFactor;
            camera.updateProjectionMatrix();
            curState.zooming = false;
        }
        else if (curState.takeSnapshot){
            const link = document.createElement('a')
            link.setAttribute('download', curState.viewerState.snapshotName + "." + curState.viewerState.snapshotFormat)
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
        if (cameraIndex !== curState.currentCameraIndex){
            setCameraIndex(curState.currentCameraIndex);
            // Copy properties into default camera
            const newCamera = curState.cameras[curState.currentCameraIndex]
            camera.position.copy(newCamera.position)
            camera.quaternion.copy(newCamera.quaternion)
            camera.zoom = (newCamera as PerspectiveCamera).zoom;
            camera.updateProjectionMatrix();
            controlsRef.current!.update()
        }
      })
    //console.log(viewerState.rotating);
    return <>
        <OrbitControls ref={controlsRef} camera={camera} autoRotate autoRotateSpeed={curState.rotating ? 2 : 0.0} makeDefault  />
    </>
}
*/
export default observer(OpenSimControl)
