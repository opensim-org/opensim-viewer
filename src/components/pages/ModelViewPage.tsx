import * as React from "react";
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
import { Suspense, useEffect } from "react";
import BottomBar from "../pages/BottomBar";

import { useRef } from 'react';

import { useThree } from '@react-three/fiber';

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

import DrawerMenu from "../Components/DrawerMenu";
import OpenSimScene from "../pages/OpenSimScene";
import { ModelUIState } from "../../state/ModelUIState";
import { observer } from "mobx-react";
import { MyModelContext } from "../../state/ModelUIStateContext";
import { useModelContext } from "../../state/ModelUIStateContext";
import OpenSimFloor from "./OpenSimFloor";

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

type RecorderRef = {
  startRecording: () => void;
  stopRecording: () => void;
};

type RecorderViewProps = {
  recorderRef: React.MutableRefObject<RecorderRef | null>;
}

function Recorder(props :RecorderViewProps) {
  const { gl } = useThree();
  const ffmpegRef = useRef(new FFmpeg());

  const load = async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd/'
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message }) => {
      console.log(message);
    });
    await ffmpeg.load({
      coreURL: `${baseURL}/ffmpeg-core.js`,
      wasmURL: `${baseURL}/ffmpeg-core.wasm`,
    });
  }

  const transcodeMp4 = async (url:string) => {
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile('input.webm', await fetchFile(url));
    await ffmpeg.exec(['-i', 'input.webm', '-r', '60', "-vf", "scale=1860:502", 'video.mp4']);
    const data = await ffmpeg.readFile('video.mp4');
    const urlMp4 = URL.createObjectURL(new Blob([data], {type: 'video/mp4'}));
    return urlMp4;
  }

  const transcodeMov = async (url:string) => {
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile('input.webm', await fetchFile(url));
    await ffmpeg.exec(['-i', 'input.webm', '-r', '60', "-vf", "scale=1860:502", 'video.mov']);
    const data = await ffmpeg.readFile('video.mov');
    const urlMov = URL.createObjectURL(new Blob([data], {type: 'video/mov'}));
    return urlMov;
  }

  function downloadVideo(url:any, fileName:string) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  }

  useEffect(() => {

    const stream = gl.domElement.captureStream();
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });

    const startRecording = function() {
      recorder.start();
    };

    const stopRecording = function() {
      recorder.stop()
      recorder.addEventListener('dataavailable', async (evt) => {
        const url = URL.createObjectURL(evt.data);
        // If not webm, convert to format.
        if (viewerState.recordedVideoFormat === "webm") {
          downloadVideo(url, viewerState.recordedVideoName + "." + viewerState.recordedVideoFormat )
        } else {
          await load()
          if (viewerState.recordedVideoFormat === "mp4") {
            const urlMp4 = await transcodeMp4(url)
            downloadVideo(urlMp4, viewerState.recordedVideoName + "." + viewerState.recordedVideoFormat )
          }
          if (viewerState.recordedVideoFormat === "mov") {
            await load()
            const urlMov = await transcodeMov(url)
            downloadVideo(urlMov, viewerState.recordedVideoName + "." + viewerState.recordedVideoFormat )
          }
        }
      });
    };

    props.recorderRef.current = {
      startRecording,
      stopRecording,
    };
  }, [props.recorderRef, gl.domElement]);

  return null;
}

export function PersistentDrawerLeft() {
  const theme = useTheme();
  const curState = useModelContext();
  curState.setCurrentModelPath(viewerState.currentModelPath);
  const [uiState] = React.useState<ModelUIState>(curState);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [selectedTabName, setSelectedTabName] = React.useState<string>("File");

  const recorderRef = useRef(null);

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
              <Canvas
                gl={{ preserveDrawingBuffer: true }}
                shadows="soft"
                style={{
                  width:
                    "calc(100vw - " +
                    (leftMenuWidth + (menuOpen ? drawerContentWidth : 0)) +
                    "px)",
                  height: "calc(100vh - 68px - 7vh)",
                  left: leftMenuWidth + (menuOpen ? drawerContentWidth : 0),
                  transition: "left 0.1s ease",
                }}
                camera={{ position: [1500, 2000, 1000], fov: 75, far: 10000 }}
              >
                <fog attach="fog" color="lightgray" near={1} far={10} />
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
                <OpenSimFloor />
                <Recorder recorderRef={recorderRef}/>
              </Canvas>
              <BottomBar recorder={recorderRef}/>
            </Suspense>
          </div>
        </Main>
      </Box>
    </MyModelContext.Provider>
  );
}

export default observer(PersistentDrawerLeft);
