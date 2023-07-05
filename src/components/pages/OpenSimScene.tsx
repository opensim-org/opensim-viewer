import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { AnimationMixer } from 'three'
import viewerState from '../../state/ViewerState'
import axios from 'axios'

interface OpenSimSceneProps {
    curentModelPath: string
}

const OpenSimScene: React.FC<OpenSimSceneProps> = ({ curentModelPath }) => {
    // useGLTF suspends the component, it literally stops processing
    const { scene, animations } = useGLTF(curentModelPath)
    let mixer: AnimationMixer
    if (animations.length) {
        mixer = new AnimationMixer(scene);
        animations.forEach(clip => {
            const action = mixer.clipAction(clip)
            action.play();
        });
    }
    useFrame((state, delta) => {
        mixer?.update(delta)
    })
    
    useMemo(
        () =>
            scene.traverse((obj) => {
                // traverse and mutate the scene here ...
                if (obj.type === 'Mesh') {
                    obj.receiveShadow = true
                    obj.castShadow = true
                }
                //console.log(obj)
            }),
        [scene]
    )
    // Lifecycle methods
    useEffect(() => {

        const getModelGltf = async () => {
            const result = await axios(
          'http://localhost:8000/models/viz/default/',
        );
        //await console.log(result.data)
        await viewerState.setCurrentModelPath(result.data.model_gltf_file);
        }
        getModelGltf()
        // viewerState.setCurrentModelPath(result.data.model_gltf_file);
      });
    // By the time we're here the model is guaranteed to be available
    return <primitive object={scene} />
}

export default OpenSimScene
