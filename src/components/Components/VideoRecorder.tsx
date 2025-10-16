import * as React from "react";
import { useEffect, useRef } from "react";

import { observer } from "mobx-react";
import { useThree } from '@react-three/fiber';

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useModelContext } from "../../state/ModelUIStateContext";

import { getTimestamp } from "../../helpers/timeHelpers";

type VideoRecorderRef = {
  startRecording: () => void;
  stopRecording: () => void;
};

type VideoRecorderViewProps = {
  videoRecorderRef: React.MutableRefObject<VideoRecorderRef | null>;
}

function VideoRecorder(props: VideoRecorderViewProps) {
  const { t } = useTranslation();
  const viewerState = useModelContext().viewerState;
  const { gl } = useThree();
  const curState = useModelContext();

  const ffmpegRef = useRef(new FFmpeg());
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const capturedFrames = useRef<string[]>([]);
  const isRecordingRef = useRef(false);
  const fps = 30;

  // Load ffmpeg.wasm
  const load = async () => {
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message }) => console.log(message));
    await ffmpeg.load({
      coreURL: '/ffmpeg/ffmpeg-core.js',
      wasmURL: '/ffmpeg/ffmpeg-core.wasm',
    });
  };

  /**
   * Capture the current WebGL frame and flatten transparency to white.
   */
  const captureFrame = (): string => {
    const glCanvas = gl.domElement;
    const w = glCanvas.width;
    const h = glCanvas.height;

    // Create an offscreen 2D canvas
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = w;
    compositeCanvas.height = h;
    const ctx = compositeCanvas.getContext('2d')!;

    // Fill with white before drawing WebGL frame
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Draw WebGL canvas (flattens transparency)
    ctx.drawImage(glCanvas, 0, 0, w, h);

    // Encode as JPEG (no alpha)
    return compositeCanvas.toDataURL('image/jpeg', 0.92);
  };

  const encodeFramesToVideo = async (ext: 'mp4' | 'mov') => {
    const ffmpeg = ffmpegRef.current;
    await load();

    // Clean up any previous files
    try {
      const files = await ffmpeg.listDir('/');
      for (const file of files) {
        if (file.name.startsWith('input') || file.name.startsWith('output')) {
          await ffmpeg.deleteFile(file.name);
        }
      }
    } catch (e) {
      console.warn("Cleanup skipped:", e);
    }

    // Write new frames
    for (let i = 0; i < capturedFrames.current.length; i++) {
      const dataURL = capturedFrames.current[i];
      const res = await fetch(dataURL);
      const blob = await res.blob();
      await ffmpeg.writeFile(`input${String(i).padStart(3, '0')}.jpg`, await fetchFile(blob));
    }

    // Encoding args
    const args = [
      '-framerate', `${fps}`,
      '-i', 'input%03d.jpg',
      '-r', `${fps}`,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'fast',
      '-crf', '17',
    ];

    if (ext === 'mov') {
      args.push('-profile:v', 'high');
      args.push('-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2');
    }

    args.push(`output.${ext}`);
    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(`output.${ext}`);
    return URL.createObjectURL(new Blob([data], { type: `video/${ext}` }));
  };

  const downloadVideo = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    // Ensure the renderer clears to white for MediaRecorder path
    gl.setClearColor(0xffffff, 1);

    const stream = gl.domElement.captureStream(fps);
    const webmSupported = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus');
    const useMediaRecorder = viewerState.recordedVideoFormat === 'webm' && webmSupported;

    const recorder = useMediaRecorder
      ? new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' })
      : null;

    const recordedChunks: Blob[] = [];

    if (recorder) {
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const timestamp = getTimestamp();
        downloadVideo(url, `${viewerState.recordedVideoName}_${timestamp}.webm`);
        recordedChunks.length = 0; // cleanup
      };
    }

    const startRecording = () => {
      viewerState.setIsRecordingVideo(true);
      viewerState.setAnimating(false);

      enqueueSnackbar(t('snackbars.recording_video'), {
        variant: 'info',
        anchorOrigin: { horizontal: 'right', vertical: 'bottom' },
        persist: true,
      });

      let prevFrame = 0;

      if (useMediaRecorder && recorder) {
        recordedChunks.length = 0; // reset chunks before starting
        viewerState.setAnimating(true);
        recorder.start();

        // Check if it is recording, and we have not yet completing
        // and animation cycle.

        const frameCheck = () => {
          const frame = curState.currentFrame;
          if (viewerState.isRecordingVideo && frame < prevFrame) {
            stopRecording();
            return;
          }
          prevFrame = frame;
          requestAnimationFrame(frameCheck);
        };

        requestAnimationFrame(frameCheck);
      } else {
        capturedFrames.current = [];
        viewerState.setAnimating(true);
        isRecordingRef.current = true;

        let frameCount = 0;
        const startTime = performance.now();
        let lastCaptureTime = startTime;

        const loop = () => {
          if (!isRecordingRef.current) {
            const endTime = performance.now();
            const durationSec = (endTime - startTime) / 1000;
            const realFps = frameCount / durationSec;
            console.log(`Recording stopped.`);
            console.log(`Duration: ${durationSec.toFixed(2)}s`);
            console.log(`Frames: ${frameCount}`);
            console.log(`FPS: ${realFps.toFixed(2)}`);
            return;
          }

          const frame = curState.currentFrame;
          if (viewerState.isRecordingVideo && frame < prevFrame) {
            stopRecording();
            return;
          }
          prevFrame = frame;

          const now = performance.now();
          const frameDuration = 1000 / fps;
          if (now - lastCaptureTime >= frameDuration) {
            lastCaptureTime = now;
            const frameDataURL = captureFrame(); // white background flattening here
            capturedFrames.current.push(frameDataURL);
            frameCount++;
          }

          requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
      }
    };

    const stopRecording = async () => {
      closeSnackbar();
      viewerState.setIsRecordingVideo(false);
      viewerState.setAnimating(false);

      if (useMediaRecorder && recorder) {
        recorder.stop();
      } else {
        isRecordingRef.current = false;

        enqueueSnackbar(t('snackbars.processing_video'), {
          variant: 'info',
          anchorOrigin: { horizontal: 'right', vertical: 'bottom' },
          persist: true,
        });
        viewerState.setIsProcessingVideo(true);

        try {
          const ext = viewerState.recordedVideoFormat as 'mp4' | 'mov';
          const url = await encodeFramesToVideo(ext);
          const timestamp = getTimestamp();
          downloadVideo(url, `${viewerState.recordedVideoName}_${timestamp}.${ext}`);
        } catch (e) {
          console.error(e);
        }

        capturedFrames.current = []; //cleanup
        viewerState.setIsProcessingVideo(false);
        closeSnackbar();
      }
    };

    props.videoRecorderRef.current = { startRecording, stopRecording };
  }, [props.videoRecorderRef, gl.domElement, enqueueSnackbar, closeSnackbar, t, viewerState, viewerState.recordedVideoFormat]);

  return null;
}

export default observer(VideoRecorder);
