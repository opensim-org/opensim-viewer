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
import OpenSimControl, { OpenSimControlHandle } from '../Components/OpenSimControl';
import BottomBar from "../pages/BottomBar";
import FloatingControlsPanel from '../Components/FloatingControlsPanel';
import CameraPreview from "../Components/CameraPreview"
import AddCameraDialog from "../Components/Dialogs/AddCameraDialog"
import AddLightDialog from "../Components/Dialogs/AddLightDialog"
import SceneTreeBridge from "../Components/SceneTree/SceneTreeBridge"
import SceneTreeSortable, { SceneTreeSortableHandle } from "../Components/SceneTree/SceneTreeSortable"
import DrawerMenu from "../Components/DrawerMenu";
import OpenSimScene from "../Components/OpenSimScene";
import OpenSimGUIScene from "../Components/OpenSimGUIScene";
import { ModelInfo, ModelUIState } from "../../state/ModelUIState";
import { observer } from "mobx-react";
import { MyModelContext } from "../../state/ModelUIStateContext";
import { useModelContext } from "../../state/ModelUIStateContext";
import { useParams } from 'react-router-dom';
import { CircularProgress } from "@mui/material";
import OpenSimHtmlLogo from '../Components/OpenSimLogo';  

import { Stats } from '@react-three/drei'
import { Perf } from 'r3f-perf'

import { createTempHelper, removeTempHelper } from '../Components/SceneTree/SceneTreeSortable'

import * as THREE from 'three';

import {
  DirectionalLight,
  SpotLight,
  PointLight} from 'three';

import VideoRecorder from "../Components/VideoRecorder"

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
  control: OpenSimControlHandle,
  parent: any,
  scene: THREE.Scene | null,
  onSceneUpdated: () => void
): THREE.Camera => {
  const camera = control.addCamera(name, parent);
  uiState.setSelected(camera.uuid);
  parent?.object3D?.add(camera);

  // Remove previous helper and create current.
  removeTempHelper(scene)
  createTempHelper(camera, scene)

  onSceneUpdated();

  camera.layers.enableAll()
  return camera;
};

export const addNewLight = (
  name: string = 'NewLight',
  type: 'DirectionalLight' | 'PointLight' | 'SpotLight' = 'SpotLight',
  uiState: ModelUIState,
  parent: any,
  scene: THREE.Scene | null,
  onSceneUpdated: () => void
): THREE.Light => {
  let light: THREE.Light;

  switch (type) {
    case 'DirectionalLight': {
      const dir = new DirectionalLight(0xffffff, 1);
      dir.target.position.set(0, 0, -1);
      light = dir;
      parent?.object3D?.add(dir.target);
      break;
    }
    case 'PointLight': {
      const point = new PointLight(0xffffff, 1, 0, 2);
      light = point;
      break;
    }
    case 'SpotLight':
    default: {
      const spot = new SpotLight(0xffffff, 1, 0, Math.PI / 6, 0.2, 1);
      light = spot;
      parent?.object3D?.add(spot.target);
      break;
    }
  }

  light.name = name;
  light.position.set(2, 2, 2);

  parent?.object3D?.add(light);

  uiState.setLightsList?.([...uiState.lights, light]);
  uiState.setSelected(light.uuid);

  // Remove previous helper and create current.
  removeTempHelper(scene)
  createTempHelper(light, scene)

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
  // TODO: Move to a general styles file?
  const leftMenuWidth = 60;
  const drawerContentWidth = 250;

  const [showDebug, setShowDebug] = useState(false);

  const [canvasLoaded, setCanvasLoaded] = useState(false);

  const [addCameraDialogOpen, setAddCameraDialogOpen] = useState(false);

  const [addLightDialogOpen, setAddLightDialogOpen] = useState(false);

  const treeRef = useRef<SceneTreeSortableHandle>(null);
  const [treeWidth, setTreeWidth] = useState(0);
  const openSimControlsRef = useRef<OpenSimControlHandle>(null);

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
  const [floatingButtonsContainerLeft, setFloatingButtonsContainerLeft] = useState("80px");
  const [, setBgndColor] = useState<Color>(new Color(0.7, 0.7, 0.7));

  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.Camera | null>(null);
  const [transformTarget, setTransformTargetInternal] = useState<THREE.Object3D | null>(null);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');

  function isImmovableObject(name: string){
    return name==="Ground" || name.startsWith("Body");
  }
  function setTransformTarget(customTarget: THREE.Object3D | null) {
    if (customTarget !== null &&
      customTarget.userData !== undefined &&
      ((customTarget.userData.name !== undefined && isImmovableObject(customTarget.userData.name)) ||
        customTarget.userData.opensimType === "Ground" || customTarget.userData.opensimType === "Frame")
    ) {
      setTransformTargetInternal(null)
      return;
    }
    setTransformTargetInternal(customTarget)
  }
  useEffect(() => {
    if (bottomBarRef.current) {
      const heightBottomBar = bottomBarRef.current.offsetHeight;
      setHeightBottomBar(bottomBarRef.current.offsetHeight);

      setCanvasHeight("calc(100vh - 68px - " + heightBottomBar + "px)");
    }
  }, []);

  React.useEffect(() => {
    // Change interface if we are in GUI mode.
    if (uiState.isGuiMode) {
      setDisplaySideBar('none');
      setCanvasWidth('100%');
      setCanvasHeight('calc(100vh - 68px)');
      setCanvasLeft(0);
      setFloatingButtonsContainerTop("12px")
      setFloatingButtonsContainerLeft("12px")
    }
    setBgndColor(uiState.viewerState.backgroundColor);
  }, [uiState.viewerState.backgroundColor, uiState.isGuiMode]);

useEffect(() => {
    // Create fresh WebSocket
    if (uiState.isGuiMode) {
      const socket = new WebSocket('ws://127.0.0.1:8002/visEndpoint');
      socket.onopen = () => { uiState.setSocketHandle(socket); console.log("socket opened");}
      socket.onmessage = function(evt) {
      //   //console.log(evt.data)
        uiState.handleSocketMessage(evt.data);
      };
      socket.onerror = function(evt) {
        uiState.isGuiMode = false;
      }
      // Implement your WebSocket logic here
      return () => {
        //socket.disconnect();
      };
    }
  }, [uiState]);

  React.useEffect(() => {
    // Load user preferences
    const viewerState = uiState.viewerState;
    viewerState.setUserPreferencesJsonPath('/user-preferences.json')
    viewerState.loadUserPreferences()

  }, [uiState.viewerState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "d") {
        e.preventDefault(); // prevent browser bookmark shortcut
        setShowDebug(prev => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (urlParam!== undefined) {
    var decodedUrl = decodeURIComponent(urlParam);
    uiState.viewerState.setCurrentModelPath(decodedUrl);
    // If urlParam is not undefined, this means it is getting the model from S3 and not from local.
    uiState.viewerState.setIsLocalUpload(false);
  }

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
          {!uiState.isGuiMode &&
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
          }
          <div id="canvas-container">
            {!canvasLoaded && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)', // Optional: semi-transparent background
                  zIndex: 1000, // Ensure it's above the canvas
                }}
              >
                <CircularProgress size={200} color={'primary'} disableShrink />
              </div>
            )}
              <FloatingControlsPanel
                videoRecorderRef={videoRecorderRef}
                info={new ModelInfo(uiState.modelInfo.model_name, uiState.modelInfo.desc, uiState.modelInfo.authors)}
                top={floatingButtonsContainerTop}
                left={floatingButtonsContainerLeft}/>
              <Canvas
                id="canvas-element"
                gl={{ alpha: true, autoClearColor: true, preserveDrawingBuffer: true }}
                shadows="soft"
                style={{
                  width: canvasWidth,
                  height: canvasHeight,
                  left: canvasLeft,
                  transition: "left 0.1s ease",
                }}
                camera={{ position: [.2, .1, .2], fov: 50 }}
                onCreated={() => setCanvasLoaded(true)}
              >
              <Environment files="/assets/potsdamer_platz_1k.hdr"/>
              <SceneTreeBridge onSceneReady={setScene} onCameraReady={setCamera} />
              <fog attach="fog" color="lightgray" near={1} far={10000} />
                {curState.isGuiMode ?
                  <OpenSimGUIScene
                    currentModelPath={uiState.viewerState.currentModelPath}
                    supportControls={true}
                  />
                : <OpenSimScene
                  currentModelPath={uiState.viewerState.currentModelPath}
                  supportControls={true}
                />}
                <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
                  <GizmoViewport labelColor="white" />
                </GizmoHelper>
                <OpenSimControl ref={openSimControlsRef}/>
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

                {showDebug && (
                  <>
                    <Stats />
                    { curState.isModernBrowser && (<Perf position="top-right" />) }
                  </>
                )}
              </Canvas>

              { /*
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
              */}

              <AddCameraDialog
                open={addCameraDialogOpen}
                onClose={() => setAddCameraDialogOpen(false)}
                onAddCamera={(name:any, type:any) => {
                  const newCam = addNewCamera(name, type, uiState, openSimControlsRef.current!, treeRef.current?.selectedNode() ?? null, scene, () => {uiState.viewerState.sceneVersion++});
                  setTransformTarget(newCam);
                }}
                scene={scene}
                uiState={uiState}
                parent={treeRef.current?.selectedNode() ?? null}
              />

              <AddLightDialog
                open={addLightDialogOpen}
                onClose={() => setAddLightDialogOpen(false)}
                onAddLight={(name:any, type:any) => {
                    const newLight = addNewLight(name, type, uiState, treeRef.current?.selectedNode() ?? null, scene, () => {uiState.viewerState.sceneVersion++});
                    setTransformTarget(newLight);
                }}
                scene={scene}
                uiState={uiState}
                parent={treeRef.current?.selectedNode() ?? null}
              />

              <BottomBar
                ref={bottomBarRef}
                animationPlaySpeed={1.0}
                animating={uiState.viewerState.animating}
                animationList={uiState.viewerState.animations}/>

              {scene && camera && (
                <div
                  style={{
                    position: "absolute",
                    top: 66,
                    right: 0,
                    zIndex: 1002,
                    height: canvasHeight,          // full canvas height
                    width: `${treeWidth}`,       // whatever width the tree reports (fallback 250 px)
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ flex: "1 1 50%", overflowY: "auto" }}>
                    <SceneTreeSortable
                      ref={treeRef}
                      scene={scene}
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


          </div>
          <OpenSimHtmlLogo />
        </Main>
      </Box>
    </MyModelContext.Provider>
  );
}

export default observer(ModelViewPage);
