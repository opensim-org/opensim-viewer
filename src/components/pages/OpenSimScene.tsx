import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

import { useEffect, useState } from 'react'
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
    const [sceneObjectMap] = useState<Map<string, Object3D>>(new Map<string, Object3D>());
    const [sceneObjectSelectionMap] = useState<Map<string, BoxHelper>>(new Map<string, BoxHelper>());

    let curState = useModelContext();
    curState.scene = scene;
    if (supportControls) {
      scene.traverse((o) => {
          sceneObjectMap.set(o.uuid, o)
          if (o.type === "Mesh") {
            let helper : BoxHelper = new BoxHelper(o)
            //console.log("add helper for ", o.name);
            sceneObjectSelectionMap.set(o.uuid, helper);
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
            let deselectedBox = sceneObjectSelectionMap.get(curState.deSelected)
            if (deselectedBox !== undefined) {
              deselectedBox.visible = false;
            }
          }
          let selectedObject = sceneObjectMap.get(curState.selected)!
          if (selectedObject !== undefined && selectedObject.type === "Mesh") {
            sceneObjectSelectionMap.get(curState.selected)!.visible = true
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
        return () => {
          sceneObjectSelectionMap.forEach((value)=>{
            return value.removeFromParent();
          });
          sceneObjectSelectionMap.clear();
          sceneObjectMap.clear();
        };
      }, [scene, animations, supportControls, currentModelPath, curState, sceneObjectMap, sceneObjectSelectionMap])

    
    // By the time we're here the model is guaranteed to be available
    return <primitive object={scene} 
      onPointerDown={(e: any) => curState.setSelected(e.object.uuid)}
      onPointerMissed={() => curState.setSelected("")}/>
}

export default OpenSimScene
