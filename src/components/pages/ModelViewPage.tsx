import React, { useRef, useEffect, useState } from 'react';
import { styled, useTheme } from "@mui/material/styles";
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
import OpenSimScene from "../pages/OpenSimScene";
import { ModelUIState } from "../../state/ModelUIState";
import { observer } from "mobx-react";
import { MyModelContext } from "../../state/ModelUIStateContext";
import { useModelContext } from "../../state/ModelUIStateContext";
import { useParams } from 'react-router-dom';

import OpenSimFloor from "./OpenSimFloor";
import VideoRecorder from "../Components/VideoRecorder"
import { ModelInfo } from '../../state/ModelUIState';

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

  const theme = useTheme();
  const curState = useModelContext();
  let { urlParam } = useParams();

  const [heightBottomBar, setHeightBottomBar] = useState(0);

  useEffect(() => {
    if (bottomBarRef.current) {
      const heightBottomBar = bottomBarRef.current.offsetHeight;
      setHeightBottomBar(bottomBarRef.current.offsetHeight);

      // Do something with heightBottomBar if needed
      console.log('Height of BottomBar:', heightBottomBar);
    }
  }, []);

  //console.log(urlParam);
  if (urlParam!== undefined) {
    var decodedUrl = decodeURIComponent(urlParam);
    viewerState.setCurrentModelPath(decodedUrl);
    curState.setCurrentModelPath(viewerState.currentModelPath);
    // If urlParam is not undefined, this means it is getting the model from S3 and not from local.
    viewerState.isLocalUpload = false;
  }
  else
    curState.setCurrentModelPath(viewerState.currentModelPath);
  const [uiState] = React.useState<ModelUIState>(curState);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [selectedTabName, setSelectedTabName] = React.useState<string>("File");

  const videoRecorderRef = useRef(null);

  function toggleOpenMenu(name: string = "") {
    // If same name, or empty just toggle.
    if (name === selectedTabName || name === "") setMenuOpen(!menuOpen);
    // If different name and not empty, if closed, open.
    else if (name !== "" && !menuOpen) setMenuOpen(!menuOpen);
    // Always store same name.
    setSelectedTabName(name);
  }

  // TODO: Move to a general styles file?
  const leftMenuWidth = 60;
  const drawerContentWidth = 250;

  return (
    <MyModelContext.Provider value={uiState}>
      <Box component="div" sx={{ display: "flex" }}>
        <CssBaseline />
        <Main>
          <DrawerMenu
            menuOpen={menuOpen}
            selectedTabName={selectedTabName}
            toggleOpenMenu={toggleOpenMenu}
            uiState={uiState}
            leftMenuWidth={leftMenuWidth}
            drawerContentWidth={drawerContentWidth}
          />
          <div id="canvas-container">
            <Suspense fallback={null}>
              <FloatingControlsPanel
                videoRecorderRef={videoRecorderRef}
                info={new ModelInfo(uiState.modelInfo.model_name, uiState.modelInfo.desc, uiState.modelInfo.authors)}/>
              <Canvas
                gl={{ preserveDrawingBuffer: true }}
                shadows="soft"
                style={{
                  width:
                    "calc(100vw - " +
                    (leftMenuWidth + (menuOpen ? drawerContentWidth : 0)) +
                    "px)",
                  height: "calc(100vh - 68px - " + heightBottomBar + "px)",
                  left: leftMenuWidth + (menuOpen ? drawerContentWidth : 0),
                  transition: "left 0.1s ease",
                }}
                camera={{ position: [1500, 2000, 1000], fov: 75, far: 10000 }}
              >
                <fog attach="fog" color="lightgray" near={1} far={10000} />
                <color
                  attach="background"
                  args={
                    theme.palette.mode === "dark" ? ["#151518"] : ["#cccccc"]
                  }
                />
                <Bounds fit clip observe>
                  <OpenSimScene
                    currentModelPath={viewerState.currentModelPath}
                    supportControls={true}
                  />
                </Bounds>
                <Environment files="/builtin/potsdamer_platz_1k.hdr" />
                <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
                  <GizmoViewport labelColor="white" axisHeadScale={1} />
                </GizmoHelper>
                <OpenSimControl/>
                <axesHelper visible={uiState.showGlobalFrame} args={[20]} />
                {!noFloor && <OpenSimFloor />}
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
