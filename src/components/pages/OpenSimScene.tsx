import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

import { useEffect, useRef, useState } from 'react'
import { AnimationMixer, BoxHelper, Group, Object3D, DirectionalLight } from 'three'

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

    let mixer: AnimationMixer
    if (animations.length > 0) {
        mixer = new AnimationMixer(scene);
        animations.forEach(clip => {
            const action = mixer.clipAction(clip)
            action.play()
        });
    }
    const light = useRef<DirectionalLight>(null!);
    //useHelper(light, DirectionalLightHelper, 0.2);
    
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
            if (supportControls && curState.animating){
                mixer?.update(delta * curState.animationSpeed)
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
      <directionalLight ref={light} position={[0.5, 1.5, -0.5]} intensity={.25} color={0xf0f0f0}
        castShadow={true} 
        shadow-camera-far={8}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}/>
      </>
}

export default OpenSimScene
