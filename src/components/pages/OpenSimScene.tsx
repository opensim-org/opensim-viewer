import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

import { useEffect } from 'react'
import { AnimationMixer, BoxHelper, Object3D } from 'three'

import SceneTreeModel from '../../helpers/SceneTreeModel'
import { useModelContext } from '../../state/ModelUIStateContext'

interface OpenSimSceneProps {
    currentModelPath: string,
    supportControls:boolean
}

const OpenSimScene: React.FC<OpenSimSceneProps> = ({ currentModelPath, supportControls }) => {

    // useGLTF suspends the component, it literally stops processing
    const { scene, animations } = useGLTF(currentModelPath);
    // eslint-disable-next-line no-mixed-operators
    let uuid2ObjectMap = new Map<string, Object3D>();
    let uuid2SelectionMap = new Map<string, BoxHelper>();
    let curState = useModelContext();
    curState.scene = scene;
    if (supportControls) {
      scene.traverse((o) => {
          uuid2ObjectMap.set(o.uuid, o)
          if (o.type === "Mesh") {
            let helper : BoxHelper = new BoxHelper(o)
            console.log("add helper for ", o.name);
            uuid2SelectionMap.set(o.uuid, helper);
            helper.visible = false;
            scene.add(helper);
          }
         })
    }
    
    let mixer: AnimationMixer
    if (animations.length > 0) {
        mixer = new AnimationMixer(scene);
        animations.forEach(clip => {
            const action = mixer.clipAction(clip)
            action.play()
        });
    }
    useFrame((state, delta) => {
      if (curState !== undefined) {
        if (supportControls ) {
          if (curState.deSelected!==""){
            let deselectedBox = uuid2SelectionMap.get(curState.deSelected)
            if (deselectedBox !== undefined) {
              deselectedBox.visible = false;
            }
          }
          let selectedObject = uuid2ObjectMap.get(curState.selected)!
          if (selectedObject !== undefined && selectedObject.type === "Mesh") {
            uuid2SelectionMap.get(curState.selected)!.visible = true
          }
        }
        if (supportControls && curState.animating){
            mixer?.update(delta * curState.animationSpeed)
        }
      }
    })

    useEffect(() => {
        if (supportControls) {
            curState.setCurrentModelPath(currentModelPath)
            curState.setSceneTree(new SceneTreeModel(scene))
            curState.setAnimationList(animations)
        }
      }, [scene, animations, supportControls, currentModelPath, curState])

    // By the time we're here the model is guaranteed to be available
    return <primitive object={scene} 
      onPointerDown={(e: any) => curState.setSelected(e.object.uuid)}
      onPointerMissed={() => curState.setSelected("")}/>
}

export default OpenSimScene
