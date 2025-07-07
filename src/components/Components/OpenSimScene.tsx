import { useGLTF } from '@react-three/drei'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { TransformControls } from '@react-three/drei'

import * as THREE from 'three';

import { useEffect, useRef, useState } from 'react'
import { AnimationMixer, BoxHelper, Color, Group, Mesh, Object3D} from 'three'
import { observer } from 'mobx-react'

import SceneTreeModel from '../../helpers/SceneTreeModel'
import { useModelContext } from '../../state/ModelUIStateContext'
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera'

import viewerState from '../../state/ViewerState'
import { ModelUIState } from '../../state/ModelUIState'

import { DirectionalLightHelper, SpotLightHelper } from 'three';
import OpenSimFloor from './OpenSimFloor';
import OpenSimSkySphere from './OpenSimSkySphere';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface OpenSimSceneProps {
    currentModelPath: string,
    supportControls:boolean
}

const OpenSimScene: React.FC<OpenSimSceneProps> = ({ currentModelPath, supportControls }) => {
    //const modelGroup = useLoader(GLTFLoader, currentModelPath)
    const { scene, animations } = useGLTF(currentModelPath);

    const { set, gl, camera} = useThree();

    const envRef = useRef<THREE.Group>(null)
    const dirLightHelperRef = useRef<DirectionalLightHelper | null>(null);
    const spotLightHelperRef = useRef<SpotLightHelper | null>(null);

    const [isDirectionalVisible, setDirectionalVisible] = useState(false);
    const [isSpotVisible, setSpotVisible] = useState(false);

    const no_face_cull = (scene: Group)=>{
      if (scene) {
        scene.traverse((o)=>{
          if (o.name.endsWith("path")){
            o.frustumCulled = false;
          }
          mapObjectToLayer(o)

        })
      }
    };

    const LayerMap = new Map([
      ["Mesh", 1],
      ["Force", 2],
      ["World", 3],
      ["Marker", 4],
      ["ExpMarker", 5],
      ["expForce", 6],
      ["WrapSphere", 7],
      ["WrapCylinder", 7],
      ["WrapEllipsoid", 7],
      ["WrapTorus", 7],
      ["wrapObject", 7],
      ["ContactSphere", 8],
      ["ContactMesh", 8],
      ["ContactHalfSpace", 8]
    ]);

    const mapObjectToLayer = (obj3d: Object3D)=>{
      if (obj3d.userData !== null && obj3d.userData !== undefined &&
          obj3d.userData.opensimType !== undefined) {
        let layerNum = LayerMap.get(obj3d.userData.opensimType)
        if (layerNum === undefined)
          layerNum = 0
        obj3d.layers.set(layerNum)
        obj3d.castShadow = true
    }
  }
    no_face_cull(scene);

    const applyAnimationColors = ()=>{
      colorNodeMap.forEach((node)=>{
         if (node instanceof Mesh){
          const newColor = new Color(node.position.x, node.position.y, node.position.z);
          node.material.color = newColor
         }
      })
    }
    // eslint-disable-next-line no-mixed-operators
    const [sceneObjectMap] = useState<Map<string, Object3D>>(new Map<string, Object3D>());
    const [objectSelectionBox, setObjectSelectionBox] = useState<BoxHelper | null>(new BoxHelper(scene));
    const [useEffectRunning, setUseEffectRunning] = useState<boolean>(false)
    const [animationIndex, setAnimationIndex] = useState<number>(-1)
    const [startTime, setStartTime] = useState<number>(0)
    const [mixers, ] = useState<AnimationMixer[]>([])
    const [colorNodeMap] = useState<Map<string, Object3D>>(new Map<string, Object3D>());

    let curState = useModelContext();
    curState.scene = scene;

    const sceneRef = useRef<THREE.Scene>()
    const lightRef = useRef<THREE.DirectionalLight | null>(null)
    const spotlightRef = useRef<THREE.SpotLight>(null)
    const camerasGroupRef = useRef<THREE.Group>(null);
    const [currentCamera, setCurrentCamera] = useState<PerspectiveCamera>()

    // This useEffect loads the cameras and assign them to its respective states.
    useEffect(() => {
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

          // Remove camera from its current parent if it has one
          if (camera.parent) {
            camera.parent.remove(camera);
          }

          // Add camera to the cameras group
          if (camerasGroupRef.current) {
            camerasGroupRef.current.add(camera);
          }
        });

        // Update cameras list.
        curState.setCamerasList(cameras.map(obj => obj as PerspectiveCamera));
        // Set current camera and current index as 0
        setCurrentCamera(cameras.length > 0 ? cameras[0] as PerspectiveCamera : new PerspectiveCamera());
        curState.setCurrentCameraIndex(0);
      }
      else { // use the default camera, call it DefaultCam
        if (curState.cameras.length === 0){
          const cam = camera as PerspectiveCamera;  // Provided by the library
          cam.name = "Default Camera"
          curState.setCamerasList([cam])
          curState.setCurrentCameraIndex(0)
        }

      }
//      lightRef.current!.color = curState.viewerState.lightColor
//      spotlightRef.current!.color = curState.viewerState.lightColor
    }, [curState, scene, gl.domElement.clientWidth, gl.domElement, set, camera]);

    // This useEffect sets the current selected camera.
    useEffect(() => {
      if (curState.cameras.length > 0 && currentCamera) {
        const selectedCamera = curState.cameras[curState.currentCameraIndex] as PerspectiveCamera;
        setCurrentCamera(selectedCamera);
        set({ camera: selectedCamera });

        animations.forEach((clip) => {
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
    }, [currentCamera, set, curState.currentCameraIndex, curState.cameras, animations]);

    // This useEffect adds helpers to the lights.
    useEffect(() => {
      if (lightRef.current && scene) {
        const helper = new DirectionalLightHelper(lightRef.current, 0.5);
        dirLightHelperRef.current = helper;
        scene.add(helper);
      }

      if (spotlightRef.current && scene) {
        const helper = new SpotLightHelper(spotlightRef.current, curState.viewerState.lightColor);
        spotLightHelperRef.current = helper;
        scene.add(helper);
      }

      return () => {
        if (dirLightHelperRef.current) {
          scene.remove(dirLightHelperRef.current);
          dirLightHelperRef.current.dispose?.();
        }
        if (spotLightHelperRef.current) {
          scene.remove(spotLightHelperRef.current);
          spotLightHelperRef.current.dispose?.();
        }
      };
    }, [scene, lightRef.current, spotlightRef.current]);

    if (supportControls) {
      scene.traverse((o) => {
          sceneObjectMap.set(o.uuid, o);
          if (o.name.startsWith("ColorNode")) {
            colorNodeMap.set(o.uuid, o);
          }
          }
      )

      if (objectSelectionBox !== null) {
        objectSelectionBox.visible = false;
        scene.add(objectSelectionBox!);
      }
      // First child of scene is model, grab info from it
      const modelData = scene.children[0].userData;
      if (modelData.name.startsWith('Model')){
        // Populate model name, description and authors if not null
        let desc = 'description'
        let authors = 'authors'
        if (modelData.description !== undefined)
          desc = modelData.description
        if (modelData.authors !== undefined)
          authors = modelData.authors
        curState.setModelInfo(modelData.name, desc, authors)
      }
    }

    // Make sure mixers match animations
    if ((animations.length > 0 && mixers.length !==animations.length) ||
        (animations.length > 0 && mixers.length > 0 && mixers[0].getRoot() !== scene)) {
        mixers.length = 0
        animations.forEach((clip) => {
            const nextMixer = new AnimationMixer(scene)
            nextMixer.clipAction(clip, scene)
            mixers.push(nextMixer)
        });
        //setMixers(mixers)
    }

    useFrame((state, delta) => {
      if (!useEffectRunning) {
          if (curState !== undefined) {
            if (supportControls ) {
              if (curState.selected === "") {
                if (objectSelectionBox !== null)
                    objectSelectionBox!.visible = false
              }
              else {
                let selectedObject = sceneObjectMap.get(curState.selected)!
                if (selectedObject !== undefined && selectedObject.type === "Mesh") {
                    if (objectSelectionBox !== null) {
                      objectSelectionBox?.setFromObject(selectedObject);
                      objectSelectionBox!.visible = true
                  }
                }
              }
            }

            if (curState.currentAnimationIndex !== animationIndex) {
              const newAnimationIndex = curState.currentAnimationIndex
              const oldIndex  = animationIndex
              // animation has changed
              if (oldIndex !== -1){
                mixers[oldIndex].stopAllAction()
              }
              setAnimationIndex(newAnimationIndex)
              mixers[curState.currentAnimationIndex]?.clipAction(animations[curState.currentAnimationIndex]).play()
            }
            if (supportControls && curState.animating){
              if (curState.currentAnimationIndex!==-1) {
                let duration = mixers[curState.currentAnimationIndex].clipAction(animations[curState.currentAnimationIndex]).getClip().duration;

                if(curState.currentFrame !== startTime) {
                  const framePercentage = curState.currentFrame / 100;
                  const currentTimeInSlider = duration * framePercentage;
                  mixers[curState.currentAnimationIndex].clipAction(animations[curState.currentAnimationIndex]).time =  currentTimeInSlider;
                }
                const currentTime = mixers[curState.currentAnimationIndex].clipAction(animations[curState.currentAnimationIndex]).time
                mixers[curState.currentAnimationIndex].update(delta * curState.animationSpeed)
                //console.log(duration)
                // For material at index "key" setColor to nodes["value"].translation
                applyAnimationColors();
                curState.setCurrentFrame(Math.trunc((currentTime / duration) * 100))
                setStartTime(Math.trunc((currentTime / duration) * 100))
              }
            } else if (supportControls) {
              if (curState.currentAnimationIndex!==-1) {
                if(curState.currentFrame !== startTime) {
                  let duration = mixers[curState.currentAnimationIndex]?.clipAction(animations[curState.currentAnimationIndex]).getClip().duration;
                  const framePercentage = curState.currentFrame / 100;
                  const currentTime = duration * framePercentage;
                  // For material at index "key" setColor to nodes["value"].translation
                  applyAnimationColors();
                  mixers[curState.currentAnimationIndex].clipAction(animations[curState.currentAnimationIndex]).time = currentTime;
                  setStartTime(curState.currentFrame)
                  mixers[curState.currentAnimationIndex].update(delta * curState.animationSpeed)
                }
              }
            }
          }
      }
      if (lightRef.current) {
        setDirectionalVisible(lightRef.current.visible);
      }
      if (spotlightRef.current) {
        setSpotVisible(spotlightRef.current.visible);
      }
      if (dirLightHelperRef.current && lightRef.current) {
        dirLightHelperRef.current.visible = lightRef.current.visible;
        dirLightHelperRef.current.update();
      }
      if (spotLightHelperRef.current && spotlightRef.current) {
        spotLightHelperRef.current.visible = spotlightRef.current.visible;
        spotLightHelperRef.current.update();
      }
    })

    useEffect(() => {
        //console.log("OpenSimScene.useEffect called ", curState.currentModelPath)
        setUseEffectRunning(false)
        if (supportControls) {
            curState.setCurrentModelPath(currentModelPath)
            curState.setSceneTree(new SceneTreeModel(scene))
            curState.setAnimationList(animations)
        }
        return () => {
          if (objectSelectionBox !== null){
            scene.remove(objectSelectionBox)
            setObjectSelectionBox(null);
            curState.setSelected("")
          }
          sceneObjectMap.clear();
          setUseEffectRunning(true)
        };
      }, [scene, animations, supportControls, currentModelPath, curState, sceneObjectMap, objectSelectionBox])


    // By the time we're here the model is guaranteed to be available
    return <>
    <primitive object={scene} ref={sceneRef}
      onPointerDown={(e: any) => curState.setSelected(e.object.uuid)}
      onPointerMissed={() => curState.setSelected("")}
      />
      <group name='OpenSimEnvironment' ref={envRef}>
          <group name="Cameras" ref={camerasGroupRef}></group>
          <group name="Illumination">
            <directionalLight name="Directional Light" ref={lightRef} position={[0.5, 1.5, -0.5]}
              intensity={curState.viewerState.lightIntensity} color={curState.viewerState.lightColor}
              castShadow={true}
              shadow-camera-far={8}
              shadow-camera-left={-2}
              shadow-camera-right={2}
              shadow-camera-top={2}
              shadow-camera-bottom={-2}/>
          </group>
        <OpenSimFloor                   
            texturePath={
                  curState.viewerState.userPreferences?.floorTexturePath?.trim()
                    ? curState.viewerState.userPreferences.floorTexturePath
                    : undefined
            }
        />
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
