import { OrbitControls } from "@react-three/drei";
import { observer } from "mobx-react";
import viewerState from "../../state/ViewerState";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";

function OpenSimControl() {
  const {
     camera,
  } = useThree();

  let v = new Vector3();
  useFrame(() => {
    if (viewerState.zooming) {
      if (viewerState.zoomFactor > 1.0) {
        camera.position.lerp(v.set(1, 0, 0), 0.02);
        camera.updateProjectionMatrix();

      } else if (viewerState.zoomFactor < -1.0) {
        camera.position.lerp(v.set(1, 0, 0), -0.02);
        camera.updateProjectionMatrix();
      }
      viewerState.zooming = false;
    }
  });
  //console.log(viewerState.rotating);
  return (
    <OrbitControls
      autoRotate
      autoRotateSpeed={viewerState.rotating ? 2 : 0.0}
      makeDefault
    />
  );
}

export default observer(OpenSimControl);
