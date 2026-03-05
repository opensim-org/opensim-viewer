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
  const ffmpegLoadedRef = useRef(false);

  const originalCameraAspectRef = useRef<number | null>(null);
  const originalRendererSizeRef = useRef<{ width: number; height: number } | null>(null);

  // Load FFmpeg once and track loading state
  const loadFFmpeg = async (): Promise<boolean> => {
    if (ffmpegLoadedRef.current) return true;

    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message }) => console.log('[FFmpeg]', message));

    try {
      if (!ffmpeg.loaded) {
        await ffmpeg.load({
          coreURL: '/ffmpeg/ffmpeg-core.js',
          wasmURL: '/ffmpeg/ffmpeg-core.wasm',
        });
      }
      ffmpegLoadedRef.current = true;
      return true;
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      enqueueSnackbar('Failed to load video encoder', { variant: 'error' });
      return false;
    }
  };

  const getTargetDimensions = () => {
    // Return current dimensions for now
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

  const captureFrameReadPixels = (): string | null => {
    try {
      const ctx = gl.getContext();
      const { width, height } = getTargetDimensions();

      // Ensure dimensions are valid
      if (width === 0 || height === 0) {
        console.error('Invalid dimensions for capture');
        return null;
      }

      const buffer = new Uint8Array(width * height * 4);
      ctx.readPixels(0, 0, width, height, ctx.RGBA, ctx.UNSIGNED_BYTE, buffer);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const c2d = canvas.getContext('2d')!;
      const img = c2d.createImageData(width, height);

      // Flip vertically
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
      return canvas.toDataURL('image/jpeg', 0.95);
    } catch (error) {
      console.error('Frame capture failed:', error);
      return null;
    }
  };

  const waitForNextFrame = (): Promise<void> => {
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        // Double rAF to ensure rendering is complete
        requestAnimationFrame(() => resolve());
      });
    });
  };

  const encodeFramesToVideo = async (ext: 'mp4' | 'mov' | 'webm') => {
    if (capturedFrames.current.length === 0) {
      throw new Error('No frames captured');
    }

    const ffmpeg = ffmpegRef.current;
    const loaded = await loadFFmpeg();
    if (!loaded) throw new Error('FFmpeg not loaded');

    try {
      // Write frames to FFmpeg
      for (let i = 0; i < capturedFrames.current.length; i++) {
        const response = await fetch(capturedFrames.current[i]);
        const blob = await response.blob();
        await ffmpeg.writeFile(`input${String(i).padStart(3, '0')}.jpg`, await fetchFile(blob));

        // Progress notification for long recordings
        if (i % 30 === 0) {
          console.log(`Processed ${i}/${capturedFrames.current.length} frames`);
        }
      }

      const fps = viewerState.recordedVideoFPS || 30;

      const args = ['-framerate', `${fps}`, '-i', 'input%03d.jpg', '-r', `${fps}`];

      if (ext === 'webm') {
        args.push('-c:v', 'libvpx', '-b:v', '2M', '-auto-alt-ref', '0');
      } else {
        args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p');
      }

      args.push('-y', `output.${ext}`);

      console.log('Running FFmpeg with args:', args);
      await ffmpeg.exec(args);

      // Check if output file exists
      try {
        const data = await ffmpeg.readFile(`output.${ext}`);
        if (data.length === 0) {
          throw new Error('Output file is empty');
        }
        return URL.createObjectURL(new Blob([data], { type: `video/${ext}` }));
      } catch (readError) {
        console.error('Failed to read output file:', readError);
        throw new Error('Video encoding failed - no output produced');
      }
    } catch (error) {
      console.error('FFmpeg encoding error:', error);
      throw error;
    }
  };

  const encodeFramesToGif = async () => {
    if (capturedFrames.current.length === 0) {
      throw new Error('No frames captured');
    }

    const ffmpeg = ffmpegRef.current;
    const loaded = await loadFFmpeg();
    if (!loaded) throw new Error('FFmpeg not loaded');

    try {
      for (let i = 0; i < capturedFrames.current.length; i++) {
        const response = await fetch(capturedFrames.current[i]);
        const blob = await response.blob();
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
      if (data.length === 0) {
        throw new Error('GIF output is empty');
      }
      return URL.createObjectURL(new Blob([data], { type: 'image/gif' }));
    } catch (error) {
      console.error('GIF encoding error:', error);
      throw error;
    }
  };

  const encodeFramesToZip = async () => {
    if (capturedFrames.current.length === 0) {
      throw new Error('No frames captured');
    }

    const zip = new JSZip();

    for (let i = 0; i < capturedFrames.current.length; i++) {
      const response = await fetch(capturedFrames.current[i]);
      const blob = await response.blob();
      zip.file(`frame_${String(i).padStart(4, '0')}.jpg`, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    if (zipBlob.size === 0) {
      throw new Error('ZIP file is empty');
    }
    return URL.createObjectURL(zipBlob);
  };

  const downloadFile = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  useEffect(() => {
    // Pre-load FFmpeg
    loadFFmpeg();

    gl.setClearColor(0xffffff, 1);

    const startRecording = async () => {
      const current = viewerState.currentAnimationIndices;
      if (current[0] === -1) {
        enqueueSnackbar(t('snackbars.no_animation_selected'), { variant: 'error' });
        return;
      }

      const animation = viewerState.animations[current[0]];
      animationDurationRef.current = animation.duration;

      // Reset to beginning
      viewerState.setCurrentAnimationTime(0);
      curState.setCurrentFrame(0);

      // Wait for animation to reset and render
      await waitForNextFrame();

      startCaptureProcess();
    };

    const startCaptureProcess = () => {
      const fps = viewerState.recordedVideoFPS || 30;
      const totalFrames = Math.ceil(animationDurationRef.current * fps);

      viewerState.setIsRecordingVideo(true);

      curState.viewerState.animationChange = {index: 0, operation: "start"};
      curState.viewerState.setAnimationsNeedUpdate(true);

      enqueueSnackbar(t('snackbars.recording_video'), { variant: 'info', persist: true });

      capturedFrames.current = [];
      isRecordingRef.current = true;

      let frameCount = 0;
      let captureErrors = 0;
      const MAX_ERRORS = 5;

      const loop = async () => {
        while (isRecordingRef.current && frameCount < totalFrames && captureErrors < MAX_ERRORS) {
          // Set animation time
          viewerState.setCurrentAnimationTime(frameCount / fps);
          curState.setCurrentFrame((frameCount / totalFrames) * 100);

          // Wait for rendering to complete
          await waitForNextFrame();

          // Capture frame
          const frame = captureFrameReadPixels();
          if (frame) {
            capturedFrames.current.push(frame);
            frameCount++;

            // Log progress
            if (frameCount % 10 === 0) {
              console.log(`Captured ${frameCount}/${totalFrames} frames`);
            }
          } else {
            captureErrors++;
            console.error(`Frame capture failed (${captureErrors}/${MAX_ERRORS})`);
          }
        }

        if (captureErrors >= MAX_ERRORS) {
          enqueueSnackbar('Too many frame capture errors', { variant: 'error' });
        }

        stopRecording();
      };

      loop();
    };

    const stopRecording = async () => {
      if (!isRecordingRef.current) return;

      closeSnackbar();
      isRecordingRef.current = false;

      enqueueSnackbar(t('snackbars.processing_video'), { variant: 'info', persist: true });
      viewerState.setIsRecordingVideo(false);
      viewerState.setIsProcessingVideo(true);

      try {
        if (capturedFrames.current.length === 0) {
          throw new Error('No frames were captured');
        }

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

        if (url) {
          downloadFile(url, `${viewerState.recordedVideoName}_${timestamp}.${format}`);
          enqueueSnackbar(`Export successful: ${capturedFrames.current.length} frames`, { variant: 'success' });
        }
      } catch (e) {
        console.error('Export error:', e);
        const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
        enqueueSnackbar(`Error processing export: ${errorMessage}`, { variant: 'error' });
      }

      // Cleanup
      capturedFrames.current = [];
      viewerState.setIsProcessingVideo(false);
      closeSnackbar();

      // Reset animation
      viewerState.setCurrentAnimationTime(0);
      curState.setCurrentFrame(0);
    };

    props.videoRecorderRef.current = { startRecording, stopRecording };

    return () => {
      if (isRecordingRef.current) {
        stopRecording();
      }
    };
  }, [props.videoRecorderRef, gl, camera, size, enqueueSnackbar, closeSnackbar, t, viewerState, curState]);

  return null;
}

export default observer(VideoRecorder);