import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'

import * as THREE from 'three';

import { useEffect, useRef, useState } from 'react'
import { AnimationMixer, BoxHelper, Color, Mesh, Object3D} from 'three'
import { observer } from 'mobx-react'


import SceneTreeModel from '../../helpers/SceneTreeModel'
import { useModelContext } from '../../state/ModelUIStateContext'
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera'


import { DirectionalLightHelper, SpotLightHelper } from 'three';
import OpenSimFloor from './OpenSimFloor';
import OpenSimSkySphere from './OpenSimSkySphere';

interface OpenSimSceneProps {
    currentModelPath: string,
    supportControls:boolean
}

const OpenSimScene: React.FC<OpenSimSceneProps> = ({ currentModelPath, supportControls }) => {
    //const modelGroup = useLoader(GLTFLoader, currentModelPath)
    const { scene, animations } = useGLTF(currentModelPath ? currentModelPath : "/builtin/double_pendulum.gltf");

    const { set, gl, camera} = useThree();

    const envRef = useRef<THREE.Group>(null)
    const dirLightHelperRef = useRef<DirectionalLightHelper | null>(null);
    const spotLightHelperRef = useRef<SpotLightHelper | null>(null);

    const [, setDirectionalVisible] = useState(false);
    const [, setSpotVisible] = useState(false);

    let curState = useModelContext();
    curState.scene = scene;

    const sceneRef = useRef<THREE.Scene>();
    const [sceneObjectMap] = useState<Map<string, Object3D>>(new Map<string, Object3D>());
    const [useEffectRunning, setUseEffectRunning] = useState<boolean>(false)
    const [animationIndex, setAnimationIndex] = useState<number>(-1)
    const [startTime, setStartTime] = useState<number>(0)
    const [mixers, ] = useState<AnimationMixer[]>([])
    const [colorNodeMap] = useState<Map<string, Object3D>>(new Map<string, Object3D>());
    //const selected = useSelect().map((sel) => console.log(sel))
    const lightRef = useRef<THREE.DirectionalLight | null>(null)
    const spotlightRef = useRef<THREE.SpotLight>(null)

    const [currentCamera, setCurrentCamera] = useState<PerspectiveCamera>()

    //no_face_cull(scene);

    const applyAnimationColors = ()=>{
      colorNodeMap.forEach((node)=>{
         if (node instanceof Mesh){
          const newColor = new Color(node.position.x, node.position.y, node.position.z);
          node.material.color = newColor
         }
      })
    }
    // eslint-disable-next-line no-mixed-operators
    const [objectSelectionBox, setObjectSelectionBox] = useState<BoxHelper | null>(new BoxHelper(scene));

    // This useEffect loads the cameras and assign them to its respective states.
    useEffect(() => {
      if (envRef.current && scene)
        curState.viewerState.setEnvironmentGroup(envRef.current)

      const cameras = scene.getObjectsByProperty('isPerspectiveCamera', true);
      console.log(`Number of cameras: ${cameras.length}`);
      cameras.forEach((camera, index) => {
        console.log(`Camera ${index + 1}:`);
        console.log(`  Name: ${camera.name}`);
        console.log(`  Type: ${camera.type}`);
      });

      if (cameras.length > 0) {
        // Get the canvas element from the gl
        var canvas = gl.domElement;
        // Calculate the aspect ratio
        var aspectRatio = canvas.clientWidth / canvas.clientHeight;
        // Set aspectRatio to cameras
        cameras.forEach(function(camera) {
          const cameraPers = camera as PerspectiveCamera;
          cameraPers.aspect = aspectRatio;
          cameraPers.updateProjectionMatrix();
        });

        // Update cameras list.
        curState.viewerState.setCamerasList(cameras.map(obj => obj as PerspectiveCamera));
        // Set current camera and current index as 0
        setCurrentCamera(cameras.length > 0 ? cameras[0] as PerspectiveCamera : new PerspectiveCamera());
        curState.viewerState.setCurrentCameraIndex(0);
      }
    }, [curState, scene, gl.domElement.clientWidth, gl.domElement, set, camera]);

    // This useEffect sets the current selected camera.
    useEffect(() => {
      if (curState.viewerState.cameras.length > 0 && currentCamera) {
        const selectedCamera = curState.viewerState.cameras[curState.viewerState.currentCameraIndex] as PerspectiveCamera;
        setCurrentCamera(selectedCamera);
        set({ camera: selectedCamera });

        curState.viewerState.animations.forEach((clip) => {
          clip.tracks.forEach((track) => {
            if (track.name.includes(selectedCamera.name)) {
              if (track.name.endsWith('.position')) {
                // Extract initial position
                const initialPosition = new THREE.Vector3(
                  track.values[0],
                  track.values[1],
                  track.values[2]
                );
                console.log("INITIAL")
                console.log(initialPosition)
                selectedCamera.position.copy(initialPosition);
              }

              if (track.name.endsWith('.quaternion')) {
                // Extract initial rotation (quaternion)
                const initialRotation = new THREE.Quaternion(
                  track.values[0],
                  track.values[1],
                  track.values[2],
                  track.values[3]
                );
                console.log("INITIAL")
                console.log(initialRotation)
                selectedCamera.quaternion.copy(initialRotation);
              }

              if (track.name.endsWith('.rotation')) {
                // Extract initial rotation (Euler)
                const initialRotation = new THREE.Euler(
                  track.values[0],
                  track.values[1],
                  track.values[2]
                );
                console.log("INITIAL")
                console.log(initialRotation)
                selectedCamera.rotation.copy(initialRotation);
              }
            }
          });
        });
      }
    }, [currentCamera, set, curState.viewerState.currentCameraIndex, curState.viewerState.cameras, animations, curState.viewerState.animations]);

    if (supportControls) {
      scene.traverse((o) => {
          sceneObjectMap.set(o.uuid, o);
          if (o.name.startsWith("ColorNode")) {
            colorNodeMap.set(o.uuid, o);
          }
        })

      if (objectSelectionBox !== null) {
        objectSelectionBox.visible = false;
        scene.add(objectSelectionBox!);
      }
      // First child of scene is model, grab info from it
      // const modelData = scene.children[0].userData;
      // if (modelData.name.startsWith('Model')){
      //   // Populate model name, description and authors if not null
      //   let desc = 'description'
      //   let authors = 'authors'
      //   if (modelData.description !== undefined)
      //     desc = modelData.description
      //   if (modelData.authors !== undefined)
      //     authors = modelData.authors
      //   curState.setModelInfo(modelData.name, desc, authors)
      // }
    }

    // Make sure mixers match animations
    if ((curState.viewerState.animations.length > 0 && mixers.length !==curState.viewerState.animations.length) ||
        (curState.viewerState.animations.length > 0 && mixers.length > 0 && mixers[0].getRoot() !== scene)) {
        mixers.length = 0
        curState.viewerState.animations.forEach((clip) => {
            const nextMixer = new AnimationMixer(scene)
            nextMixer.clipAction(clip, scene)
            mixers.push(nextMixer)
        });
        //setMixers(mixers)
    }

    useFrame((state, delta) => {
      if (!useEffectRunning) {
        if (curState !== undefined) {
          if (supportControls) {
            if (curState.selected === "") {
              if (objectSelectionBox !== null)
                objectSelectionBox!.visible = false;
            } else {
              let selectedObject = sceneObjectMap.get(curState.selected)!;
              if (selectedObject !== undefined && selectedObject.type === "Mesh") {
                if (objectSelectionBox !== null) {
                  objectSelectionBox?.setFromObject(selectedObject);
                  objectSelectionBox!.visible = true;
                }
              }
            }
          }

          if (curState.viewerState.currentAnimationIndices[0] !== animationIndex) {
            const newAnimationIndex = curState.viewerState.currentAnimationIndices[0];
            const oldIndex = animationIndex;
            if (oldIndex !== -1 && mixers[oldIndex]) mixers[oldIndex].stopAllAction();
            setAnimationIndex(newAnimationIndex);

            if (newAnimationIndex !== -1 && mixers[newAnimationIndex]) {
              mixers[newAnimationIndex].clipAction(animations[newAnimationIndex]).play();
            }
          }

          const idx = curState.viewerState.currentAnimationIndices;
          if (supportControls && idx.length>0 && mixers[idx[0]]) {
            const mixer = mixers[idx[0]];
            const action = mixer.clipAction(animations[idx[0]]);
            const duration = action.getClip().duration;

            // CASE 1: PLAYING (animating) - Update animation time and UI
            if (curState.viewerState.animating) {
              mixer.update(delta * curState.viewerState.animationSpeed);
              applyAnimationColors();

              // Update the currentAnimationTime in state
              const currentTime = action.time;
              curState.viewerState.setCurrentAnimationTime(currentTime);

              // Also update the percentage for backward compatibility if needed
              const newFrame = Math.trunc((currentTime / duration) * 100);
              if (newFrame !== curState.currentFrame) {
                curState.setCurrentFrame(newFrame);
              }

            // CASE 2: PAUSED but user changes time via slider/input
            } else if (!curState.viewerState.isRecordingVideo) {
              // Check if animation time has been changed externally (via UI)
              const currentTime = action.time;
              const stateTime = curState.viewerState.currentAnimationTime;

              // If times don't match, sync the animation to the UI time
              if (Math.abs(currentTime - stateTime) > 0.001) {
                action.time = stateTime;
                mixer.update(0); // Update mixer without advancing time
                applyAnimationColors();
              }

            // CASE 3: RECORDING - Use deterministic time stepping
            } else {
              // During recording, the VideoRecorder controls the time directly
              // Just ensure the animation is synced to the current time
              const currentTime = curState.viewerState.currentAnimationTime;
              if (Math.abs(action.time - currentTime) > 0.001) {
                action.time = currentTime;
                mixer.update(0);
                applyAnimationColors();
              }
            }
          }
        }
      }

      if (lightRef.current) setDirectionalVisible(lightRef.current.visible);
      if (spotlightRef.current) setSpotVisible(spotlightRef.current.visible);
      if (dirLightHelperRef.current && lightRef.current) {
        dirLightHelperRef.current.visible = lightRef.current.visible;
        dirLightHelperRef.current.update();
      }
      if (spotLightHelperRef.current && spotlightRef.current) {
        spotLightHelperRef.current.visible = spotlightRef.current.visible;
        spotLightHelperRef.current.update();
      }
    });


    useEffect(() => {
        //console.log("OpenSimScene.useEffect called ", curState.currentModelPath)
        setUseEffectRunning(false)
        if (supportControls) {
            ///curState.setCurrentModelPath(currentModelPath)
            curState.setSceneTree(new SceneTreeModel(scene))
            curState.viewerState.setAnimationList(animations)
        }
        return () => {
          if (objectSelectionBox !== null){
            scene.remove(objectSelectionBox)
            setObjectSelectionBox(null);
            curState.setSelected("", false)
          }
          sceneObjectMap.clear();
          setUseEffectRunning(true)
        };
      }, [scene, animations, supportControls, currentModelPath, curState, sceneObjectMap, objectSelectionBox])


    // By the time we're here the model is guaranteed to be available
    return <>
    <primitive object={scene} ref={sceneRef}
      onPointerDown={(e: any) => curState.setSelected(e.object.uuid, false)}
      onPointerMissed={() => curState.setSelected("", false)}
      />
      <group name='OpenSimEnvironment' ref={envRef}>
          <directionalLight name="Directional Light" ref={lightRef} position={[0.5, 1.5, -0.5]}
            intensity={curState.viewerState.lightIntensity} color={curState.viewerState.lightColor}
            castShadow={true}
            shadow-camera-far={8}
            shadow-camera-left={-2}
            shadow-camera-right={2}
            shadow-camera-top={2}
            shadow-camera-bottom={-2}/>
        {supportControls && <OpenSimFloor                   
            texturePath={
                  curState.viewerState.userPreferences?.floorTexturePath?.trim()
                    ? curState.viewerState.userPreferences.floorTexturePath
                    : undefined
            }
        />}
        <group name='WCS' visible={curState.showGlobalFrame}>
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
        {supportControls && <OpenSimSkySphere
          texturePath={
            curState.viewerState.userPreferences?.skyTexturePath?.trim()
              ? curState.viewerState.userPreferences.skyTexturePath
              : undefined
          }
        />}
      </group>
    </>
}

export default observer(OpenSimScene)
