import React, { useRef, useEffect, useState } from 'react';
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  Environment,
  GizmoHelper,
  GizmoViewport,
} from "@react-three/drei";
import viewerState from "../../state/ViewerState";
import OpenSimControl from "../pages/OpenSimControl";
import { Suspense } from "react";
import BottomBar from "../pages/BottomBar";
import FloatingControlsPanel from '../Components/FloatingControlsPanel';

import DrawerMenu from "../Components/DrawerMenu";
import OpenSimGUIScene from "../pages/OpenSimGUIScene";
import { ModelUIState } from "../../state/ModelUIState";
import { observer } from "mobx-react";
import { MyModelContext } from "../../state/ModelUIStateContext";
import { useModelContext } from "../../state/ModelUIStateContext";
import { useParams } from 'react-router-dom';

import OpenSimFloor from "./OpenSimFloor";
import VideoRecorder from "../Components/VideoRecorder"
import { ModelInfo } from '../../state/ModelUIState';

import GUI from 'lil-gui';
import { Color} from 'three';

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

  useEffect(() => {
    if (bottomBarRef.current) {
      const heightBottomBar = bottomBarRef.current.offsetHeight;
      setHeightBottomBar(bottomBarRef.current.offsetHeight);

      setCanvasHeight("calc(100vh - 68px - " + heightBottomBar + "px)");

      // Do something with heightBottomBar if needed
      console.log('Height of BottomBar:', heightBottomBar);
    }
  }, []);

  React.useEffect(() => {
    // Change interface if we are in GUI mode.
    if (viewerState.isGuiMode) {
      setDisplaySideBar('none');
      setCanvasWidth('100%');
      setCanvasHeight('calc(100vh - 68px)');
      setCanvasLeft(0);
      setFloatingButtonsContainerTop("12px")
    }
    setBgndColor(viewerState.backgroundColor);
  }, []);

  useEffect(() => {
    // Create fresh WebSocket
    const socket = new WebSocket('ws://127.0.0.1:8002/visEndpoint');
    socket.onopen = () => { console.log("socket opened");}
    socket.onmessage = function(evt) { 
      //console.log(evt.data)
      uiState.handleSocketMessage(evt.data);
    };
    // Implement your WebSocket logic here
    return () => {
      //socket.disconnect();
    };
  }, [uiState]);

  React.useEffect(() => {
    const gui = new GUI()
    const sceneFolder = gui.addFolder("Scene");
    sceneFolder.addColor(viewerState, 'backgroundColor').onChange(
      function(v: any){viewerState.setBackgroundColor(v); coloRef.current?.copy(v);}
    );
    const floorFolder = gui.addFolder("Floor");
    floorFolder.add(viewerState, 'floorHeight', -2, 2, .01).name("Height")
    floorFolder.add(viewerState, 'floorVisible')
    // floorFolder.add(viewerState, 'floorTextureFile', { 'tile':0, 'wood-floor':1, 'Cobblestone':2, 'textureStone':3, 'grassy':4}).name("Texture").onChange(
    //   function(v: any){viewerState.setFloorTextureIndex(v)}
    // );
    const lightFolder = gui.addFolder("Lights");
    lightFolder.add(viewerState, 'lightIntensity', 0, 2, .05).name("Intensity")
    lightFolder.addColor(viewerState, 'lightColor').name("Color")
    lightFolder.add(viewerState, 'spotLight')
    return () => {
        gui.destroy()
      }
  }, []);
  
  //console.log(urlParam);
  if (urlParam!== undefined) {
    var decodedUrl = decodeURIComponent(urlParam);
    viewerState.setCurrentModelPath(decodedUrl);
    curState.setCurrentModelPath(viewerState.currentModelPath);
    // If urlParam is not undefined, this means it is getting the model from S3 and not from local.
    viewerState.setIsLocalUpload(false);
  }
  // else
  //   curState.setCurrentModelPath(viewerState.currentModelPath);
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
                camera={{ position: [1.5, 2.0, 1.0], fov: 75, far: 10 }}
              >
              <fog attach="fog" color="lightgray" near={.01} far={10} />

                <color  ref={coloRef}
                  attach="background" args={[bgndColor.r, bgndColor.g, bgndColor.b]}
                  // args={
                  //   theme.palette.mode === "dark" ? ["#151518"] : ["#cccccc"]
                  // }
                />
                <Bounds fit clip observe>
                  <OpenSimGUIScene 
                    currentModelPath={uiState.currentModelPath}
                    supportControls={true}
                  />
                </Bounds>
                <Environment files="/builtin/potsdamer_platz_1k.hdr" />
                <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
                  <GizmoViewport labelColor="white" axisHeadScale={1} />
                </GizmoHelper>
                <OpenSimControl/>
                <axesHelper visible={uiState.showGlobalFrame} args={[20]} />
                <OpenSimFloor />
                <VideoRecorder videoRecorderRef={videoRecorderRef}/>
              </Canvas>
              <BottomBar
                ref={bottomBarRef}
                animationPlaySpeed={1.0}
                animating={uiState.animating}
                animationList={uiState.animations}/>
            </Suspense>
          </div>
        </Main>
      </Box>
    </MyModelContext.Provider>
  );
}

export default observer(ModelViewPage);
