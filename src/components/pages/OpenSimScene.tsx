import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

import { useEffect, useState } from 'react'
import { AnimationMixer, BoxHelper, Group, Object3D } from 'three'

import SceneTreeModel from '../../helpers/SceneTreeModel'
import { useModelContext } from '../../state/ModelUIStateContext'

interface OpenSimSceneProps {
    currentModelPath: string,
    supportControls:boolean
}

const OpenSimScene: React.FC<OpenSimSceneProps> = ({ currentModelPath, supportControls }) => {

    // useGLTF suspends the component, it literally stops processing
    const { scene, animations } = useGLTF(currentModelPath);
    const no_face_cull = (scene: Group)=>{
      if (scene) {
        scene.traverse((o)=>{
          if (o.name.endsWith("geometrypath")){
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
        //console.log(obj3d.name, layerNum)
    }
  }
    no_face_cull(scene);
    // eslint-disable-next-line no-mixed-operators
    const [sceneObjectMap] = useState<Map<string, Object3D>>(new Map<string, Object3D>());
    const [objectSelectionBox, setObjectSelectionBox] = useState<BoxHelper | null>(new BoxHelper(scene));
    const [useEffectRunning, setUseEffectRunning] = useState<boolean>(false)
    const [animationIndex, setAnimationIndex] = useState<number>(-1)
    const [startTime, setStartTime] = useState<number>(0)
    const [mixers, ] = useState<AnimationMixer[]>([])
    let curState = useModelContext();
    curState.scene = scene;

    if (supportControls) {
      scene.traverse((o) => {
          sceneObjectMap.set(o.uuid, o)
          }
      )
      if (objectSelectionBox !== null) {
        objectSelectionBox.visible = false;
        scene.add(objectSelectionBox!);
      }
    }
    // This is a hack we need to make sure mixers match animations not just count
    if (animations.length > 0 && mixers.length !==animations.length ) {
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
                console.log(duration)
                curState.setCurrentFrame(Math.trunc((currentTime / duration) * 100))
                setStartTime(Math.trunc((currentTime / duration) * 100))
              }
            } else if (supportControls) {
              if (curState.currentAnimationIndex!==-1) {
                if(curState.currentFrame !== startTime) {
                  let duration = mixers[curState.currentAnimationIndex]?.clipAction(animations[curState.currentAnimationIndex]).getClip().duration;
                  const framePercentage = curState.currentFrame / 100;
                  const currentTime = duration * framePercentage;
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
    <primitive object={scene} 
      onPointerDown={(e: any) => curState.setSelected(e.object.uuid)}
      onPointerMissed={() => curState.setSelected("")}/>
      <directionalLight position={[0.5, 1.5, -0.5]} intensity={.25} color={0xf0f0f0}
        castShadow={true} 
        shadow-camera-far={8}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}/>
      </>
}

export default OpenSimScene
