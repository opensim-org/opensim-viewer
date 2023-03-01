import React, { useRef } from "react";
import { GLTFModel, AmbientLight, DirectionLight } from "react-3d-viewer";

const ModelViewPage = () => {
    const modelRef = React.useRef();
    const modelPath =
    "builtin/arm26.gltf";
  return (
      <GLTFModel src={modelPath} >
        <AmbientLight color={0x333333} />
        <DirectionLight
          color={0xffffff}
          position={{ x: 100, y: 200, z: 100 }}
        />
      </GLTFModel>
  );
}

export default ModelViewPage;