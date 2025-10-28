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
  return {
    width: parseInt(widthStr, 10),
    height: parseInt(heightStr, 10)
  };
};

const calculateDimensionsFromAspectRatio = (
  baseDimension: number,
  aspectRatio: string,
  useWidthAsBase: boolean = true
): { width: number; height: number } => {
  const { width: ratioW, height: ratioH } = parseAspectRatio(aspectRatio);
  const aspect = ratioW / ratioH;

  if (useWidthAsBase) {
    return {
      width: baseDimension,
      height: Math.round(baseDimension / aspect)
    };
  } else {
    return {
      width: Math.round(baseDimension * aspect),
      height: baseDimension
    };
  }
};

const ensureEvenDimensions = (width: number, height: number): { width: number; height: number } => {
  return {
    width: width % 2 === 0 ? width : width - 1,
    height: height % 2 === 0 ? height : height - 1
  };
};

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
  const startAnimationTimeRef = useRef(0);

  const originalCameraAspectRef = useRef<number | null>(null);
  const originalCameraFovRef = useRef<number | null>(null);
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

  const getTargetDimensions = (): { width: number; height: number } => {
    const glCanvas = gl.domElement;

    // Always use aspect ratio to determine dimensions
    if (viewerState.recordedVideoAspectRatio) {
      const { width: ratioW, height: ratioH } = parseAspectRatio(viewerState.recordedVideoAspectRatio);
      const aspect = ratioW / ratioH;

      // Use base dimension as the primary dimension
      const baseDimension = viewerState.videoRecorderBaseDimension || 720;

      // For landscape (width >= height), prioritize width
      // For portrait (height > width), prioritize height
      if (ratioW >= ratioH) {
        // Landscape or square - prioritize width
        const width = baseDimension;
        const height = Math.round(width / aspect);
        return ensureEvenDimensions(width, height);
      } else {
        // Portrait - prioritize height
        const height = baseDimension;
        const width = Math.round(height * aspect);
        return ensureEvenDimensions(width, height);
      }
    }

    // Fallback: use canvas dimensions
    return {
      width: glCanvas.width,
      height: glCanvas.height
    };
  };

  const setupCameraAndRendererForRecording = () => {
    const perspectiveCamera = camera as PerspectiveCamera;

    // Save original state
    originalCameraAspectRef.current = perspectiveCamera.aspect;
    originalCameraFovRef.current = perspectiveCamera.fov;
    originalRendererSizeRef.current = { width: size.width, height: size.height };

    // Get target dimensions for recording
    const { width: targetW, height: targetH } = getTargetDimensions();
    const { width: evenW, height: evenH } = ensureEvenDimensions(targetW, targetH);

    console.log(`Setting up recording: ${evenW}x${evenH}, aspect ratio: ${viewerState.recordedVideoAspectRatio}`);

    // Update camera aspect ratio and projection matrix
    perspectiveCamera.aspect = evenW / evenH;
    perspectiveCamera.updateProjectionMatrix();

    // Update renderer size
    gl.setSize(evenW, evenH, false);
    gl.setPixelRatio(1); // Ensure crisp rendering at exact dimensions

    return { width: evenW, height: evenH };
  };

  const restoreCameraAndRenderer = () => {
    if (originalCameraAspectRef.current !== null) {
      const perspectiveCamera = camera as PerspectiveCamera;

      perspectiveCamera.aspect = originalCameraAspectRef.current;
      perspectiveCamera.updateProjectionMatrix();

      originalCameraAspectRef.current = null;
    }

    if (originalRendererSizeRef.current) {
      gl.setSize(originalRendererSizeRef.current.width, originalRendererSizeRef.current.height, false);
      originalRendererSizeRef.current = null;
    }
  };

  const captureFrameReadPixels = (): string => {
    const glCanvas = gl.domElement;
    const { width: targetW, height: targetH } = getTargetDimensions();
    const { width: evenW, height: evenH } = ensureEvenDimensions(targetW, targetH);

    // Create offscreen canvas for rendering
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = evenW;
    compositeCanvas.height = evenH;
    const ctx = compositeCanvas.getContext('2d')!;

    // Set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, evenW, evenH);

    // Draw the WebGL canvas content
    ctx.drawImage(glCanvas, 0, 0, evenW, evenH);

    // Encode as JPEG (no alpha)
    return compositeCanvas.toDataURL('image/jpeg', 0.92);
  };

  const encodeFramesToVideo = async (ext: 'mp4' | 'mov' | 'webm') => {
    const ffmpeg = ffmpegRef.current;
    await load();

    const { width: targetW, height: targetH } = getTargetDimensions();
    const { width: evenW, height: evenH } = ensureEvenDimensions(targetW, targetH);

    console.log(`Encoding video at ${evenW}x${evenH} (aspect ratio: ${viewerState.recordedVideoAspectRatio})`);

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

    // Write all frames to FFmpeg
    for (let i = 0; i < capturedFrames.current.length; i++) {
      const dataURL = capturedFrames.current[i];
      const res = await fetch(dataURL);
      const blob = await res.blob();
      await ffmpeg.writeFile(`input${String(i).padStart(3, '0')}.jpg`, await fetchFile(blob));
    }

    const fps = viewerState.recordedVideoFPS || 30;

    // FFmpeg arguments - ensure correct aspect ratio and no distortion
    const args = [
      '-framerate', `${fps}`,
      '-i', 'input%03d.jpg',
      '-r', `${fps}`,
      '-vf', `scale=${evenW}:${evenH}:flags=lanczos:force_original_aspect_ratio=disable`
    ];

    if (ext === 'webm') {
      args.push('-c:v', 'libvpx', '-b:v', '4M', '-pix_fmt', 'yuv420p');
    } else {
      args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '17');
      if (ext === 'mov') args.push('-profile:v', 'high');
    }

    args.push('-y', `output.${ext}`);
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

    const startRecording = () => {
      const fps = viewerState.recordedVideoFPS || 30;
      const frameDuration = 1000 / fps;

      const currentAnimationIndex = viewerState.currentAnimationIndex;
      if (currentAnimationIndex === -1) {
        enqueueSnackbar(t('snackbars.no_animation_selected'), { variant: 'error' });
        return;
      }

      const currentAnimation = viewerState.animations[currentAnimationIndex];
      animationDurationRef.current = currentAnimation.duration;

      // Set up camera and renderer FIRST, before saving original state
      const { width: targetW, height: targetH } = setupCameraAndRendererForRecording();

      console.log(`First recording setup: ${targetW}x${targetH}, aspect: ${viewerState.recordedVideoAspectRatio}`);

      // Give the renderer a moment to complete the resize
      setTimeout(() => {
        startCaptureProcess();
      }, 100);
    };

    const startCaptureProcess = () => {
      const fps = viewerState.recordedVideoFPS || 30;
      const frameDuration = 1000 / fps;
      const totalFrames = Math.ceil(animationDurationRef.current * fps);

      viewerState.setIsRecordingVideo(true);
      viewerState.setAnimating(false);

      enqueueSnackbar(t('snackbars.recording_video'), {
        variant: 'info',
        anchorOrigin: { horizontal: 'right', vertical: 'bottom' },
        persist: true
      });

      capturedFrames.current = [];
      isRecordingRef.current = true;
      startAnimationTimeRef.current = viewerState.currentAnimationTime;

      let frameCount = 0;
      let lastCaptureTime = 0;
      let isCapturing = false;

      const captureAndPush = () => {
        try {
          const frameDataURL = captureFrameReadPixels();
          capturedFrames.current.push(frameDataURL);
          frameCount++;
          console.log(`Captured frame ${frameCount}/${totalFrames}`);
        } catch (e) {
          console.error('Capture failed', e);
        }
      };

      const recordLoop = async () => {
        const startTime = performance.now();
        lastCaptureTime = startTime;

        // CAPTURE THE FIRST FRAME IMMEDIATELY with proper setup
        if (frameCount === 0) {
          viewerState.setCurrentAnimationTime(0);
          curState.setCurrentFrame(0);
          captureAndPush();
          frameCount++;
          lastCaptureTime = performance.now();
        }

        while (isRecordingRef.current && frameCount < totalFrames) {
          const now = performance.now();
          const elapsedTime = now - lastCaptureTime;

          // Wait until next frame is due

          if (elapsedTime < frameDuration) {
            await new Promise<void>(r => requestAnimationFrame(() => r()));
            continue;
          }

          lastCaptureTime = now;
          const currentFrameTime = frameCount / fps;
          viewerState.setCurrentAnimationTime(currentFrameTime);

          // Update frame percentage for UI
          const framePercentage = (currentFrameTime / animationDurationRef.current) * 100;
          curState.setCurrentFrame(Math.min(framePercentage, 100));

          if (!isCapturing) {
            isCapturing = true;
            try {
              captureAndPush();
            } finally {
              isCapturing = false;
            }
          }

          // Check if we've reached the end of the animation
          if (frameCount >= totalFrames) {
            console.log("Animation complete — stopping recording");
            stopRecording();
            break;
          }

          await new Promise<void>(r => requestAnimationFrame(() => r()));
        }

        if (isRecordingRef.current) stopRecording();
      };

      recordLoop();
    };

    const stopRecording = async () => {
      if (!isRecordingRef.current) return;

      closeSnackbar();
      viewerState.setIsRecordingVideo(false);
      viewerState.setAnimating(false);
      isRecordingRef.current = false;

      // Restore original camera and renderer settings
      restoreCameraAndRenderer();

      enqueueSnackbar(t('snackbars.processing_video'), {
        variant: 'info',
        anchorOrigin: { horizontal: 'right', vertical: 'bottom' },
        persist: true
      });
      viewerState.setIsProcessingVideo(true);

      try {
        const ext = viewerState.recordedVideoFormat as 'mp4' | 'mov' | 'webm';
        const url = await encodeFramesToVideo(ext);
        const timestamp = getTimestamp();
        downloadVideo(url, `${viewerState.recordedVideoName}_${timestamp}.${ext}`);
      } catch (e) {
        console.error(e);
        enqueueSnackbar("Error processing video", { variant: 'error' });
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