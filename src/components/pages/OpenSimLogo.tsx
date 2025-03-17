import { useLoader, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Sprite, SpriteMaterial, TextureLoader, Vector2, Vector3 } from "three";

import { useFrame, extend} from '@react-three/fiber';

extend({ Sprite, SpriteMaterial });

const OpenSimLogo: React.FC = () => {
  const spriteRef = useRef<Sprite>(null!);
  const { size, viewport, camera } = useThree();

  useEffect(() => {
    const texture = new TextureLoader().load('/OpenSimWatermarkOpaqueGrayscale128x128.png');
    spriteRef.current.material = new SpriteMaterial({ map: texture });
    spriteRef.current.position.set(1.4, 1.75, 1.0)
  }, []);

  useFrame(() => {
    if (spriteRef.current) {
      // Convert screen coordinates to normalized device coordinates (NDC)
      const ndcX = -0.85 //* size.width;
      const ndcY = -0.85 //* size.height;
      // Convert NDC to world coordinates
      const vector = new Vector3(ndcX, ndcY, 0.05).unproject(camera);
      spriteRef.current.position.set(vector.x, vector.y, vector.z);
    }
  });

  return <sprite ref={spriteRef} scale={[0.05, 0.05, 0.05]}/>;
};

export default OpenSimLogo;

// const OpenSimLogo = ({ screenX, screenY }) => {

//     //const curState = useModelContext();
//     const logoTexture = useLoader(TextureLoader, '/OpenSimWatermarkOpaqueGrayscale128x128.png')
//     const material = new SpriteMaterial({ map: logoTexture });//spriteMaterial.scaleByViewport = false;
//     const spriteRef=useRef<Sprite>(null);
//     const { camera, size } = useThree();

//     // This used to be AdditiveBlending, but that caused the logo to
//     // very bright white on certain backgrounds.
//     // https://threejs.org/examples/webgl_materials_blending.html

//     const orthoScene = useRef<Scene>(null);
//     const matRef=useRef<SpriteMaterial>(null);
//     const orthoCameraRef=useRef<OrthographicCamera>(null);

//     useEffect(() => {
//         if (spriteRef.current) {
//             const vector = new Vector3(
//               (screenX / size.width) * 2 - 1,
//               -(screenY / size.height) * 2 + 1,
//               0.5
//             );
//             vector.unproject(camera);
//             spriteRef.current.position.set(vector.x, vector.y, vector.z);
//           }
//     })

//     return <sprite ref={spriteRef} position={[0, 0, 0]} 
//                     scale={[0.5, 0.5, 0.5]}
//                     material={material} />
// }
