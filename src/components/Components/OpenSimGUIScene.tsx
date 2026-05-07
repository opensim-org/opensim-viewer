import { ThreeEvent, useFrame, useLoader, useThree } from '@react-three/fiber'

import * as THREE from 'three';

import { useEffect, useRef, useState } from 'react'
import { AnimationMixer, Color, Group, Mesh, Object3D} from 'three'
import { observer } from 'mobx-react'

import { useModelContext } from '../../state/ModelUIStateContext'
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera'
import { OpenSimLoader } from '../../state/OpenSimLoader';
import OpenSimFloor from './OpenSimFloor';
import OpenSimSkySphere from './OpenSimSkySphere';

interface OpenSimSceneProps {
    currentModelPath: string,
    supportControls:boolean
}

const OpenSimGUIScene: React.FC<OpenSimSceneProps> = ({ currentModelPath, supportControls }) => {

    // useGLTF suspends the component, it literally stops processing
    const { set, gl} = useThree();
    const { scene, camera } = useThree();
    const viewerState = useModelContext().viewerState;

    const sceneRef = useRef<THREE.Scene>(scene);
    const [sceneObjectMap] = useState<Map<string, Object3D>>(new Map<string, Object3D>());
    const [useEffectRunning, setUseEffectRunning] = useState<boolean>(false)
    const [mixers, ] = useState<AnimationMixer[]>([])
    const [colorNodeMap] = useState<Map<string, Object3D>>(new Map<string, Object3D>());
    const lightRef = useRef<THREE.DirectionalLight | null>(null)
    const csRef = useRef<THREE.Group>(null)
    const envRef = useRef<THREE.Group>(null)
    const bboxRef = useRef<THREE.BoxHelper>(null)
    const modelsRef = useRef<THREE.Group>(null);
    let frameCount = 0;
    let renderTime = 0;
    const [currentCamera, setCurrentCamera] = useState<PerspectiveCamera>()

    let curState = useModelContext();
    const modelGroup = useLoader(OpenSimLoader, currentModelPath)

    //computeNormals(modelGroup as Group);
    //const animations = modelGroup!.animations;
    const allAnimations = curState.viewerState.animations;

    const collectAnimations = (group: Group)=>{
      group.traverse((o) => {
          const anims = o.animations
          for (let i=0; i<anims.length; i++)
            allAnimations.push(o.animations[i])
      }
    )
    };
    collectAnimations(modelGroup as Group)


    const mapObjectToLayer = (obj: Object3D)=>{
      obj.traverse((obj3d) => {
      obj3d.castShadow = true
    })
  }

    const applyAnimationColors = ()=>{
      colorNodeMap.forEach((node)=>{
         if (node instanceof Mesh){
          const newColor = new Color(node.position.x, node.position.y, node.position.z);
          node.material.color = newColor
         }
      })
    }
    // eslint-disable-next-line no-mixed-operators


    if (curState.scene === null)
      curState.scene = sceneRef.current;
    curState.viewerState.setAnimationList(allAnimations)

    // This useEffect loads the cameras and assign them to its respective states.
    useEffect(() => {
      if (envRef.current && scene) 
        curState.viewerState.setEnvironmentGroup(envRef.current)

      if (modelsRef.current!==null) {
        const boundingBox = new THREE.Box3();
        // // Compute the bounding box of the scene if models are already loaded
        boundingBox.setFromObject(modelsRef.current!);
        const modelbbox = new THREE.Box3().setFromObject(modelGroup!)

        modelsRef.current.add(modelGroup as Group);
        curState.addModelToMap(modelGroup!.uuid, modelGroup!);
        mapObjectToLayer(modelGroup!)
        curState.viewerState.sceneVersion++; // tell the world to refresh rendering
        if (curState.getNumberOfOpenModels()>1 && Number.isFinite(boundingBox.max.z) ) {
          modelGroup!.position.z = boundingBox.max.z-modelbbox.min.z
          const scenebbox = new THREE.Box3().setFromObject(modelsRef.current!)
          curState.fitCameraTo(scenebbox);
        }
        else {
          curState.fitCameraTo(modelbbox);
        }
        // mark scene version changed so that listeners can update
        curState.viewerState.sceneVersion+=1;
        curState.sendModelOffsets();
      }
      const cameras = scene.getObjectsByProperty( 'isPerspectiveCamera', true )
      if (cameras.length > 0) {
        // Get the canvas element from the gl
        var canvas = gl.domElement;
        // Calculate the aspect ratio
        var aspectRatio = canvas.clientWidth / canvas.clientHeight;
        // Set aspectRatio to cameras
        cameras.forEach(function(camera) {
            const cameraPers = camera as PerspectiveCamera
            cameraPers.aspect = aspectRatio;
            cameraPers.updateProjectionMatrix();

            if (envRef.current) {
              envRef.current.add(camera);
            }
        });
        // Update cameras list.
        curState.viewerState.setCamerasList(cameras.map(obj => obj as PerspectiveCamera))
        // Set current camera and current index as 0
        //setCurrentCamera(cameras.length > 0 ? cameras[0] as PerspectiveCamera : new PerspectiveCamera())
        //curState.viewerState.setCurrentCameraIndex(0)
      }
      // else { // use the default camera, call it DefaultCam
      //   if (curState.viewerState.cameras.length === 0){
      //     const cam = camera as PerspectiveCamera;  // Provided by the library
      //     cam.name = "Default Camera"
      //     curState.viewerState.setCamerasList([cam])
      //     curState.setCurrentCameraIndex(0)
      //   }
      // }
      // lightRef.current!.color = viewerState.lightColor
      // spotlightRef.current!.color = viewerState.lightColor
    }, [curState, scene, gl.domElement.clientWidth, gl.domElement, set, modelGroup, viewerState.lightColor, camera]);

    

    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
          viewerState.handleKey(event.key);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [viewerState]);
  
  
    // This useEffect sets the current selected camera.
    useEffect(() => {
      //console.log("Change effect", curState.viewerState.animationsNeedUpdate)
      if (curState.viewerState.cameras.length > 0 && currentCamera) {
        const selectedCamera = curState.viewerState.cameras[curState.viewerState.currentCameraIndex] as PerspectiveCamera;
        setCurrentCamera(selectedCamera);
        set({ camera: selectedCamera });
      }
      if (curState.viewerState.animationsNeedUpdate && curState.viewerState.animationChange !== null) {
        const change = curState.viewerState.animationChange as {index:number, operation:string, time: number};
        if (change.operation === "add") {
          const clipIndex = change.index;
          if (clipIndex !== -1) {
            const nextMixer = new AnimationMixer(curState.viewerState.animationRoots[clipIndex])
            const clip = curState.viewerState.animations[clipIndex]
            const action = nextMixer.clipAction(clip)
            const startTime = curState.viewerState.animationStartTimes[clipIndex]
            nextMixer.addEventListener('loop', (e) => {
              if (e.action === action) {
                action.time = startTime;
              }
            });
            if (curState.guiAnimationLoop) {
              action.setLoop(THREE.LoopRepeat, Infinity);
            }
            else {
              action.setLoop(THREE.LoopOnce, 1);
            }
            mixers[clipIndex] = nextMixer
          }
        }
        else if (change.operation === "update") {
          const clipIndex = curState.viewerState.animations[change.index]?change.index:-1
          if (clipIndex !== -1) {
            const nextMixer = new AnimationMixer(curState.viewerState.animationRoots[clipIndex])
            const clip = curState.viewerState.animations[clipIndex]
            const action = nextMixer.clipAction(clip)
            const startTime = curState.viewerState.animationStartTimes[clipIndex]
            nextMixer.addEventListener('loop', (e) => {
              if (e.action === action) {
                action.time = startTime;
              }
            });
            if (curState.guiAnimationLoop) {
              action.setLoop(THREE.LoopRepeat, Infinity);
            }
            else {
              action.setLoop(THREE.LoopOnce, 1);
            }
            mixers[clipIndex] = nextMixer
          }
        }
        else if (change.operation === "updateLooping") { // if updateLooping we don't create new mixers, reuse existing
          for (let index = 0; index < curState.viewerState.currentAnimationIndices.length; index++) {
            const clipIndex = curState.viewerState.currentAnimationIndices[index];
            if (clipIndex !== -1) {
              const clip = curState.viewerState.animations[clipIndex]
              console.log("Updating looping for clip ", clip.name, " to ", curState.guiAnimationLoop)
              const nextMixer =  mixers[clipIndex]
              const action = nextMixer.clipAction(clip)
              if (curState.guiAnimationLoop) {
                action.setLoop(THREE.LoopRepeat, Infinity);
              }
              else {
                action.setLoop(THREE.LoopOnce, 1);
              }
            }
          }
        }
        else if (change.operation === "delete") {
          const clipIndex = curState.viewerState.animations[change.index]?change.index:-1
          if (clipIndex !== -1) {
            mixers.splice(clipIndex, 1);
          }
        }
        else if (change.operation === "start") {
          // start all mixers by playing their actions
          const indices = viewerState.currentAnimationIndices;
          mixers.forEach((mixer, idx) => {
            if (mixer === undefined) return;
            if (indices.indexOf(idx) === -1) return; // only start if in current indices
            const action = mixer.clipAction(curState.viewerState.animations[idx]);
            if (curState.guiAnimationLoop) {
              action.setLoop(THREE.LoopRepeat, Infinity);
            }
            else {
              action.setLoop(THREE.LoopOnce, 1);
            }
            action.reset();
            action.time = curState.guiAnimationStartTime;
            action.clampWhenFinished = true;
            action.play();
          });
        }
        else if (change.operation === "timeChange"){
          const indices = curState.viewerState.currentAnimationIndices;
          mixers.forEach((mixer, idx) => {
            if (mixer === undefined) return;
            if (indices.indexOf(idx) === -1) return; // only update if in current indices
            const action = mixer.clipAction(curState.viewerState.animations[idx]);
            action.time = viewerState.currentAnimationTime;
            //console.log("Set time to ", action.time, " for clip ", curState.viewerState.animations[idx].name)
            action.reset().play(); // need to play after changing time to apply the change
          });
        }
    }
      curState.viewerState.setAnimationsNeedUpdate(false);
  }, [currentCamera, set, curState.viewerState.currentCameraIndex, 
        curState.viewerState.cameras, curState.viewerState.cameras.length, 
        curState.viewerState.animations, curState.viewerState.animationsNeedUpdate, 
        curState.viewerState.animationChange, camera, mixers, curState.viewerState, 
        curState, scene, viewerState]);

    scene.traverse((o) => {
        sceneObjectMap.set(o.uuid, o);
        if (o.name.startsWith("ColorNode")) {
          colorNodeMap.set(o.uuid, o);
        }
        }
    )


    useFrame((state, delta) => {
      if (!useEffectRunning) {
        // Selection bounding box
        if (curState.selected === "") {
          bboxRef.current!.visible = false;
        } else {
          let selectedObject = sceneObjectMap.get(curState.selected)!;
          if (selectedObject !== undefined && selectedObject.type !== 'BoxHelper') {
            if (bboxRef.current !== null) {
              bboxRef.current.setFromObject(selectedObject);
              bboxRef.current!.visible = true;
            }
          }
        }

        // Coordinate system visibility
        csRef.current!.visible = curState.showGlobalFrame;

        const viewerState = curState.viewerState;
        const indices = viewerState.currentAnimationIndices;

        // Handle animation playback
        for (const idx in indices) {
          const animIndex = indices[idx];
          const mixer = mixers[animIndex];
          const action = mixer.clipAction(viewerState.animations[animIndex]);
          const duration = action.getClip().duration;

          // If we're animating (playing), update the mixer with delta time
          if (viewerState.animating) {
            const direction = curState.guiAnimationReverse ? -1 : 1;
            if (curState.isGuiMode)
              mixer.update(delta * curState.guiAnimationSpeed * direction);
            else
              mixer.update(delta * viewerState.animationSpeed);
            applyAnimationColors();

            // Update animation time from the action
            const currentTime = action.time;
            console.log("Current Animation Time: ", currentTime);
            viewerState.setCurrentAnimationTime(currentTime);
            curState.setTimeGUIAnimation(currentTime);
            // Update slider frame
            const newFrame = Math.trunc((currentTime / duration) * 100);
            if (newFrame !== curState.currentFrame) {
              curState.setCurrentFrame(newFrame);
            }
          }
          // If we're NOT animating but time was changed manually
          else if (viewerState.forceAnimationUpdate ||
                   Math.abs(action.time - viewerState.currentAnimationTime) > 0.001) {

            // Sync the action time with the current animation time from state
            action.time = viewerState.currentAnimationTime;
            mixer.update(0); // Apply the time change without advancing
            applyAnimationColors();

            // Update slider frame to match
            const newFrame = Math.trunc((viewerState.currentAnimationTime / duration) * 100);
            if (newFrame !== curState.currentFrame) {
              curState.setCurrentFrame(newFrame);
            }

            // Reset the force update flag
            if (viewerState.forceAnimationUpdate) {
              viewerState.forceAnimationUpdate = false;
            }
          }
        } 
      }

      // FPS counter
      frameCount++;
      renderTime += delta;
      if (frameCount === 600) {
        const fps = Math.round(frameCount / renderTime);
        curState.sendMeasuredFPS(fps);
        frameCount = 0;
        renderTime = 0;
      }
    });


    // Next block would show bubble on selection with name
    // useFrame((state, delta) => {
    //   if (curState.selectedObject!==null){
    //     const fullName = curState.selectedObject.name;
    //     const splitName = fullName.split("/");
    //     const shortName = splitName[splitName.length - 1];
    //   const cursor = `<svg width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0)"><path fill="rgba(255, 255, 255, 0.5)" d="M29.5 54C43.031 54 54 43.031 54 29.5S43.031 5 29.5 5 5 15.969 5 29.5 15.969 54 29.5 54z" stroke="#000"/><g filter="url(#filter0_d)"><path d="M29.5 47C39.165 47 47 39.165 47 29.5S39.165 12 29.5 12 12 19.835 12 29.5 19.835 47 29.5 47z" fill="${shortName}"/></g><path d="M2 2l11 2.947L4.947 13 2 2z" fill="#000"/><text fill="#000" style="#fff-space:pre" font-family="Inter var, sans-serif" font-size="10" letter-spacing="-.01em"><tspan x="35" y="63">${shortName}</tspan></text></g><defs><clipPath id="clip0"><path fill="#fff" d="M0 0h64v64H0z"/></clipPath><filter id="filter0_d" x="6" y="8" width="47" height="47" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/><feOffset dy="2"/><feGaussianBlur stdDeviation="3"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"/><feBlend in2="BackgroundImageFix" result="effect1_dropShadow"/><feBlend in="SourceGraphic" in2="effect1_dropShadow" result="shape"/></filter></defs></svg>`
    //   const auto = `<svg width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="rgba(255, 255, 255, 0.5)" d="M29.5 54C43.031 54 54 43.031 54 29.5S43.031 5 29.5 5 5 15.969 5 29.5 15.969 54 29.5 54z" stroke="#000"/><path d="M2 2l11 2.947L4.947 13 2 2z" fill="#000"/></svg>`
    //   if (curState.selectedObject!==null) {
    //     document.body.style.cursor = `url('data:image/svg+xml;base64,${btoa(cursor)}'), auto`
    //     return () => {
    //       (document.body.style.cursor = `url('data:image/svg+xml;base64,${btoa(auto)}'), auto`)
    //     }
    //   }
    // }
    // });
    useEffect(() => {
        //console.log("OpenSimScene.useEffect called ", curState.currentModelPath)
        setUseEffectRunning(false)
        if (supportControls) {
            ///curState.setCurrentModelPath(currentModelPath)
            /// curState.setSceneTree(new SceneTreeModel(scene))
            ///curState.setAnimationList(animations)
        }
        return () => {
          curState.setSelected("", false)
          sceneObjectMap.clear();
          setUseEffectRunning(true)
        };
      }, [scene, supportControls, currentModelPath, curState, sceneObjectMap])
    
  function handleClick(event: ThreeEvent<MouseEvent>): void {
    //event.stopPropagation();
    if (event.object !== undefined) {
      const selected_uuid = event.object.uuid;
      if (selected_uuid !== undefined){
        curState.setSelected(selected_uuid, true);
        event.stopPropagation();
      }
      else
        curState.setSelected("", true);
    }
  }

  function clearSelection(): void {
    curState.setSelected("", true);
  }


    // By the time we're here the model is guaranteed to be available
    return <>
      <group name='OpenSim Scene' ref={envRef}>
        <directionalLight name="Scene Dir Light" ref={lightRef} position={[0.5, 1.5, -0.5]}
          intensity={curState.viewerState.lightIntensity} color={curState.viewerState.lightColor}
          castShadow={true}
          shadow-camera-far={8}
          shadow-camera-left={-2}
          shadow-camera-right={2}
          shadow-camera-top={2}
          shadow-camera-bottom={-2}/>
        <ambientLight name="Ambient Light" intensity={0.7} color="white"/>
        <directionalLight name="Dir Light2" position={[0.02, .01, .02]} intensity={1.0} color="white" castShadow={false}/>
        <OpenSimFloor />
        <OpenSimSkySphere
            texturePath={
              curState.viewerState.userPreferences?.skyTexturePath?.trim()
                ? curState.viewerState.userPreferences.skyTexturePath
                : undefined
            }
        />
        <group name='WCS' ref={csRef} visible={curState.showGlobalFrame}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.2]}>
              <cylinderGeometry args={[.005, .005, 0.4, 32]}/>
              <meshStandardMaterial color="blue" />
          </mesh>
          <mesh rotation={[0, 0, 0]}  position={[0, 0.2, 0]}>
            <cylinderGeometry args={[.005, .005, 0.4, 32]}/>
            <meshStandardMaterial color="green" />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}  position={[0.2, 0, 0]}>
            <cylinderGeometry args={[.005, .005, 0.4, 32]}/>
            <meshStandardMaterial color="red" />
          </mesh>
        </group>
        <group name='Models' ref={modelsRef}  
            onClick={(e)=>{ handleClick(e);}}
            onPointerMissed={(e)=>{clearSelection();}} 
        />
      </group>

      <boxHelper name='SelectionBox' ref={bboxRef} visible={false}/>
      </>
}

export default observer(OpenSimGUIScene)
