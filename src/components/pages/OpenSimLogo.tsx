import { useLoader, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Sprite, SpriteMaterial, TextureLoader, Vector2, Vector3 } from "three";

import { useFrame, extend} from '@react-three/fiber';

extend({ Sprite, SpriteMaterial });

const OpenSimLogo: React.FC = () => {
  const spriteRef = useRef<Sprite>(null!);
  const { size, viewport, camera } = useThree();

  useEffect(() => {
    const texture = new TextureLoader().load('./opensimLogo23.png');
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
