import { useThree, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Vector3 } from 'three';
import { useMemo } from 'react';

import viewerState from '../../state/ViewerState';
/**
 * 
 * OpenSimModel is placed inside the Canvas and so has access to renderer camera and gl-context
 * hence, we add the methods to handle buttons here even though it feels illogical
 */
function OpenSimModel() {

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
