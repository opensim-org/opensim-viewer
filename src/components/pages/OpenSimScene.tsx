import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'

interface OpenSimSceneProps {
    curentModelPath: string
}

const OpenSimScene: React.FC<OpenSimSceneProps> = ({ curentModelPath }) => {
    // useGLTF suspends the component, it literally stops processing
    const { scene } = useGLTF(curentModelPath)
    useMemo(
        () =>
            scene.traverse((obj) => {
                // traverse and mutate the scene here ...
                if (obj.type === 'Mesh') {
                    obj.receiveShadow = true
                    obj.castShadow = true
                }
                console.log(obj)
            }),
        [scene]
    )
    // By the time we're here the model is guaranteed to be available
    return <primitive object={scene} />
}

export default OpenSimScene
