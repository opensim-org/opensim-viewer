import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  GizmoHelper,
  GizmoViewport,
} from "@react-three/drei";
import OpenSimControl from "../Components/OpenSimControl";
import { Suspense } from "react";
import BottomBar from "../pages/BottomBar";
import FloatingControlsPanel from '../Components/FloatingControlsPanel';

import CameraPreview from "../Components/CameraPreview"
import AddCameraDialog from "../Components/Dialogs/AddCameraDialog"
import AddLightDialog from "../Components/Dialogs/AddLightDialog"
import SceneTreeBridge from "../Components/SceneTree/SceneTreeBridge"
import SceneTreeSortable, { SceneTreeSortableHandle } from "../Components/SceneTree/SceneTreeSortable"
import DrawerMenu from "../Components/DrawerMenu";
import OpenSimScene from "../Components/OpenSimScene";
import { ModelUIState } from "../../state/ModelUIState";
import { observer } from "mobx-react";
import { MyModelContext } from "../../state/ModelUIStateContext";
import { useModelContext } from "../../state/ModelUIStateContext";
import { useParams } from 'react-router-dom';

import { DirectionalLightHelper,
  SpotLightHelper,
  PointLightHelper,
  DirectionalLight,
  SpotLight,
  PointLight,
  CameraHelper,
  Camera,
  PerspectiveCamera,
  OrthographicCamera} from 'three';

import VideoRecorder from "../Components/VideoRecorder"
import { ModelInfo } from '../../state/ModelUIState';

// import GUI from 'lil-gui';
import { Color} from 'three';
import { TransformControls } from "@react-three/drei";

import TranslateIcon from '@mui/icons-material/OpenWith';
import RotateIcon from '@mui/icons-material/RotateRight';

import {
  Button
} from "@mui/material";


const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(0),
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

export const addNewCamera = (
  name: string = 'NewCamera',
  type: 'PerspectiveCamera' | 'OrthographicCamera' = 'PerspectiveCamera',
  uiState: ModelUIState,
  camerasGroup: THREE.Group,
  onSceneUpdated: () => void
): THREE.Camera => {
  let camera: Camera;

  if (type === 'PerspectiveCamera') {
    const aspect = 800 / 600; // You may want to make this dynamic
    camera = new PerspectiveCamera(50, aspect, 0.1, 100);

    camera.name = name;
    camera.position.set(0, 1, 2);
    (camera as PerspectiveCamera).updateProjectionMatrix();
  } else {
    // Orthographic frustum (left, right, top, bottom, near, far)
    const frustumSize = 2;
    const aspect = 800 / 600; // Or get this from your renderer/canvas
    const width = frustumSize * aspect;
    const height = frustumSize;

    camera = new OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.1,
      50
    );

    camera.name = name;
    camera.position.set(0, 1, 2);
    (camera as OrthographicCamera).updateProjectionMatrix();
  }


  const helper = new CameraHelper(camera);
  helper.name = `${name}_Helper`;

  camerasGroup.add(camera);
  camerasGroup.add(helper);

  uiState.setCamerasList([...uiState.cameras, camera]);
  uiState.setSelected(camera.uuid);

  onSceneUpdated();

  camera.layers.enableAll()
  return camera;
};

export const addNewLight = (
  name: string = 'NewLight',
  type: 'DirectionalLight' | 'PointLight' | 'SpotLight' = 'SpotLight',
  uiState: ModelUIState,
  lightsGroup: THREE.Group,
  onSceneUpdated: () => void
): THREE.Light => {
  let light: THREE.Light;
  let helper: THREE.Object3D | undefined;

  switch (type) {
    case 'DirectionalLight': {
      const dir = new DirectionalLight(0xffffff, 1);
      dir.target.position.set(0, 0, -1);
      light = dir;
      helper = new DirectionalLightHelper(dir);
      lightsGroup.add(dir.target);
      break;
    }
    case 'PointLight': {
      const point = new PointLight(0xffffff, 1, 0, 2);
      light = point;
      helper = new PointLightHelper(point);
      break;
    }
    case 'SpotLight':
    default: {
      const spot = new SpotLight(0xffffff, 1, 0, Math.PI / 6, 0.2, 1);
      light = spot;
      helper = new SpotLightHelper(spot);
      lightsGroup.add(spot.target);
      break;
    }
  }

  light.name = name;
  light.position.set(2, 2, 2);

  lightsGroup.add(light);
  if (helper) {
    helper.name = `${name}_Helper`;
    lightsGroup.add(helper);
  }

  uiState.setLightsList?.([...uiState.lights, light]);
  uiState.setSelected(light.uuid);

  onSceneUpdated();

  return light;
};

interface ViewerProps {
  url?: string;
  embedded?: boolean;
  noFloor?:boolean;
}

export function ModelViewPage({url, embedded, noFloor}:ViewerProps) {
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const videoRecorderRef = useRef(null);
  const coloRef = useRef<Color>(null)
  // TODO: Move to a general styles file?
  const leftMenuWidth = 60;
  const drawerContentWidth = 250;

  const [addCameraDialogOpen, setAddCameraDialogOpen] = useState(false);

  const [addLightDialogOpen, setAddLightDialogOpen] = useState(false);

  const [sceneVersion, setSceneVersion] = useState(0);

  const treeRef = useRef<SceneTreeSortableHandle>(null);
  const [treeWidth, setTreeWidth] = useState(0);

  useLayoutEffect(() => {
    const el = treeRef.current?.getWidth ? treeRef.current : null;
    if (!el) return;

    const ro = new ResizeObserver(() =>
      setTreeWidth(treeRef.current?.getWidth() ?? 0)
    );
    ro.observe(el as unknown as Element);   // observe the wrapper div
    return () => ro.disconnect();
  }, []);

  const [heightBottomBar, setHeightBottomBar] = useState(0);

  const curState = useModelContext();
  let { urlParam } = useParams();

  const [uiState] = React.useState<ModelUIState>(curState);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [selectedTabName, setSelectedTabName] = React.useState<string>("File");

  const [displaySideBar, setDisplaySideBar ] = useState('inherit');
  const [canvasWidth, setCanvasWidth] = useState("calc(100vw - " + (leftMenuWidth + (menuOpen ? drawerContentWidth : 0)) + "px)");
  const [canvasHeight, setCanvasHeight] = useState("calc(100vh - 68px - " + heightBottomBar + "px)");
  const [canvasLeft, setCanvasLeft] = useState(leftMenuWidth + (menuOpen ? drawerContentWidth : 0));
  const [floatingButtonsContainerTop, setFloatingButtonsContainerTop] = useState("80px");
  const [bgndColor, setBgndColor] = useState<Color>(new Color(0.7, 0.7, 0.7));

  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.Camera | null>(null);
  const [transformTarget, setTransformTarget] = useState<THREE.Object3D | null>(null);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');

  useEffect(() => {
    if (bottomBarRef.current) {
      const heightBottomBar = bottomBarRef.current.offsetHeight;
      setHeightBottomBar(bottomBarRef.current.offsetHeight);

      setCanvasHeight("calc(100vh - 68px - " + heightBottomBar + "px)");
    }
  }, []);

  React.useEffect(() => {
    // Change interface if we are in GUI mode.
    if (uiState.viewerState.isGuiMode) {
      setDisplaySideBar('none');
      setCanvasWidth('100%');
      setCanvasHeight('calc(100vh - 68px)');
      setCanvasLeft(0);
      setFloatingButtonsContainerTop("12px")
    }
    setBgndColor(uiState.viewerState.backgroundColor);
  }, [uiState.viewerState.backgroundColor, uiState.viewerState.isGuiMode]);

  React.useEffect(() => {
    // Load user preferences
    const viewerState = uiState.viewerState;
    viewerState.setUserPreferencesJsonPath('/user-preferences.json')
    viewerState.loadUserPreferences()

//    const gui = new GUI()
//    gui.domElement.style.marginTop = '66px';
//    gui.domElement.style.marginRight = '-15px';
//    const sceneFolder = gui.addFolder("Scene");
//    sceneFolder.addColor(viewerState, 'backgroundColor').onChange(
//      function(v: any){viewerState.setBackgroundColor(v); coloRef.current?.copy(v);}
//    );
//    const floorFolder = gui.addFolder("Floor");
//    floorFolder.add(viewerState, 'floorHeight', -2, 2, .01).name("Height")
//    floorFolder.add(viewerState, 'floorVisible')
//    floorFolder.add(viewerState, 'floorTextureFile', { 'tile':0, 'wood-floor':1, 'Cobblestone':2, 'textureStone':3, 'grassy':4}).name("Texture").onChange(
//      function(v: any){viewerState.setFloorTextureIndex(v)}
//    );
//    const lightFolder = gui.addFolder("Lights");
//    lightFolder.add(viewerState, 'lightIntensity', 0, 2, .05).name("Intensity")
//    lightFolder.addColor(viewerState, 'lightColor').name("Color")
//    lightFolder.add(viewerState, 'spotLight')
//    return () => {
//        gui.destroy()
//      }
  }, [uiState.viewerState]);

  if (urlParam!== undefined) {
    var decodedUrl = decodeURIComponent(urlParam);
    uiState.viewerState.setCurrentModelPath(decodedUrl);
    curState.setCurrentModelPath(uiState.viewerState.currentModelPath);
    // If urlParam is not undefined, this means it is getting the model from S3 and not from local.
    uiState.viewerState.setIsLocalUpload(false);
  }
  else
    curState.setCurrentModelPath(uiState.viewerState.currentModelPath);

  function toggleOpenMenu(name: string = "") {
    // If same name, or empty just toggle.
    if (name === selectedTabName || name === "") setMenuOpen(!menuOpen);
    // If different name and not empty, if closed, open.
    else if (name !== "" && !menuOpen) setMenuOpen(!menuOpen);
    // Always store same name.
    setSelectedTabName(name);
  }

  return (
    <MyModelContext.Provider value={uiState}>
      <Box component="div" sx={{ display: "flex" }}>
        <CssBaseline />
        <Main>
          <div id="opensim-modelview-sidebar" style={{display: displaySideBar}}>
            <DrawerMenu
              menuOpen={menuOpen}
              selectedTabName={selectedTabName}
              toggleOpenMenu={toggleOpenMenu}
              uiState={uiState}
              leftMenuWidth={leftMenuWidth}
              drawerContentWidth={drawerContentWidth}
            />
          </div>
          <div id="canvas-container">
            <Suspense fallback={null}>
              <FloatingControlsPanel
                videoRecorderRef={videoRecorderRef}
                info={new ModelInfo(uiState.modelInfo.model_name, uiState.modelInfo.desc, uiState.modelInfo.authors)}
                top={floatingButtonsContainerTop}/>
              <Canvas
                id="canvas-element"
                gl={{ preserveDrawingBuffer: true }}
                shadows="soft"
                style={{
                  width: canvasWidth,
                  height: canvasHeight,
                  left: canvasLeft,
                  transition: "left 0.1s ease",
                }}
                camera={{ position: [1500, 2000, 1000], fov: 75, far: 10000 }}
              >
              <SceneTreeBridge onSceneReady={setScene} onCameraReady={setCamera} />
              <fog attach="fog" color="lightgray" near={1} far={10000} />

                <color  ref={coloRef}
                  attach="background" args={[bgndColor.r, bgndColor.g, bgndColor.b]}
                  // args={
                  //   theme.palette.mode === "dark" ? ["#151518"] : ["#cccccc"]
                  // }
                />

                <OpenSimScene
                  currentModelPath={uiState.viewerState.currentModelPath}
                  supportControls={true}
                />
                <Environment files="/assets/potsdamer_platz_1k.hdr" />

                <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
                  <GizmoViewport labelColor="white" axisHeadScale={1} />
                </GizmoHelper>
                <OpenSimControl/>
                <axesHelper visible={uiState.showGlobalFrame} args={[20]} />
                <VideoRecorder videoRecorderRef={videoRecorderRef}/>
                {transformTarget && (
                  <>
                      <TransformControls object={transformTarget} mode={transformMode} />
                  </>
                )}

                {uiState.selected && (
                  <CameraPreview selectedCameraUuid={uiState.selected} marginRight={treeWidth} />
                )}

              </Canvas>

              <div
                style={{
                  position: 'absolute',
                  bottom: heightBottomBar + 20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 1001,
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '12px',
                }}
              >
                <Button
                  variant={transformMode === 'translate' ? 'contained' : 'outlined'}
                  onClick={() => setTransformMode('translate')}
                  size="small"
                >
                  <TranslateIcon />
                </Button>
                <Button
                  variant={transformMode === 'rotate' ? 'contained' : 'outlined'}
                  onClick={() => setTransformMode('rotate')}
                  size="small"
                >
                  <RotateIcon />
                </Button>
              </div>

              <AddCameraDialog
                open={addCameraDialogOpen}
                onClose={() => setAddCameraDialogOpen(false)}
                onAddCamera={(name:any, type:any) => {
                  const camerasGroup = scene?.getObjectByName("Cameras") as THREE.Group;
                  if (camerasGroup) {
                    const newCam = addNewCamera(name, type, uiState, camerasGroup, () => setSceneVersion(v => v + 1));
                    setTransformTarget(newCam);
                  }
                }}
                scene={scene}
                uiState={uiState}
              />

              <AddLightDialog
                open={addLightDialogOpen}
                onClose={() => setAddLightDialogOpen(false)}
                onAddLight={(name:any, type:any) => {
                  const lightsGroup = scene?.getObjectByName("Illumination") as THREE.Group;
                  if (lightsGroup) {
                    const newLight = addNewLight(name, type, uiState, lightsGroup, () => setSceneVersion(v => v + 1));
                    setTransformTarget(newLight);
                  }
                }}
                scene={scene}
                uiState={uiState}
              />

              <BottomBar
                ref={bottomBarRef}
                animationPlaySpeed={1.0}
                animating={uiState.animating}
                animationList={uiState.animations}/>

{scene && camera && (
  <div
    style={{
      position: "absolute",
      top: 66,
      right: 0,
      zIndex: 1000,
      height: canvasHeight,          // full canvas height
      width: treeWidth || 250,       // whatever width the tree reports (fallback 250 px)
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div style={{ flex: "1 1 50%", overflowY: "auto" }}>
      <SceneTreeSortable
        ref={treeRef}
        scene={scene}
        sceneVersion={sceneVersion}
        camera={camera}
        /* let it stretch to parent height */
        height="100%"
        onAddCameraClick={setAddCameraDialogOpen}
        onAddLightClick={setAddLightDialogOpen}
        setTransformTargetFunction={setTransformTarget}
        onWidthChange={setTreeWidth}
      />
    </div>
  </div>
)}

            </Suspense>
          </div>
        </Main>
      </Box>
    </MyModelContext.Provider>
  );
}

export default observer(ModelViewPage);
