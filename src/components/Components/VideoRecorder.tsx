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
  const animationDurationRef = useRef(0);
  const startAnimationTimeRef = useRef(0);

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

  const captureFrameReadPixels = (): string => {
    const glCanvas = gl.domElement;
    const preserveAspect = viewerState.videoRecorderPreserveAspectRatio;
    const canvasAspect = glCanvas.width / glCanvas.height;

     // Target resolution from viewerState
    const targetW = viewerState.videoRecorderWidth || glCanvas.width;
    const targetH = preserveAspect ? Math.round(targetW / canvasAspect) : (viewerState.videoRecorderHeight || glCanvas.height);

    // Create offscreen 2D canvas at desired resolution
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = targetW;
    compositeCanvas.height = targetH;
    const ctx = compositeCanvas.getContext('2d')!;

    // Fill with white before drawing WebGL frame
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);

    // Draw WebGL canvas (flattens transparency)
    const glCtx: WebGLRenderingContext | WebGL2RenderingContext = (gl as any).getContext ? (gl as any).getContext() : (gl as any).context;
    if (!glCtx) {
      ctx.drawImage(glCanvas, 0, 0, targetW, targetH);
      return compositeCanvas.toDataURL('image/jpeg', 0.92);
    }

    if (typeof (glCtx as any).finish === 'function') {
      try { (glCtx as any).finish(); } catch (e) {}
    }

    const w = glCanvas.width;
    const h = glCanvas.height;
    const pixels = new Uint8Array(w * h * 4);

    try {
      glCtx.pixelStorei(glCtx.PACK_ALIGNMENT, 1);
      glCtx.readPixels(0, 0, w, h, glCtx.RGBA, glCtx.UNSIGNED_BYTE, pixels);
    } catch (e) {
      console.warn('readPixels failed, fallback to drawImage', e);
      ctx.drawImage(glCanvas, 0, 0, targetW, targetH);
      return compositeCanvas.toDataURL('image/jpeg', 0.92);
    }

    const rowSize = w * 4;
    const flipped = new Uint8ClampedArray(pixels.length);
    for (let y = 0; y < h; y++) {
      const srcStart = y * rowSize;
      const dstStart = (h - 1 - y) * rowSize;
      flipped.set(pixels.subarray(srcStart, srcStart + rowSize), dstStart);
    }

    const tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    const tmpCtx = tmp.getContext('2d')!;
    tmpCtx.putImageData(new ImageData(flipped, w, h), 0, 0);

    ctx.drawImage(tmp, 0, 0, targetW, targetH);

    // Encode as JPEG (no alpha)
    return compositeCanvas.toDataURL('image/jpeg', 0.92);
  };

  const encodeFramesToVideo = async (ext: 'mp4' | 'mov' | 'webm') => {
    const ffmpeg = ffmpegRef.current;
    await load();

    // Clean up any previous files
    const glCanvas = gl.domElement;

    // Determine the same target size used in captureFrame()
    const preserveAspect = viewerState.videoRecorderPreserveAspectRatio;
    const canvasAspect = glCanvas.width / glCanvas.height;

    // Ensure even numbers for YUV420p encoding
    const targetW = viewerState.videoRecorderWidth || glCanvas.width;
    const targetH = preserveAspect
      ? Math.round(targetW / canvasAspect)
      : (viewerState.videoRecorderHeight || glCanvas.height);

    const evenW = targetW % 2 === 0 ? targetW : targetW - 1;
    const evenH = targetH % 2 === 0 ? targetH : targetH - 1;

    // Clean up previous files
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
    const fps = viewerState.recordedVideoFPS || 30;
    const args = [
      '-framerate', `${fps}`,
      '-i', 'input%03d.jpg',
      '-r', `${fps}`,
      '-vf', `scale=${evenW}:${evenH}:force_original_aspect_ratio=decrease,pad=${evenW}:${evenH}:(ow-iw)/2:(oh-ih)/2:white`
    ];

    if (ext === 'webm') {

      // Encoding args webm
      args.push(
        '-c:v', 'libvpx',
        '-b:v', '4M',
        '-pix_fmt', 'yuv420p'
      );
    } else {
      args.push(
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'fast',
        '-crf', '17'
      );
      if (ext === 'mov') args.push('-profile:v', 'high');
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

    const startRecording = () => {
      const fps = viewerState.recordedVideoFPS || 30;
      const frameDuration = 1000 / fps; // ms per frame

      // Get animation duration from current animation
      const currentAnimationIndex = viewerState.currentAnimationIndex;
      if (currentAnimationIndex === -1) {
        enqueueSnackbar(t('snackbars.no_animation_selected'), { variant: 'error' });
        return;
      }

      const currentAnimation = viewerState.animations[currentAnimationIndex];
      animationDurationRef.current = currentAnimation.duration;

      // Calculate total frames needed for the entire animation
      const totalFrames = Math.ceil(animationDurationRef.current * fps);

      console.log(`Recording: ${totalFrames} frames at ${fps} FPS, duration: ${animationDurationRef.current.toFixed(2)}s`);

      viewerState.setIsRecordingVideo(true);
      viewerState.setAnimating(false);

      enqueueSnackbar(t('snackbars.recording_video'), {
        variant: 'info',
        anchorOrigin: { horizontal: 'right', vertical: 'bottom' },
        persist: true,
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
        } catch (e) {
          console.error('Capture failed', e);
        }
      };

      const recordLoop = async () => {
        const startTime = performance.now();
        lastCaptureTime = startTime;

        while (isRecordingRef.current && frameCount < totalFrames) {
          const now = performance.now();
          const elapsedTime = now - lastCaptureTime;

          // Wait until next frame is due
          if (elapsedTime < frameDuration) {
            await new Promise<void>(r => requestAnimationFrame(() => r()));
            continue;
          }

          lastCaptureTime = now;

          // Calculate exact animation time for this frame
          const currentFrameTime = (frameCount / fps);

          // Set the exact animation time
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

        // If we exit the loop for other reasons, stop recording
        if (isRecordingRef.current) {
          stopRecording();
        }

        const endTime = performance.now();
        const durationSec = (endTime - startTime) / 1000;
        const realFps = frameCount / durationSec;
        console.log(`Recording complete. Duration: ${durationSec.toFixed(2)}s, Frames: ${frameCount}, FPS: ${realFps.toFixed(2)}`);
      };

      recordLoop();
    };

    const stopRecording = async () => {
      if (!isRecordingRef.current) return;

      closeSnackbar();
      viewerState.setIsRecordingVideo(false);
      viewerState.setAnimating(false);

      isRecordingRef.current = false;

      enqueueSnackbar(t('snackbars.processing_video'), {
        variant: 'info',
        anchorOrigin: { horizontal: 'right', vertical: 'bottom' },
        persist: true,
      });
      viewerState.setIsProcessingVideo(true);

      try {
        const ext = viewerState.recordedVideoFormat as 'mp4' | 'mov' | 'webm';
        const url = await encodeFramesToVideo(ext);
        const timestamp = getTimestamp();
        downloadVideo(url, `${viewerState.recordedVideoName}_${timestamp}.${ext}`);
      } catch (e) {
        console.error(e);
        enqueueSnackbar("Error:", { variant: 'error' });
      }

      capturedFrames.current = [];
      viewerState.setIsProcessingVideo(false);
      closeSnackbar();

      // Reset animation time to start
      viewerState.setCurrentAnimationTime(0);
      curState.setCurrentFrame(0);
    };

    props.videoRecorderRef.current = { startRecording, stopRecording };

  }, [props.videoRecorderRef, gl.domElement, enqueueSnackbar, closeSnackbar, t, viewerState, curState, gl]);

  return null;
}

export default observer(VideoRecorder);