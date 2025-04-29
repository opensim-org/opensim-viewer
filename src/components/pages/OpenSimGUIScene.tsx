import { ThreeEvent, useFrame, useLoader, useThree } from '@react-three/fiber'

import * as THREE from 'three';

import { useEffect, useRef, useState } from 'react'
import { AnimationMixer, Color, Group, Mesh, Object3D} from 'three'
import { observer } from 'mobx-react'

import { useModelContext } from '../../state/ModelUIStateContext'
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera'
import viewerState from '../../state/ViewerState'
import { OpenSimLoader } from '../../state/OpenSimLoader';
import OpenSimFloor from './OpenSimFloor';


interface OpenSimSceneProps {
    currentModelPath: string,
    supportControls:boolean
}

const OpenSimGUIScene: React.FC<OpenSimSceneProps> = ({ currentModelPath, supportControls }) => {

    // useGLTF suspends the component, it literally stops processing
    const { set, gl} = useThree();
    const { camera, scene } = useThree();
    const sceneRef = useRef<THREE.Scene>(scene);
    const [sceneObjectMap] = useState<Map<string, Object3D>>(new Map<string, Object3D>());
    const [useEffectRunning, setUseEffectRunning] = useState<boolean>(false)
    const [animationIndex, setAnimationIndex] = useState<number>(-1)
    const [startTime, setStartTime] = useState<number>(0)
    const [mixers, ] = useState<AnimationMixer[]>([])
    const [colorNodeMap] = useState<Map<string, Object3D>>(new Map<string, Object3D>());
    const lightRef = useRef<THREE.DirectionalLight | null>(null)
    const spotlightRef = useRef<THREE.SpotLight>(null)
    const csRef = useRef<THREE.Group>(null)
    const envRef = useRef<THREE.Group>(null)
    const bboxRef = useRef<THREE.BoxHelper>(null)
    const modelsRef = useRef<THREE.Group>(null);

    const [currentCamera, setCurrentCamera] = useState<PerspectiveCamera>()

    const modelGroup = useLoader(OpenSimLoader, currentModelPath)
    const computeNormals = (group: Group)=>{
      group.traverse((o) => {
        if (o.type === "Mesh"){
          (o as Mesh).geometry.computeVertexNormals()
        }
      }
    )
    };
    //computeNormals(modelGroup as Group);
    const animations = modelGroup!.animations;

    // Create layers so that draggable objects are on a few layers so intersections
    // can be filtered easily.
    const LayerMap = new Map([
      ["Mesh", 1],  // selectable
      ["Force", 2],
      ["World", 3],
      ["Marker", 4], // selectable, draggable
      ["ExpMarker", 5],
      ["expForce", 6],
      ["WrapSphere", 7],
      ["WrapCylinder", 7],
      ["WrapEllipsoid", 7],
      ["WrapTorus", 7],
      ["wrapObject", 7],
      ["ContactSphere", 8],
      ["ContactMesh", 8],
      ["ContactHalfSpace", 8],
      ["Model", 9], // draggable
      ["Ground", 10],
      ["PathPoint", 11] // selectable, draggable
    ]);
    
    const processModelObjects = (obj: Object3D)=>{
      obj.traverse((obj3d) => {
      /*
      let layerNum = 0
      if (obj3d.userData !== null && obj3d.userData !== undefined &&
          obj3d.userData.opensimType !== undefined) {
        const possibleLayer = LayerMap.get(obj3d.userData.opensimType)

        if (possibleLayer !== undefined)
          layerNum = possibleLayer
      }
      obj3d.layers.set(layerNum)
      */
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

    let curState = useModelContext();
    if (curState.scene === null)
      curState.scene = sceneRef.current;

    // This useEffect loads the cameras and assign them to its respective states.
    useEffect(() => {
      if (modelsRef.current!==null) {
        const boundingBox = new THREE.Box3();
        // // Compute the bounding box of the scene if models are already loaded
        boundingBox.setFromObject(modelsRef.current!);
        const modelbbox = new THREE.Box3().setFromObject(modelGroup!)

        modelsRef.current.add(modelGroup as Group);
        curState.addModelToMap(modelGroup!.uuid, modelGroup!);
        processModelObjects(modelGroup!)

        if (curState.getNumberOfOpenModels()>1 && Number.isFinite(boundingBox.max.z) ) {
          modelGroup!.position.z = boundingBox.max.z-modelbbox.min.z
          const scenebbox = new THREE.Box3().setFromObject(modelsRef.current!)
          curState.fitCameraTo(scenebbox);
        }
        else {
          curState.fitCameraTo(modelbbox);
        }
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
        });
        // Update cameras list.
        curState.setCamerasList(cameras.map(obj => obj as PerspectiveCamera))
        // Set current camera and current index as 0
        setCurrentCamera(cameras.length > 0 ? cameras[0] as PerspectiveCamera : new PerspectiveCamera())
        curState.setCurrentCameraIndex(0)
      }
      lightRef.current!.color = viewerState.lightColor
      spotlightRef.current!.color = viewerState.lightColor
    }, [curState, scene, gl.domElement.clientWidth, gl.domElement, set, modelGroup]);

    

    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        curState.handleKey(event.key);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [curState]);
  
  
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


    if (supportControls) {
      scene.traverse((o) => {
          sceneObjectMap.set(o.uuid, o);
          if (o.name.startsWith("ColorNode")) {
            colorNodeMap.set(o.uuid, o);
          }
          }
      )
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
    //console.log(camera.position)
    //console.log(camera.rotation)
      if (!useEffectRunning) {
          if (curState !== undefined) {
            if (supportControls ) {
              if (curState.selected === "") {
                bboxRef.current!.visible = false
              }
              else {
                let selectedObject = sceneObjectMap.get(curState.selected)!
                if (selectedObject !== undefined && selectedObject.type !== 'BoxHelper') {
                    if (bboxRef.current !== null) {
                      bboxRef.current.setFromObject(selectedObject);
                      bboxRef.current!.visible = true
                  }
                }
              }
            }
            csRef.current!.visible =  curState.showGlobalFrame
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
    })

    useEffect(() => {
        //console.log("OpenSimScene.useEffect called ", curState.currentModelPath)
        setUseEffectRunning(false)
        if (supportControls) {
            curState.setCurrentModelPath(currentModelPath)
            /// curState.setSceneTree(new SceneTreeModel(scene))
            curState.setAnimationList(animations)
        }
        return () => {
          curState.setSelected("", false)
          sceneObjectMap.clear();
          setUseEffectRunning(true)
        };
      }, [scene, animations, supportControls, currentModelPath, curState, sceneObjectMap])

    
  function handleClick(event: ThreeEvent<MouseEvent>): void {
    //event.stopPropagation();
    if (event.object !== undefined) {
      const selected_uuid = event.object.uuid;
      if (selected_uuid !== undefined){
        curState.setSelected(selected_uuid, true);
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
      <group name='OpenSimEnvironment' ref={envRef}>
        <directionalLight ref={lightRef} position={[0.5, 1.5, -0.5]} 
            intensity={viewerState.lightIntensity} color={viewerState.lightColor}
          castShadow={true}
          shadow-camera-far={8}
          shadow-camera-left={-2}
          shadow-camera-right={2}
          shadow-camera-top={2}
          shadow-camera-bottom={-2}/>
        <spotLight name='SpotLight' visible={viewerState.spotLight} 
              ref={spotlightRef} position={[0.5, 1.5, -.05]} 
              color={viewerState.lightColor} penumbra={0.2} />
        <OpenSimFloor />
      </group>
      <group name='OpenSimModels' ref={modelsRef}  
            onClick={(e)=>{ handleClick(e);}}
            onPointerMissed={(e)=>{clearSelection();}} />
      <group name='WCS' ref={csRef}>
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
      <boxHelper name='SelectionBox' ref={bboxRef} visible={false}/>
      </>
}

export default observer(OpenSimGUIScene)
