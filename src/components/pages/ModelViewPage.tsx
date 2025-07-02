import React, { useRef, useEffect, useState, Suspense } from 'react';
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  GizmoHelper,
  GizmoViewport,
  OrbitControls,
} from "@react-three/drei";
import OpenSimControl from '../Components/OpenSimControl';
import BottomBar from "../pages/BottomBar";
import FloatingControlsPanel from '../Components/FloatingControlsPanel';
import DrawerMenu from "../Components/DrawerMenu";
import OpenSimGUIScene from "../Components/OpenSimGUIScene";
import { ModelInfo, ModelUIState } from "../../state/ModelUIState";
import { observer } from "mobx-react";
import { MyModelContext } from "../../state/ModelUIStateContext";
import { useModelContext } from "../../state/ModelUIStateContext";
import { useParams } from 'react-router-dom';

import VideoRecorder from "../Components/VideoRecorder"

import { GUI } from 'dat.gui';
import { Color} from 'three';

import OpenSimSkySphere from '../Components/OpenSimSkySphere' 
import OpenSimHtmlLogo from '../Components/OpenSimLogo';
import OpenSimScene from  '../Components/OpenSimScene'

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
    if (uiState.isGuiMode) {
      setDisplaySideBar('none');
      setCanvasWidth('100%');
      setCanvasHeight('calc(100vh - 68px)');
      setCanvasLeft(0);
      setFloatingButtonsContainerTop("12px")
    }
    //setBgndColor(viewerState.backgroundColor);
  }, [uiState.isGuiMode]);

  useEffect(() => {
    // Create fresh WebSocket
    if (uiState.isGuiMode) {
      const socket = new WebSocket('ws://127.0.0.1:8002/visEndpoint');
      socket.onopen = () => { console.log("socket opened");}
      socket.onmessage = function(evt) { 
      //   //console.log(evt.data)
        uiState.handleSocketMessage(evt.data);
        uiState.setSocketHandle(socket);
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
    const gui = new GUI()
    const sceneFolder = gui.addFolder("Scene");
    sceneFolder.addColor(uiState.viewerState, 'backgroundColor').onChange(
      function(v: any){
        uiState.viewerState.setBackgroundColor(v); coloRef.current?.copy(v);
      }
    );
    sceneFolder.add(uiState.viewerState, 'skyTextureIndex', {'no-background':-1,'death-valley':0, 'san-carlo':1, 'pozzolo':2, 'nessa_and_lagnone':3}).name("Texture").onChange(
      function(v: any){uiState.viewerState.setSkyTextureIndex(v); 
        }
    );
    sceneFolder.add(uiState, 'showGlobalFrame')
    const floorFolder = gui.addFolder("Floor");
    floorFolder.add(uiState.viewerState, 'floorHeight', -2, 2, .01).name("Height")
    floorFolder.add(uiState.viewerState, 'floorRound')
    floorFolder.add(uiState.viewerState, 'floorVisible').onChange(() => {
    })
    floorFolder.add(uiState.viewerState, 'textureIndex', { 'tile':0, 'wood-floor':1, 'Cobblestone':2, 'textureStone':3, 'grassy':4}).name("Texture").onChange(
       function(v: any){
        uiState.viewerState.setFloorTextureIndex(v)
      }
    );
    const lightFolder = gui.addFolder("Lights");
    lightFolder.add(uiState.viewerState, 'lightIntensity', 0, 2, .05).name("Intensity")
    lightFolder.addColor(uiState.viewerState, 'lightColor').name("Color")
    lightFolder.add(uiState.viewerState, 'spotLight')

    const cameraFolder = gui.addFolder("Camera");
    cameraFolder.add(uiState, 'saveCamera');
    cameraFolder.add(uiState, 'restoreCamera');
    const environmentFolder = gui.addFolder("Environment");
    environmentFolder.add(uiState, 'save')
    environmentFolder.add(uiState, 'restore')
    return () => {
        gui.destroy()
      }
   }, [uiState]);
  
  //console.log(urlParam);
  if (urlParam!== undefined) {
    var decodedUrl = decodeURIComponent(urlParam);
    uiState.viewerState.setCurrentModelPath(decodedUrl);
    curState.setCurrentModelPath(uiState.viewerState.currentModelPath);
    // If urlParam is not undefined, this means it is getting the model from S3 and not from local.
    uiState.viewerState.setIsLocalUpload(false);
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
            <Suspense fallback={null}>
              <FloatingControlsPanel
                videoRecorderRef={videoRecorderRef}
                info={new ModelInfo(uiState.modelInfo.model_name, uiState.modelInfo.desc, uiState.modelInfo.authors)}
                top={floatingButtonsContainerTop}/>
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
              >
              <fog attach="fog" color="lightgray" near={.01} far={50} />

                {uiState.isGuiMode?
                <OpenSimGUIScene 
                  currentModelPath={uiState.currentModelPath}
                  supportControls={true}
                />:
                <OpenSimGUIScene
                  currentModelPath={uiState.viewerState.currentModelPath}
                  supportControls={true}
                />}
                <GizmoHelper alignment="bottom-right" margin={[100, 100]} 
                onClick={
                  (e)=>console.log(e)
                  }>
                  <GizmoViewport labelColor="transparent" />
                </GizmoHelper>
                {uiState.isGuiMode?
                  <OpenSimControl/>:
                  <OrbitControls/>
                }
                <Environment files="/assets/potsdamer_platz_1k.hdr"/>
                <OpenSimSkySphere />
                <VideoRecorder videoRecorderRef={videoRecorderRef}/>
              </Canvas>
              <BottomBar
                ref={bottomBarRef}
                animationPlaySpeed={1.0}
                animating={uiState.animating}
                animationList={uiState.animations}/>
              <OpenSimHtmlLogo/>
            </Suspense>
          </div>
        </Main>
      </Box>
    </MyModelContext.Provider>
  );
}

export default observer(ModelViewPage);
