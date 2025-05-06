import { invalidate, useFrame, useThree} from '@react-three/fiber'
import { Color, CubeTexture, CubeTextureLoader } from 'three';
import { useState } from 'react';
import { observer } from 'mobx-react';
import { useModelContext } from '../../state/ModelUIStateContext';
import viewerState from '../../state/ViewerState';

type skyboxProps = {
  textureName: string;
}
// Loads the OpenSimSkybox texture and applies it to the scene.
const OpenSimSkybox = (props: skyboxProps) => {
    const { scene } = useThree();
    const curState = useModelContext();
    const [currentTextureName, setTextureName] = useState<string>(props.textureName);
    const [currentTexture, setCurrentTexture] = useState<CubeTexture>()
    const loadTexture = (textureName: string) => {
      const relativePath = '/assets/images/skyboxes/'
      setCurrentTexture(new CubeTextureLoader().load([
        process.env.PUBLIC_URL + relativePath +textureName+'/px.jpg',
        process.env.PUBLIC_URL + relativePath +textureName+'/nx.jpg',
        process.env.PUBLIC_URL + relativePath +textureName+'/py.jpg',
        process.env.PUBLIC_URL + relativePath +textureName+'/ny.jpg',
        process.env.PUBLIC_URL + relativePath +textureName+'/pz.jpg',
        process.env.PUBLIC_URL + relativePath +textureName+'/nz.jpg'
      ], ((texture)=>{scene.background = texture})));
    }

    useFrame((state, delta) => {
      if (currentTextureName!==curState.useSkybox){
        if (curState.useSkybox !== 'NoBackground'){
          loadTexture(curState.useSkybox);
        }
        else {
          scene.background =  new Color( viewerState.backgroundColor );
        }
        setTextureName(curState.useSkybox);
      }
    });

    return null;
  }
  
export default observer(OpenSimSkybox)
