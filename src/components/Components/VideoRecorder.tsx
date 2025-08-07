import * as React from "react";
import { useEffect, useRef } from "react";

import { observer } from "mobx-react";

import { useThree } from '@react-three/fiber';

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

import { useSnackbar } from 'notistack'

import { useTranslation } from 'react-i18next'
import { useModelContext } from "../../state/ModelUIStateContext";


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
  const ffmpegRef = useRef(new FFmpeg());
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const capturedFrames = useRef<string[]>([]);
  const isRecordingRef = useRef(false);
  const frameCaptureIntervalRef = useRef<number | null>(null);
  const fps = 30;

  const load = async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd/';
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message }) => console.log(message));
    await ffmpeg.load({
      coreURL: `${baseURL}ffmpeg-core.js`,
      wasmURL: `${baseURL}ffmpeg-core.wasm`,
    });
  };

  const captureFrame = (): string => {
    return gl.domElement.toDataURL('image/jpeg', 0.92);
  };

  const encodeFramesToVideo = async (ext: 'mp4' | 'mov') => {
    const ffmpeg = ffmpegRef.current;
    await load();

    // Convert base64 strings to blobs and write them to ffmpeg FS
    for (let i = 0; i < capturedFrames.current.length; i++) {
      const dataURL = capturedFrames.current[i];
      // Convert base64 URL to Uint8Array
      const res = await fetch(dataURL);
      const blob = await res.blob();
      await ffmpeg.writeFile(`input${String(i).padStart(3, '0')}.jpg`, await fetchFile(blob));
    }

    // Input pattern with .jpg extension now
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
    const stream = gl.domElement.captureStream(fps);
    const webmSupported = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus');
    const useMediaRecorder = viewerState.recordedVideoFormat === 'webm' && webmSupported;

    const recorder = useMediaRecorder ? new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' }) : null;
    const recordedChunks: Blob[] = [];

    if (recorder) {
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };
    }

    const startRecording = () => {
      viewerState.setIsRecordingVideo(true);
      enqueueSnackbar(t('snackbars.recording_video'), {
        variant: 'info',
        anchorOrigin: { horizontal: 'right', vertical: 'bottom' },
        persist: true
      });

      if (useMediaRecorder && recorder) {
        recorder.start();
      } else {
        capturedFrames.current = [];
        isRecordingRef.current = true;

        let frameCount = 0;
        const startTime = performance.now();
        let lastCaptureTime = startTime;

        const captureLoop = async () => {
          const loop = async () => {
            if (!isRecordingRef.current) {
              const endTime = performance.now();
              const durationSec = (endTime - startTime) / 1000;
              const realFps = frameCount / durationSec;
              console.log(`Recording stopped.`);
              console.log(`Duration: ${durationSec.toFixed(2)} seconds`);
              console.log(`Frames captured: ${frameCount}`);
              console.log(`Real framerate: ${realFps.toFixed(2)} fps`);
              return;
            }

            const now = performance.now();
            const timeSinceLastCapture = now - lastCaptureTime;
            const frameDuration = 1000 / fps;

            if (timeSinceLastCapture >= frameDuration) {
              lastCaptureTime = now;
              const frameDataURL = captureFrame();
              capturedFrames.current.push(frameDataURL);
              frameCount++;
            }

            requestAnimationFrame(loop);
          };

          requestAnimationFrame(loop);
        };

        captureLoop();
      }
    };


    const stopRecording = async () => {
      closeSnackbar();
      viewerState.setIsRecordingVideo(false);

      if (useMediaRecorder && recorder) {
        recorder.stop();
        recorder.onstop = async () => {
          const blob = new Blob(recordedChunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          downloadVideo(url, `${viewerState.recordedVideoName}.webm`);
        };
      } else {
        isRecordingRef.current = false;
        enqueueSnackbar(t('snackbars.processing_video'), { variant: 'info', anchorOrigin: { horizontal: 'right', vertical: 'bottom' }, persist: true });
        viewerState.setIsProcessingVideo(true);

        try {
          const ext = viewerState.recordedVideoFormat as 'mp4' | 'mov';
          const url = await encodeFramesToVideo(ext);
          downloadVideo(url, `${viewerState.recordedVideoName}.${ext}`);
        } catch (e) {
          console.error(e);
        }

        viewerState.setIsProcessingVideo(false);
        closeSnackbar();
      }
    };

    props.videoRecorderRef.current = { startRecording, stopRecording };
  }, [props.videoRecorderRef, gl.domElement, enqueueSnackbar, closeSnackbar, t, viewerState]);

  return null;
}


export default observer(VideoRecorder);