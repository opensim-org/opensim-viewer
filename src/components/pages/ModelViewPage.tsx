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

import OpenSimGUIScene from "../Components/OpenSimGUIScene";
import { ModelInfo, ModelUIState } from "../../state/ModelUIState";
import { observer } from "mobx-react";
import { MyModelContext } from "../../state/ModelUIStateContext";
import { useModelContext } from "../../state/ModelUIStateContext";
import { useParams } from 'react-router-dom';
import { CircularProgress } from "@mui/material";
import OpenSimHtmlLogo from '../Components/OpenSimLogo';
import RecordModeOverlay from '../Components/RecordModeOverlay'

import { Stats } from '@react-three/drei'

import { createTempHelper, removeTempHelper, updateTempHelperVisibility } from '../Components/SceneTree/SceneTreeSortable'

import * as THREE from 'three';

import {
  DirectionalLight,
  SpotLight,
  PointLight} from 'three';

import VideoRecorder from "../Components/VideoRecorder"

// import GUI from 'lil-gui';
import { Color} from 'three';
import { TransformControls } from "@react-three/drei";
import DropFileFullPage from "../Components/DropFileFullPage";


// Aspect ratio utility functions
const parseAspectRatio = (aspectRatio: string): { width: number; height: number } => {
  const [widthStr, heightStr] = aspectRatio.split(':');
  return { width: parseInt(widthStr, 10), height: parseInt(heightStr, 10) };
};

const getRecordingRect = (canvasWidth: number, canvasHeight: number, aspectRatio: string) => {
  const { width: arW, height: arH } = parseAspectRatio(aspectRatio);
  const canvasAR = canvasWidth / canvasHeight;
  const targetAR = arW / arH;

  let recWidth, recHeight, offsetX, offsetY;

  if (canvasAR > targetAR) {
    // Canvas is wider → height fits, width is smaller than canvas width
    recHeight = canvasHeight;
    recWidth = canvasHeight * targetAR;
    offsetX = (canvasWidth - recWidth) / 2;
    offsetY = 0;
  } else {
    // Canvas is taller → width fits, height is smaller than canvas height
    recWidth = canvasWidth;
    recHeight = canvasWidth / targetAR;
    offsetX = 0;
    offsetY = (canvasHeight - recHeight) / 2;
  }

  return { recWidth, recHeight, offsetX, offsetY };
};

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
  createTempHelper(camera, scene, uiState)

  onSceneUpdated();

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
  createTempHelper(light, scene, uiState)

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

  const [canvasLoaded, setCanvasLoaded] = useState(false);

  const [addCameraDialogOpen, setAddCameraDialogOpen] = useState(false);

  const [addLightDialogOpen, setAddLightDialogOpen] = useState(false);

  const treeRef = useRef<SceneTreeSortableHandle>(null);
  const [treeWidth, setTreeWidth] = useState(0);
  const openSimControlsRef = useRef<OpenSimControlHandle>(null);

  const curState = useModelContext();
  let { urlParam } = useParams();

  const [uiState] = React.useState<ModelUIState>(curState);

  const canvasWidth = "100vw";
  const canvasHeight = uiState.isGuiMode ? "100vh" : "calc(100vh - 68px)";
  const floatingButtonsContainerTop = uiState.isGuiMode ? "12px" : "80px";
  const guiModeMarginTop = uiState.isGuiMode ? 0 : 68;

  const [, setBgndColor] = useState<Color>(new Color(0.7, 0.7, 0.7));

  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.Camera | null>(null);
  const [transformTarget, setTransformTargetInternal] = useState<THREE.Object3D | null>(null);
  const [transformMode, ] = useState<'translate' | 'rotate'>('translate');

  const DropWrapper = uiState.isGuiMode ? React.Fragment : DropFileFullPage;

  useLayoutEffect(() => {
    const el = treeRef.current?.getWidth ? treeRef.current : null;
    if (!el) return;

    const ro = new ResizeObserver(() =>
      setTreeWidth(treeRef.current?.getWidth() ?? 0)
    );
    ro.observe(el as unknown as Element);   // observe the wrapper div
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const path = uiState.viewerState.currentModelPath;
    if (path && path !== "mt.json") {
      localStorage.setItem("lastModelPath", path);
    }
  }, [uiState.viewerState.currentModelPath]);

  useEffect(() => {
    let pathToLoad: string | null = null;

    if (urlParam !== undefined) {
      pathToLoad = decodeURIComponent(urlParam);
      uiState.viewerState.setIsLocalUpload(false);
    } else {
      const savedPath = localStorage.getItem("lastModelPath");
      if (savedPath) {
        pathToLoad = savedPath;

        // Preserve existing query parameters
        const params = new URLSearchParams(window.location.search);
        params.set("model", encodeURIComponent(savedPath));

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, '', newUrl);
      }
    }

    if (pathToLoad) {
      uiState.viewerState.setCurrentModelPath(pathToLoad);
    }
  }, [urlParam, uiState.viewerState]);

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

  React.useEffect(() => {
    // Change interface if we are in GUI mode.
    setBgndColor(uiState.viewerState.backgroundColor);
  }, [uiState.viewerState.backgroundColor, uiState.isGuiMode]);

  useEffect(() => {
    if (scene) {
      updateTempHelperVisibility(scene, uiState.visibleHelpers);
    }
  }, [uiState.visibleHelpers, scene]);

useEffect(() => {
    // Create fresh WebSocket
    if (uiState.isGuiMode && uiState.socket === null) {
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
      // Toggle debug with Ctrl+D
      if (e.ctrlKey && e.key.toLowerCase() === "d") {
        e.preventDefault(); // prevent browser bookmark shortcut
        curState.setDebug?.(!curState.debug);
      }

      // Toggle aspect ratio guides with Ctrl+G
      if (curState.showAspectRatioFunctionality) {
        if (e.ctrlKey && e.key.toLowerCase() === "g") {
          e.preventDefault();
          curState.viewerState.setShowAspectRatioGuides?.(!curState.viewerState.showAspectRatioGuides);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [curState]);

  if (urlParam!== undefined) {
    var decodedUrl = decodeURIComponent(urlParam);
    uiState.viewerState.setCurrentModelPath(decodedUrl);
    // If urlParam is not undefined, this means it is getting the model from S3 and not from local.
    uiState.viewerState.setIsLocalUpload(false);
  }

  const [Perf, setPerf] = useState<any>(null);

  useEffect(() => {
    if (curState.isModernBrowser) {
      import('r3f-perf').then(mod => setPerf(() => mod.Perf));
    }
  }, [curState.isModernBrowser]);

  return (
    <MyModelContext.Provider value={uiState}>
      <Box component="div">
        <CssBaseline />
          <div id="canvas-container">
            <>
            {uiState.isInRecordMode && (
              <RecordModeOverlay
                videoRecorderRef={videoRecorderRef}
                onRecordComplete={() => {
                  console.log("Recording process finished");
                  uiState.viewerState.setShowAspectRatioGuides?.(false);
                }}
              />
            )}
            {curState.viewerState.recordedVideoAspectRatio && (curState.viewerState.isRecordingVideo || curState.viewerState.showAspectRatioGuides) && (
              (() => {
                const canvasEl = document.getElementById('canvas-element');
                if (!canvasEl) return null;

                const canvasWidth = canvasEl.clientWidth;
                const canvasHeight = canvasEl.clientHeight;

                const { recWidth, recHeight, offsetX, offsetY } = getRecordingRect(
                  canvasWidth,
                  canvasHeight,
                  curState.viewerState.recordedVideoAspectRatio
                );

                const overlayStyle = {
                  position: 'absolute' as const,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  pointerEvents: 'none' as const,
                  zIndex: 1001,
                };

                return (
                  <>
                    <div style={{ ...overlayStyle, top: guiModeMarginTop, left: '0%', width: '100%', height: offsetY }} />
                    {/* Bottom overlay */}
                    <div style={{ ...overlayStyle, top: guiModeMarginTop + offsetY + recHeight, left: '0%', width: '100%', height: canvasHeight - (offsetY + recHeight) }} />
                    {/* Left overlay */}
                    <div style={{ ...overlayStyle, top: guiModeMarginTop + offsetY, left: '0%', width: offsetX, height: recHeight }} />
                    {/* Right overlay */}
                    <div style={{ ...overlayStyle, top: guiModeMarginTop + offsetY, right: '0%', width: canvasWidth - (offsetX + recWidth), height: recHeight }} />
                  </>
                );
              })()
            )}
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
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
                left={"12px"}/>
              <DropWrapper>
                <Canvas
                  id="canvas-element"
                  gl={{ alpha: true, autoClearColor: true, preserveDrawingBuffer: true }}
                  shadows="soft"
                  style={{
                    width: canvasWidth,
                    height: canvasHeight,
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
                  : <OpenSimGUIScene
                    currentModelPath={uiState.viewerState.currentModelPath}
                    supportControls={true}
                  />}
                  <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
                    <GizmoViewport labelColor="white" />
                  </GizmoHelper>
                  <OpenSimControl ref={openSimControlsRef}/>
                  <axesHelper visible={uiState.showGlobalFrame} args={[20]} />
                  <VideoRecorder
                      videoRecorderRef={videoRecorderRef}
                      treeReference={treeRef}/>
                  {transformTarget && uiState.visibleHelpers && (
                    <>
                        <TransformControls object={transformTarget} mode={transformMode} />
                    </>
                  )}

                  {uiState.selected && (
                    <CameraPreview selectedCameraUuid={uiState.selected} marginRight={treeWidth} />
                  )}

                  {curState.debug && (
                    <>
                      <Stats />
                      { curState.isModernBrowser && Perf &&  (<Perf position="top-right" />) }
                    </>
                  )}
                </Canvas>
              </DropWrapper>

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

              {curState.isInDollyEditMode && (
              <BottomBar
                ref={bottomBarRef}
                animationPlaySpeed={1.0}
                animating={uiState.viewerState.animating}
                animationList={uiState.viewerState.animations}
                controlsRef={openSimControlsRef.current}
              />)}

              {scene && camera && (
                <div
                  style={{
                    position: "absolute",
                    top: guiModeMarginTop,
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
                      controls={openSimControlsRef.current}
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

            </>
          </div>
          <OpenSimHtmlLogo/>
      </Box>
    </MyModelContext.Provider>
  );
}

export default observer(ModelViewPage);