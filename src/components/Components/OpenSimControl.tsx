import { TransformControls, OrbitControls} from '@react-three/drei'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { observer } from 'mobx-react'
import { useModelContext } from '../../state/ModelUIStateContext';

import { useFrame, useThree } from '@react-three/fiber'

import { getTimestamp } from "../../helpers/timeHelpers"

import { Box3, Object3D, PerspectiveCamera, Sphere, Vector2, Vector3, Color, WebGLRenderer } from 'three';

// OpenSimControl.tsx
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { GroupProps } from '@react-three/fiber';

export type OpenSimControlHandle = {
  addCamera: (cameraName: any, parent: Object3D | null) => PerspectiveCamera;
};

const qualityLevels = [
  { label: "1080p HD", baseDimension: 1920 },
  { label: "1440p HD", baseDimension: 2560 },
  { label: "2160p 4K", baseDimension: 3840 },
  { label: "4320p 8K", baseDimension: 7680 },
];

const OpenSimControl = forwardRef<OpenSimControlHandle, GroupProps>((props, ref) => {
    const {
        gl, // WebGL renderer
        camera,
        controls,
        scene
    } = useThree()

   const curState = useModelContext();
   const viewerState = useModelContext().viewerState;
   const controlsRef = useRef<OrbitControlsImpl | null>(null)
   const lastPosition = useRef(new Vector3())
   camera.layers.enable(2); // Enable layer 2 for OpenSim helpers like Frames (these mess up bounding boxes and selection if on layer 1)

  useImperativeHandle(ref, () => ({
    addCamera: (cameraName: any, parent: Object3D | null) => {
        return curState.viewerState.addCamera(camera as PerspectiveCamera, controlsRef.current!.target, cameraName)
    }
  }));

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
        // If camera moves and was a fixed camera, then make it none/default
        if (!lastPosition.current.equals(camera.position)) {
            let diff = lastPosition.current.clone();
            diff.sub(camera.position);
            lastPosition.current.copy(camera.position)
            if ((curState.viewerState.currentCameraIndex!==-1) && diff.length() > 1e-3) {
                curState.viewerState.setCurrentCameraIndex(-1)
            }
        }
        if (viewerState.pending_key !== "") {
            switch (viewerState.pending_key) {
                case 'i':
                case 'I':
                    implementDolly(0.1)
                    break;
                case 'o':
                case 'O':
                    implementDolly(-0.1)
                    break;
                case 'ArrowLeft':
                    implementTruck(-0.1)
                    break;
                case 'ArrowRight':
                    implementTruck(0.1)
                    break;
                case 'ArrowUp':
                    implementTruckUpDn(-0.1)
                    break;
                case 'ArrowDown':
                    implementTruckUpDn(0.1)
                    break;
                case 'f':
                case 'F':
                    if (curState.selectedObject !== null && curState.selectedObject !== undefined)
                        implementFitToSphere(curState.selectedObject!)
                    else {
                        fitToModels(true);
                    }
                    break;
            }
            viewerState.pending_key = "";
        }
        else if (curState.viewerState.lookAtTarget!=="") {
            // get world position for object by uuid
            const obj3d = curState.objectByUuid(curState.viewerState.lookAtTarget);
            const worldPos = new Vector3();
            obj3d.getWorldPosition(worldPos);
            if (controls) {
                camera.lookAt(worldPos);
                controlsRef.current!.target.copy(worldPos)
            }
            curState.viewerState.lookAtTarget = ""
        }
        else if (curState.viewerState.saveCameraAndTarget){
            if (controlsRef.current){
                const controlTarget = controlsRef.current.target
                curState.viewerState.addCamera(camera as PerspectiveCamera, controlTarget, undefined)
            }
            curState.viewerState.saveCameraAndTarget = false
        }
        else if (curState.takeSnapshot){
            const timestamp = getTimestamp();
            const snapshot_filename = viewerState.snapshotName + "_" + timestamp + "." + curState.snapshotProps.image_format;

            // Get base dimension from quality level
            const selectedQuality = qualityLevels.find(q => q.label === curState.snapshotProps.quality_level);
            const baseWidth = selectedQuality ? selectedQuality.baseDimension : 1920;
            alert(baseWidth)

            // Store original renderer size
            const originalSize = new Vector2();
            gl.getSize(originalSize);
            const originalClearColor = new Color();
            const originalClearAlpha = gl.getClearAlpha();
            gl.getClearColor(originalClearColor);

            // Get current canvas dimensions
            const canvas = gl.domElement;
            const currentWidth = canvas.clientWidth;
            const currentHeight = canvas.clientHeight;
            const currentAspect = currentWidth / currentHeight;

            let renderWidth = baseWidth;
            let renderHeight = baseWidth; // Actual value is asigned in the following if-else.
            let cropOffsetX = 0;
            let cropOffsetY = 0;
            let finalWidth = renderWidth;
            let finalHeight = renderHeight;

            if (curState.snapshotProps.size_choice === "screen") {
                // Use current canvas aspect ratio
                renderHeight = Math.round(renderWidth / currentAspect);
                finalWidth = renderWidth;
                finalHeight = renderHeight;
            }
            else if (curState.snapshotProps.size_choice === "aspect") {

                const targetAspectRatio =
                    curState.snapshotProps.aspect_ratio || "16:9";

                const [aspectW, aspectH] =
                    targetAspectRatio.split(':').map(Number);

                const targetAspect = aspectW / aspectH;

                // Render dimensions based on current viewport aspect
                renderWidth = baseWidth;
                renderHeight = Math.round(baseWidth / currentAspect);

                // Ensure even dimensions
                renderWidth = renderWidth % 2 === 0 ? renderWidth : renderWidth - 1;
                renderHeight = renderHeight % 2 === 0 ? renderHeight : renderHeight - 1;

                const renderAspect = renderWidth / renderHeight;

                if (renderAspect > targetAspect) {
                    // Wider than target -> crop LEFT/RIGHT

                    finalHeight = renderHeight;
                    finalWidth = Math.floor(renderHeight * targetAspect);

                    cropOffsetX = Math.floor((renderWidth - finalWidth) / 2);
                    cropOffsetY = 0;

                } else {
                    // Taller than target -> crop TOP/BOTTOM

                    finalWidth = renderWidth;
                    finalHeight = Math.floor(renderWidth / targetAspect);

                    cropOffsetX = 0;
                    cropOffsetY = Math.floor((renderHeight - finalHeight) / 2);
                }

                // Ensure even dimensions
                finalWidth = finalWidth % 2 === 0 ? finalWidth : finalWidth - 1;
                finalHeight = finalHeight % 2 === 0 ? finalHeight : finalHeight - 1;

                cropOffsetX = cropOffsetX % 2 === 0 ? cropOffsetX : cropOffsetX - 1;
                cropOffsetY = cropOffsetY % 2 === 0 ? cropOffsetY : cropOffsetY - 1;
            }

            // Ensure even dimensions for encoding
            renderWidth = renderWidth % 2 === 0 ? renderWidth : renderWidth - 1;
            renderHeight = renderHeight % 2 === 0 ? renderHeight : renderHeight - 1;
            finalWidth = finalWidth % 2 === 0 ? finalWidth : finalWidth - 1;
            finalHeight = finalHeight % 2 === 0 ? finalHeight : finalHeight - 1;

            // Create a temporary WebGL renderer for offscreen rendering
            const tempRenderer = new WebGLRenderer({
                preserveDrawingBuffer: true,
                alpha: curState.snapshotProps.transparent_background,
                antialias: true
            });

            tempRenderer.setSize(renderWidth, renderHeight);
            tempRenderer.setPixelRatio(1);

            // Store skysphere visibility state
            let prevSkyVisibility: boolean | null = null;

            // Set clear color based on transparency
            if (curState.snapshotProps.transparent_background) {
                tempRenderer.setClearColor(0x000000, 0);
                // Find and hide skysphere if it exists
                const skySphere = scene.getObjectByName("SkySphere");
                if (skySphere) {
                    prevSkyVisibility = skySphere.visible;
                    skySphere.visible = false;
                }
            } else {
                tempRenderer.setClearColor(originalClearColor, originalClearAlpha);
            }

            // Render the scene to the temporary renderer
            tempRenderer.render(scene, camera);

            // Read pixels from the temporary renderer
            const glContext = tempRenderer.getContext();
            const buffer = new Uint8Array(renderWidth * renderHeight * 4);
            glContext.readPixels(0, 0, renderWidth, renderHeight, glContext.RGBA, glContext.UNSIGNED_BYTE, buffer);

            // Create a canvas for the full render
            const fullCanvas = document.createElement('canvas');
            fullCanvas.width = renderWidth;
            fullCanvas.height = renderHeight;
            const fullCtx = fullCanvas.getContext('2d');

            if (fullCtx) {
                const imageData = fullCtx.createImageData(renderWidth, renderHeight);

                // Flip Y (WebGL reads from bottom)
                for (let y = 0; y < renderHeight; y++) {
                    for (let x = 0; x < renderWidth; x++) {
                        const src = ((renderHeight - y - 1) * renderWidth + x) * 4;
                        const dst = (y * renderWidth + x) * 4;
                        imageData.data[dst] = buffer[src];
                        imageData.data[dst + 1] = buffer[src + 1];
                        imageData.data[dst + 2] = buffer[src + 2];
                        imageData.data[dst + 3] = buffer[src + 3];
                    }
                }

                fullCtx.putImageData(imageData, 0, 0);

                // If we need to crop (aspect ratio mode), create a cropped canvas
                let finalCanvas = fullCanvas;

                if (curState.snapshotProps.size_choice === "aspect") {
                    finalCanvas = document.createElement('canvas');
                    finalCanvas.width = finalWidth;
                    finalCanvas.height = finalHeight;
                    const finalCtx = finalCanvas.getContext('2d');

                    if (finalCtx) {
                        // Draw the cropped portion
                        finalCtx.drawImage(
                            fullCanvas,
                            cropOffsetX, cropOffsetY, finalWidth, finalHeight,
                            0, 0, finalWidth, finalHeight
                        );
                    }
                }

                // Convert to requested format
                let mimeType = `image/${curState.snapshotProps.image_format}`;
                if (curState.snapshotProps.image_format === 'tiff') {
                    mimeType = 'image/tiff';
                }

                let quality = 1.0;
                if (curState.snapshotProps.image_format === 'jpeg') {
                    quality = 0.92; // Good quality for JPEG
                }

                const dataURL = finalCanvas.toDataURL(mimeType, quality);

                // Create download link
                const link = document.createElement('a');
                link.setAttribute('download', snapshot_filename);
                link.setAttribute('href', dataURL);
                link.click();
            }

            // Clean up temporary renderer
            tempRenderer.dispose();

            // Restore skysphere visibility
            if (curState.snapshotProps.transparent_background && prevSkyVisibility !== null) {
                const skySphere = scene.getObjectByName("SkySphere");
                if (skySphere) {
                    skySphere.visible = prevSkyVisibility;
                }
            }

            // Reset flag
            curState.takeSnapshot = false;
        }
        if (curState.fitToBox !== null) {
            fitToBox(curState.fitToBox)
            curState.fitToBox = null
        }
        if (curState.viewerState.currentCameraIndex!==-1) {
            const nextCam = curState.viewerState.cameras[curState.viewerState.currentCameraIndex]
            let target = curState.viewerState.targets[curState.viewerState.currentCameraIndex]
            if (target === undefined) {
                target = new Vector3(0, 0, 0)
            }
            if (controlsRef.current) {
                camera.position.copy(nextCam.position)
                // Update lastPosition so we don't inadvertently immediately revert to default/none
                lastPosition.current.copy(camera.position)
                controlsRef.current.target.copy(target)
                // controlsRef.current.setLookAt(
                //     nextCam.position.x, nextCam.position.y, nextCam.position.z,
                //     target.x, target.y, target.z, false)
                controlsRef.current.update()
            }

        }

       function fitToModels(transition: boolean) {
           const useScene = curState.scene;
           useScene?.traverse((object: Object3D) => {
               if ((object.type === "Group" && object.name === "OpenSimModels") ||
                (object.type === "Group" && object.name === "Models") ||
                (object.type === "Object3D" && object.userData !== undefined && object.userData.name.startsWith("Model"))
               ) {
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
        <OrbitControls ref={controlsRef} camera={camera} enableDamping={false} makeDefault />
    </>
});
export default observer(OpenSimControl)