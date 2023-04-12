import { useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Vector3 } from 'three';
import { useMemo } from 'react';

/**
 * 
 * OpenSimModel is placed inside the Canvas and so has access to renderer camera and gl-context
 * hence, we add the methods to handle buttons here even though it feels illogical
 */
export function OpenSimModel() {

  const {
    gl, // WebGL renderer
    camera
  } = useThree();

  void function zoomin () {
    let v = new Vector3();
      camera.position.lerp(v.set(1, 0, 0), 0.025);
  }

  void function zoomOut () {
    let v = new Vector3();
    camera.position.lerp(v.set(1, 0, 0), -0.025); 
  }

  void function snapshot () {
    const link = document.createElement('a');
    link.setAttribute('download', 'viewer_snapshot.png');
    link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
    link.click();
  }

  // useGLTF suspends the component, it literally stops processing
  const { scene } = useGLTF('/builtin/leg39_nomusc.gltf');
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
