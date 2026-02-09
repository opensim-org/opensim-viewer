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
import { PerspectiveCamera } from 'three';
import JSZip from 'jszip';

type VideoRecorderRef = {
  startRecording: () => void;
  stopRecording: () => void;
};

type VideoRecorderViewProps = {
  videoRecorderRef: React.MutableRefObject<VideoRecorderRef | null>;
};

// Aspect ratio utility functions
const parseAspectRatio = (aspectRatio: string): { width: number; height: number } => {
  const [widthStr, heightStr] = aspectRatio.split(':');
  return {width: parseInt(widthStr, 10), height: parseInt(heightStr, 10) };
};

const ensureEvenDimensions = (width: number, height: number) => ({
  width: width % 2 === 0 ? width : width - 1,
  height: height % 2 === 0 ? height : height - 1
});

type VideoFormat = 'mp4' | 'mov' | 'webm' | 'gif' | 'zip';

function VideoRecorder(props: VideoRecorderViewProps) {
  const { t } = useTranslation();
  const viewerState = useModelContext().viewerState;
  const { gl, size, camera } = useThree();
  const curState = useModelContext();

  const ffmpegRef = useRef(new FFmpeg());
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const capturedFrames = useRef<string[]>([]);
  const isRecordingRef = useRef(false);
  const animationDurationRef = useRef(0);

  const originalCameraAspectRef = useRef<number | null>(null);
  const originalRendererSizeRef = useRef<{ width: number; height: number } | null>(null);

  const load = async () => {
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message }) => console.log(message));
    if (!ffmpeg.loaded) {
      await ffmpeg.load({
        coreURL: '/ffmpeg/ffmpeg-core.js',
        wasmURL: '/ffmpeg/ffmpeg-core.wasm',
      });
    }
  };

  const getTargetDimensions = () => {
//    if (viewerState.recordedVideoAspectRatio) {
//      const { width: rw, height: rh } = parseAspectRatio(viewerState.recordedVideoAspectRatio);
//      const aspect = rw / rh;
//      const base = viewerState.videoRecorderBaseDimension || 720;
//
//      if (rw >= rh) {
//        return ensureEvenDimensions(base, Math.round(base / aspect));
//      }
//      return ensureEvenDimensions(Math.round(base * aspect), base);
//    }

    return { width: gl.domElement.width, height: gl.domElement.height };
  };

  const setupCameraAndRendererForRecording = () => {
    const cam = camera as PerspectiveCamera;

    originalCameraAspectRef.current = cam.aspect;
    originalRendererSizeRef.current = { width: size.width, height: size.height };

    const { width, height } = getTargetDimensions();

    cam.aspect = width / height;
    cam.updateProjectionMatrix();

    cam.matrixAutoUpdate = false;

    gl.setSize(width, height, false);
    gl.setPixelRatio(1);

    return { width, height };
  };

  const restoreCameraAndRenderer = () => {
    if (originalCameraAspectRef.current !== null) {
      const cam = camera as PerspectiveCamera;
      cam.matrixAutoUpdate = true;
      cam.aspect = originalCameraAspectRef.current;
      cam.updateProjectionMatrix();
    }

    if (originalRendererSizeRef.current) {
      gl.setSize(originalRendererSizeRef.current.width, originalRendererSizeRef.current.height, false);
    }
  };

  const captureFrameReadPixels = (): string => {
    const ctx = gl.getContext();
    const { width, height } = getTargetDimensions();

    const buffer = new Uint8Array(width * height * 4);
    ctx.readPixels(0, 0, width, height, ctx.RGBA, ctx.UNSIGNED_BYTE, buffer);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const c2d = canvas.getContext('2d')!;
    const img = c2d.createImageData(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const src = ((height - y - 1) * width + x) * 4;
        const dst = (y * width + x) * 4;
        img.data[dst] = buffer[src];
        img.data[dst + 1] = buffer[src + 1];
        img.data[dst + 2] = buffer[src + 2];
        img.data[dst + 3] = 255;
      }
    }

    c2d.putImageData(img, 0, 0);
    return canvas.toDataURL('image/jpeg', 1.0);
  };

  const encodeFramesToVideo = async (ext: 'mp4' | 'mov' | 'webm') => {
    const ffmpeg = ffmpegRef.current;
    await load();

    for (let i = 0; i < capturedFrames.current.length; i++) {
      const blob = await (await fetch(capturedFrames.current[i])).blob();
      await ffmpeg.writeFile(`input${String(i).padStart(3, '0')}.jpg`, await fetchFile(blob));
    }

    const fps = viewerState.recordedVideoFPS || 30;

    const args = ['-framerate', `${fps}`, '-i', 'input%03d.jpg', '-r', `${fps}`];

    if (ext === 'webm') {
      args.push('-c:v', 'libvpx', '-b:v', '4M');
    } else {
      args.push('-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p');
    }

    args.push('-y', `output.${ext}`);
    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(`output.${ext}`);
    return URL.createObjectURL(new Blob([data], { type: `video/${ext}` }));
  };

  const encodeFramesToGif = async () => {
    const ffmpeg = ffmpegRef.current;
    await load();

    for (let i = 0; i < capturedFrames.current.length; i++) {
      const blob = await (await fetch(capturedFrames.current[i])).blob();
      await ffmpeg.writeFile(`gif${String(i).padStart(3, '0')}.jpg`, await fetchFile(blob));
    }

    const fps = viewerState.recordedVideoFPS || 30;

    await ffmpeg.exec(['-framerate', `${fps}`, '-i', 'gif%03d.jpg', '-vf', 'palettegen', 'palette.png']);
    await ffmpeg.exec([
      '-framerate', `${fps}`,
      '-i', 'gif%03d.jpg',
      '-i', 'palette.png',
      '-lavfi', 'paletteuse',
      '-y', 'output.gif'
    ]);

    const data = await ffmpeg.readFile('output.gif');
    return URL.createObjectURL(new Blob([data], { type: 'image/gif' }));
  };

  const encodeFramesToZip = async () => {
    const zip = new JSZip();

    for (let i = 0; i < capturedFrames.current.length; i++) {
      const blob = await (await fetch(capturedFrames.current[i])).blob();
      zip.file(`frame_${String(i).padStart(4, '0')}.jpg`, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return URL.createObjectURL(zipBlob);
  };

  const downloadFile = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    // Ensure the renderer clears to white for MediaRecorder path
    gl.setClearColor(0xffffff, 1);

    const startRecording = () => {
      const current = viewerState.currentAnimationIndices;
      if (current[0] === -1) {
        enqueueSnackbar(t('snackbars.no_animation_selected'), { variant: 'error' });
        return;
      }

      const animation = viewerState.animations[current[0]];
      animationDurationRef.current = animation.duration;

      // setupCameraAndRendererForRecording();

      setTimeout(startCaptureProcess, 100);
    };

    const startCaptureProcess = () => {
      const fps = viewerState.recordedVideoFPS || 30;
      const totalFrames = Math.ceil(animationDurationRef.current * fps);

      viewerState.setIsRecordingVideo(true);

      curState.viewerState.animationChange = {index:0, operation:"start"};
      curState.viewerState.setAnimationsNeedUpdate(true)
      enqueueSnackbar(t('snackbars.recording_video'), { variant: 'info', persist: true });

      capturedFrames.current = [];
      isRecordingRef.current = true;

      let frameCount = 0;

      const loop = async () => {
        while (isRecordingRef.current && frameCount < totalFrames) {
          viewerState.setCurrentAnimationTime(frameCount / fps);
          curState.setCurrentFrame((frameCount / totalFrames) * 100);

          capturedFrames.current.push(captureFrameReadPixels());
          frameCount++;

          await new Promise<void>(r => requestAnimationFrame(() => r()));
        }

        stopRecording();
      };

      loop();
    };

    const stopRecording = async () => {
      if (!isRecordingRef.current) return;

      closeSnackbar();
      isRecordingRef.current = false;

      // restoreCameraAndRenderer();

      enqueueSnackbar(t('snackbars.processing_video'), { variant: 'info', persist: true });
      viewerState.setIsRecordingVideo(false);
      viewerState.setIsProcessingVideo(true);

      try {
        const format = viewerState.recordedVideoFormat as VideoFormat;

        const timestamp = getTimestamp();

        let url = '';

        if (format === 'gif') {
          url = await encodeFramesToGif();
        }
        else if (format === 'zip') {
          url = await encodeFramesToZip();
        }
        else if (format === 'mp4' || format === 'mov' || format === 'webm') {
          url = await encodeFramesToVideo(format);
        }
        else {
          throw new Error(`Unsupported format: ${format}`);
        }

        downloadFile(url, `${viewerState.recordedVideoName}_${timestamp}.${format}`);
      } catch (e) {
        console.error(e);
        enqueueSnackbar("Error processing export", { variant: 'error' });
      }

      capturedFrames.current = [];
      viewerState.setIsProcessingVideo(false);
      closeSnackbar();

      viewerState.setCurrentAnimationTime(0);
      curState.setCurrentFrame(0);
    };

    props.videoRecorderRef.current = { startRecording, stopRecording };
  }, [props.videoRecorderRef, gl, camera, size, enqueueSnackbar, closeSnackbar, t, viewerState, curState]);

  return null;
}

export default observer(VideoRecorder);
