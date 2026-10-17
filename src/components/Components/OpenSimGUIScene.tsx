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
import { time } from 'console';
import { ModelUIState } from '../../state/ModelUIState';

interface OpenSimSceneProps {
    currentModelPath: string,
    supportControls:boolean
}

class MultiMixerTimeline {
  private time: number = 0;
  private start: number = 0;
  private end: number = 0;
    
  private guiState: ModelUIState | null = null;
  private mixers: AnimationMixer[] = [];
  
  constructor(gState: ModelUIState | null, animationMixers: AnimationMixer[]) {
    this.guiState = gState;
    this.mixers = animationMixers;
  }

  setRange(start: number, end: number): void {
    this.start = start;
    this.end = end;
    this.time = THREE.MathUtils.clamp(this.time, this.start, this.end);
  }

  seek(time: number): void {
    this.time = THREE.MathUtils.clamp(time, this.start, this.end);
    const curState = this.guiState!;
    const indices = curState.viewerState.currentAnimationIndices;
    this.mixers.forEach((mixer, idx) => {
      if (mixer === undefined) return;
      if (indices!.indexOf(idx) === -1) return; // only start if in current indices
      const action = mixer.clipAction(curState.viewerState.animations[idx]);
      action.reset();
      action.time = this.time;
      action.paused = false;
    });
    this.apply();
  }

  getTime(): number {
    return this.time;
  }

  startAnimation(): void {
    const curState = this.guiState!;
    this.time = curState.viewerState.currentAnimationTime;
    const indices = curState.viewerState.currentAnimationIndices;
    this.mixers.forEach((mixer, idx) => {
      if (mixer === undefined) return;
      if (indices!.indexOf(idx) === -1) return; // only start if in current indices
      const action = mixer.clipAction(curState.viewerState.animations[idx]);
      action.reset();
      action.time = this.time;
      action.paused = false;
    });
    this.apply();
  }

  update(delta: number): void {
    const curState = this.guiState!;
    const direction = curState.guiAnimationReverse ? -1 : 1;
    const dDelta = delta * curState.guiAnimationSpeed * direction
    if (curState.viewerState.animating && this.end > this.start) {
      const span = this.end - this.start;
      const next = this.time + dDelta;
      //console.log("Span:", span, "next:", next, "current time:", this.time, "start:", this.start, "end:", this.end);
      if (next - this.start > span && !curState.guiAnimationLoop) {
        //console.log("Animation time exceeded end, stopping ...");
        this.time = this.end;
      }
      else if (next - this.start < 0) {
        //console.log("Animation time went below start, stopping ...");
        this.time = this.start;
      }
      else {
        // Wrap into [start, end) for forward or reverse playback
        const wrapped = this.start + (((next - this.start) % span) + span) % span;
        this.time = wrapped;
      }
    }
    //console.log("Updated time:", this.time, "now applying to mixers ...");
    this.apply();
  }

  private apply(): void {
    const touched = new Set<THREE.AnimationMixer>();
    const curState = this.guiState!;
    const indices = curState.viewerState.currentAnimationIndices;
    this.mixers.forEach((mixer, idx) => {
      if (mixer === undefined) return;
      if (indices!.indexOf(idx) === -1) return; // only start if in current indices
      const action = mixer.clipAction(curState.viewerState.animations[idx]);
      action.time = this.time;
      //console.log(`Applying time ${this.time} to mixer for animation ${curState.viewerState.animations[idx].name}`);
      action.play();
    });
    for (const mixer of this.mixers) {
      touched.add(mixer);
    }

    // One update per mixer, in case several actions share it
    for (const mixer of touched) mixer.update(0);
  }
}

const OpenSimGUIScene: React.FC<OpenSimSceneProps> = ({ currentModelPath, supportControls }) => {

    // useGLTF suspends the component, it literally stops processing
    const { set, gl} = useThree();
    const { scene, camera } = useThree();
    const uiState = useModelContext();
    const viewerState = uiState.viewerState;
    viewerState.setDefaultCamera(camera);
    const sceneRef = useRef<THREE.Scene>(scene);
    const [sceneObjectMap] = useState<Map<string, Object3D>>(new Map<string, Object3D>());
    const [useEffectRunning, setUseEffectRunning] = useState<boolean>(false)
    const [mixers, ] = useState<AnimationMixer[]>([])
    const [timeline] = useState<MultiMixerTimeline>(new MultiMixerTimeline(uiState, mixers));
    const [colorNodeMap] = useState<Map<string, Object3D>>(new Map<string, Object3D>());
    const lightRef = useRef<THREE.DirectionalLight | null>(null)
    const csRef = useRef<THREE.Group>(null)
    const bboxRef = useRef<THREE.BoxHelper>(null)
    const modelsRef = useRef<THREE.Group>(null);
    const tripodsRef = useRef<THREE.Group>(null);
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
      if (tripodsRef.current && scene) 
        curState.viewerState.setTripodsGroup(tripodsRef.current)

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
    }, [curState, scene, set, modelGroup, camera]);


    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
          if (event.ctrlKey) {
            event.preventDefault(); // Prevent default behavior for Ctrl key combinations
            viewerState.handleKey(event.key);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [viewerState]);

    useEffect(() => {
      if (curState.viewerState.cameras.length > 0 && currentCamera && curState.viewerState.currentCameraIndex !== -1) {
        const selectedCamera = curState.viewerState.cameras[curState.viewerState.currentCameraIndex] as PerspectiveCamera;
        if (selectedCamera !== camera) {
          setCurrentCamera(selectedCamera);
          set({camera: selectedCamera});
        }
      }
    }, [
      curState.viewerState.currentCameraIndex,
      curState.viewerState.cameras
    ]);
  
    // This useEffect sets the current selected camera.
    useEffect(() => {
      //console.log("Change effect", curState.viewerState.animationsNeedUpdate)
      if (curState.viewerState.cameras.length > 0 && currentCamera && curState.viewerState.currentCameraIndex !== -1) {
        const selectedCamera = curState.viewerState.cameras[curState.viewerState.currentCameraIndex] as PerspectiveCamera;
        setCurrentCamera(selectedCamera);
        set({ camera: selectedCamera });
      }
      if (curState.viewerState.animationsNeedUpdate && curState.viewerState.animationChange !== null) {
        const change = curState.viewerState.animationChange as {index:number, operation:string, time: number, startTime: number, endTime: number};
        if (change.operation === "add") {
          const clipIndex = change.index;
          if (clipIndex !== -1) {
            const nextMixer = new AnimationMixer(curState.viewerState.animationRoots[clipIndex])
            const clip = curState.viewerState.animations[clipIndex]
            const action = nextMixer.clipAction(clip)
            const startTime = curState.viewerState.animationStartTimes[clipIndex]
            action.setLoop(THREE.LoopOnce, 1);
            
            if (curState.viewerState.isDollyAnimation[clipIndex] && curState.viewerState.currentAnimationIndices.length === 1) {
              nextMixer.addEventListener('finished', (e) => {
                // Handle dolly animation finished event
                console.log(`Dolly animation ${clip.name} finished.`);
                viewerState.setAnimating(false);
              });
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
            action.setLoop(THREE.LoopOnce, 1);
            if (curState.viewerState.isDollyAnimation[clipIndex] && curState.viewerState.currentAnimationIndices.length === 1) {
              nextMixer.addEventListener('finished', (e) => {
                // Handle dolly animation finished event
                console.log(`Dolly animation ${clip.name} finished.`);
                viewerState.setAnimating(false);
              });
            }
            mixers[clipIndex] = nextMixer
          }
        }
        else if (change.operation === "updateLooping") { // if updateLooping we don't create new mixers, reuse existing
          // nothing to do here, the looping state is handled in the animation playback logic
        }
        else if (change.operation === "delete") {
          const clipIndex = curState.viewerState.animations[change.index]?change.index:-1
          if (clipIndex !== -1) {
            mixers.splice(clipIndex, 1);
          }
        }
        else if (change.operation === "start") {
          timeline.startAnimation();
        }
        else if (change.operation === "timeChange"){
          timeline.seek(change.time);
        }
        else if (change.operation === "animationsChanged") {
          timeline.setRange(change.startTime, change.endTime);
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
        if (curState.visibleHelpers) {
          const helper = scene?.getObjectByName("temp_helper");
          if (helper && helper.type === "DirectionalLightHelper") {
            (helper as THREE.DirectionalLightHelper).update();
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
          if (mixer === undefined) continue; // Guard against mixer not populated yet pending useEffect
          const action = mixer.clipAction(viewerState.animations[animIndex]);
          const duration = action.getClip().duration;

          // Check if time is controlled externally (by recorder)
          if (viewerState.isTimeControlledExternally) {
            // Use the external time set by the recorder
            const externalTime = viewerState.externalAnimationTime;

            // Update the mixer time without advancing
            action.time = externalTime;
            mixer.update(0); // Apply the time change without advancing
            applyAnimationColors();

            // Update UI elements
            const newFrame = Math.trunc((externalTime / duration) * 100);
            if (newFrame !== curState.currentFrame) {
              curState.setCurrentFrame(newFrame);
            }

            // Update viewer state time
            viewerState.setCurrentAnimationTime(externalTime);
            curState.setTimeGUIAnimation(externalTime);

            // Skip normal animation logic
            continue;
          }

          // If we're animating (playing), update the mixer with delta time
          if (viewerState.animating) {
            const direction = curState.guiAnimationReverse ? -1 : 1;
            if (curState.isGuiMode)
              timeline.update(delta);
            else
              mixer.update(delta * viewerState.animationSpeed);

            if (viewerState.isDollyAnimation[animIndex]) {
              const cam = viewerState.cameras[viewerState.currentCameraIndex];
              // cam could be null or undefined if currentCameraIndex is -1
              if (cam) {
                  cam.updateMatrixWorld(true);
              }
            }

            applyAnimationColors();

            // Update animation time from the action
            const currentTime = timeline.getTime();
            //console.log("Current Animation Time: ", currentTime);
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
      <group name='OpenSim Scene'>
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
        <group name='Tripods' ref={tripodsRef}>
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