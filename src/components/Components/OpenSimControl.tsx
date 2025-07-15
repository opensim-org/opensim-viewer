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
            (camera as PerspectiveCamera).fov = (newCamera as PerspectiveCamera).fov;
            (camera as PerspectiveCamera).near = (newCamera as PerspectiveCamera).near;
            (camera as PerspectiveCamera).far = (newCamera as PerspectiveCamera).far;

            camera.updateProjectionMatrix();
            controlsRef.current!.update()
        }
      })
    //console.log(viewerState.rotating);
    return <>
        <OrbitControls ref={controlsRef} camera={camera} autoRotate autoRotateSpeed={curState.rotating ? 2 : 0.0} makeDefault  />
    </>
}

export default observer(OpenSimControl)
