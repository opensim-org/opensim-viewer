import { useThree, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Vector3 } from 'three';
import { useMemo } from 'react';

interface OpenSimModelProps {
  curentModelPath: string;
}

const OpenSimModel: React.FC<OpenSimModelProps> = ({ curentModelPath }) => {

  const {
    gl, // WebGL renderer
    camera
  } = useThree();

  void function zoomin () {
    let v = new Vector3();
      camera.position.lerp(v.set(1, 0, 0), 0.05);
  }

  void function zoomOut () {
    let v = new Vector3();
    camera.position.lerp(v.set(1, 0, 0), -0.05); 
  }

  void function snapshot () {
      const link = document.createElement('a');
      link.setAttribute('download', 'viewer_snapshot.png');
      link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
      link.click();
  }

  useFrame(()=>{
    if (viewerState.zooming){
      if (viewerState.zoomFactor > 1.0){
      let v = new Vector3();
        camera.position.lerp(v.set(1, 0, 0), 0.02);
        camera.updateProjectionMatrix();
      }
      else if (viewerState.zoomFactor < -1.0){
      let v = new Vector3();
        camera.position.lerp(v.set(1, 0, 0), -0.02);
        camera.updateProjectionMatrix();
    }
      viewerState.zooming = false;
    }
  });
  // useGLTF suspends the component, it literally stops processing
  const { scene } = useGLTF(curentModelPath);
  useMemo(() => scene.traverse(obj => {
    // traverse and mutate the scene here ...
    if (obj.type === 'Mesh'){
      obj.receiveShadow = true;
      obj.castShadow = true;
    }
    console.log(obj);
  }), [scene])
  // By the time we're here the model is guaranteed to be available
  return <primitive object={scene} />;
}

export default OpenSimModel;