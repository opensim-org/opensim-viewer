import { useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Vector3 } from 'three';

interface OpenSimModelProps {
  modelPath: string;
}

const OpenSimModel: React.FC<OpenSimModelProps> = ({ modelPath }) => {

  const {
    gl, // WebGL renderer
    camera
  } = useThree();


  window.addEventListener("keyup", (event) => {
    if (event.code === 'KeyP') { // P for print screen
      const link = document.createElement('a');
      link.setAttribute('download', 'viewer_snapshot.png');
      link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
      link.click();
      event.preventDefault();
    };
    if (event.code === 'KeyI') { // I for camera zoom in
      let v = new Vector3();
      camera.position.lerp(v.set(1, 0, 0), 0.025);
    };
    if (event.code === 'KeyO') { // O for camera zoom out
      let v = new Vector3();
      camera.position.lerp(v.set(1, 0, 0), -0.025);
    }
  });

  // useGLTF suspends the component, it literally stops processing
  const { scene } = useGLTF(modelPath);
  // By the time we're here the model is guaranteed to be available
  return <primitive object={scene} />;
}

export default OpenSimModel;