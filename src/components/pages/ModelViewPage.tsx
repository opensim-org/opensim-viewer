import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { Canvas, useLoader } from '@react-three/fiber';
import { Bounds, Environment, GizmoHelper, GizmoViewport } from '@react-three/drei';
import viewerState from '../../state/ViewerState';
import OpenSimControl from '../pages/OpenSimControl';
import { Suspense, startTransition  } from 'react';
import BottomBar from '../pages/BottomBar';

import DrawerMenu from '../Components/DrawerMenu';
import OpenSimScene from '../pages/OpenSimScene';
import { ModelUIState } from '../../state/ModelUIState';
import { observer } from 'mobx-react';
import { MyModelContext } from '../../state/ModelUIStateContext';
import { useModelContext } from '../../state/ModelUIStateContext';
import { RepeatWrapping, TextureLoader } from 'three';


const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(0),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

export function PersistentDrawerLeft() {
  const theme = useTheme();
  const curState = useModelContext();
  curState.setCurrentModelPath(viewerState.currentModelPath);
  const [uiState] = React.useState<ModelUIState>(curState);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [selectedTabName, setSelectedTabName] = React.useState<string>("File");


  function toggleOpenMenu(name:string='') {
    // If same name, or empty just toggle.
    if (name === selectedTabName || name === '')
        setMenuOpen(!menuOpen)
    // If different name and not empty, if closed, open.
    else if (name !== '' && !menuOpen)
        setMenuOpen(!menuOpen)
    // Always store same name.
    setSelectedTabName(name)
  }

  // TODO: Move to a general styles file?
  const leftMenuWidth = 60;
  const drawerContentWidth = 250;
  const floorTexture = useLoader(TextureLoader, '/tile.jpg');
  floorTexture.wrapS = floorTexture.wrapT = RepeatWrapping;
  floorTexture.offset.set(0, 0);
  floorTexture.repeat.set(8, 8);

  return (
    <MyModelContext.Provider value = {uiState}>
    <Box component="div" sx={{ display: 'flex' }}>
      <CssBaseline />

      <Main>

      <DrawerMenu menuOpen={menuOpen} selectedTabName={selectedTabName} toggleOpenMenu={toggleOpenMenu} uiState={uiState} leftMenuWidth={leftMenuWidth} drawerContentWidth={drawerContentWidth}/>

        <div id="canvas-container">
            <Suspense fallback={null}>
                <Canvas
                    gl={{ preserveDrawingBuffer: true }}
                    shadows="soft"
                    style={{ width: 'calc(100vw - ' + (leftMenuWidth + (menuOpen ? drawerContentWidth : 0)) + 'px)', height: 'calc(100vh - 68px - 7vh)', left: leftMenuWidth + (menuOpen ? drawerContentWidth : 0), transition: 'left 0.1s ease'}}
                    camera={{ position: [1500, 2000, 1000], fov: 75, far: 10000 }}
                >
                  <fog attach="fog" color="lightgray" near={1}  far={10} />
                    <color attach="background" args={theme.palette.mode === 'dark' ? ['#151518'] : ['#cccccc']} />
                    <Bounds fit clip observe>
                        <OpenSimScene currentModelPath={viewerState.currentModelPath} supportControls={true}/>
                    </Bounds>
                    <Environment  files="/builtin/potsdamer_platz_1k.hdr" />
                     <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
                        <GizmoViewport labelColor="white" axisHeadScale={1} />
                    </GizmoHelper>
                    <OpenSimControl />
                    <axesHelper visible={uiState.showGlobalFrame} args={[20]} />
                    <mesh name='Floor' rotation-x={-Math.PI / 2} position-y={-.01} receiveShadow >
                      <planeGeometry attach="geometry" args={[20, 20]} />
                      <meshPhongMaterial attach="material" color="white" map={floorTexture}/>
                    </mesh>

            </Canvas>
            </Suspense>
            </div>
            <BottomBar />
      </Main>
    </Box>
    </MyModelContext.Provider>
  );
}

export default observer(PersistentDrawerLeft)