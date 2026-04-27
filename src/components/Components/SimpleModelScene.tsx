import { Html } from '@react-three/drei'
import { useThree, useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { useEffect, useRef, useState } from 'react'
import { CircularProgress } from '@mui/material'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

interface SimpleModelSceneProps {
  modelPath: string
}

// Create a custom loader instance with caching disabled for this use case
const loader = new GLTFLoader()
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/')
loader.setDRACOLoader(dracoLoader)

const SimpleModelScene: React.FC<SimpleModelSceneProps> = ({ modelPath }) => {
  const [scene, setScene] = useState<THREE.Group | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { camera, size } = useThree()

  const centerRef = useRef(new THREE.Vector3())
  const radiusRef = useRef(0)
  const angleRef = useRef(0)

  useEffect(() => {
    setIsLoading(true)
    setScene(null)

    loader.load(
      modelPath,
      (gltf) => {
        setScene(gltf.scene)
        setIsLoading(false)
      },
      (progress) => {
        // Optional: handle progress
      },
      (error) => {
        console.error('Error loading model:', error)
        setIsLoading(false)
      }
    )

    return () => {
      // Cleanup if needed
    }
  }, [modelPath])

  useEffect(() => {
    if (!scene) return

    // Compute bounding box
    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    centerRef.current.copy(center)

    // Camera setup
    const cam = camera as THREE.PerspectiveCamera
    const fov = THREE.MathUtils.degToRad(cam.fov)
    const aspect = size.width / size.height

    // Get box corners
    const corners = [
      new THREE.Vector3(box.min.x, box.min.y, box.min.z),
      new THREE.Vector3(box.min.x, box.min.y, box.max.z),
      new THREE.Vector3(box.min.x, box.max.y, box.min.z),
      new THREE.Vector3(box.min.x, box.max.y, box.max.z),
      new THREE.Vector3(box.max.x, box.min.y, box.min.z),
      new THREE.Vector3(box.max.x, box.min.y, box.max.z),
      new THREE.Vector3(box.max.x, box.max.y, box.min.z),
      new THREE.Vector3(box.max.x, box.max.y, box.max.z),
    ]

    // Desired view direction
    const viewDir = new THREE.Vector3(1, 0.8, 1).normalize()

    // Temporary camera orientation
    cam.position.copy(center)
    cam.lookAt(center.clone().add(viewDir))
    cam.updateMatrixWorld(true)

    const invCamMat = cam.matrixWorld.clone().invert()

    let maxX = 0
    let maxY = 0
    let maxZ = 0

    corners.forEach((corner) => {
      const v = corner.clone().applyMatrix4(invCamMat)
      maxX = Math.max(maxX, Math.abs(v.x))
      maxY = Math.max(maxY, Math.abs(v.y))
      maxZ = Math.max(maxZ, Math.abs(v.z))
    })

    // Compute distance
    const fitHeight = maxY / Math.tan(fov / 2)
    const fitWidth = maxX / (Math.tan(fov / 2) * aspect)

    let distance = Math.max(fitHeight, fitWidth) + maxZ
    distance *= 0.9 // Padding

    radiusRef.current = distance

    cam.near = distance / 100
    cam.far = distance * 100
    cam.updateProjectionMatrix()
  }, [scene, camera, size])

  // Auto-rotate camera
  useFrame((_, delta) => {
    if (isLoading || !scene) return

    const center = centerRef.current
    const radius = radiusRef.current
    if (!radius) return

    angleRef.current += delta * 0.3 // Rotation speed

    const x = Math.cos(angleRef.current) * radius
    const z = Math.sin(angleRef.current) * radius
    const y = radius * 0.6 // Fixed elevation

    camera.position.set(
      center.x + x,
      center.y + y,
      center.z + z
    )

    camera.lookAt(center)
  })

  // Show loading indicator while model is loading
  if (!scene || isLoading) {
    return (
      <Html center>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}>
          <CircularProgress
            size={30}
            thickness={4}
            sx={{ color: 'white' }}
          />
          <div style={{
            color: 'white',
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
          }}>
            Loading...
          </div>
        </div>
      </Html>
    )
  }

  return <primitive object={scene} />
}

export default SimpleModelScene
