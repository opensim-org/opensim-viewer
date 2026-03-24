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

// Extend Navigator interface to include deviceMemory
interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

type VideoRecorderRef = {
  startRecording: () => void;
  stopRecording: () => void;
};

type VideoRecorderViewProps = {
  videoRecorderRef: React.MutableRefObject<VideoRecorderRef | null>;
};

type VideoFormat = 'mp4' | 'mov' | 'webm' | 'gif' | 'zip';

// Type for FFmpeg error event
interface FFmpegErrorEvent {
  message: string;
  type?: string;
}

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

  // Check if local file exists
  const checkLocalFileExists = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url);
      return response.ok;
    } catch (error) {
      console.warn(`Failed to check local file ${url}:`, error);
      return false;
    }
  };

  // Load FFmpeg once and track loading state
  const loadFFmpeg = async (): Promise<boolean> => {
    if (ffmpegLoadedRef.current) return true;

    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message }: { message: string }) => console.log('[FFmpeg]', message));

    // FFmpeg doesn't have an error event, but we can catch errors in the exec calls

    try {
      if (!ffmpeg.loaded) {
        // Check local files first
        console.log('Checking for local FFmpeg files...');
        const localCoreExists = await checkLocalFileExists('/ffmpeg/ffmpeg-core.js');
        const localWasmExists = await checkLocalFileExists('/ffmpeg/ffmpeg-core.wasm');

        console.log('Local files status:', {
          core: localCoreExists ? 'Yes' : 'No',
          wasm: localWasmExists ? 'Yes' : 'No'
        });


        const baseUrl = window.location.origin;
        const localCoreUrl = `${baseUrl}/ffmpeg/ffmpeg-core.js`;
        const localWasmUrl = `${baseUrl}/ffmpeg/ffmpeg-core.wasm`;


        // Try local files if they exist
        if (localCoreExists && localWasmExists) {
          try {
            if (curState.debug) {
              enqueueSnackbar('Loading video encoder from local files...', {
                variant: 'info',
                autoHideDuration: 2000
              });
            }

            await ffmpeg.load({
              coreURL: localCoreUrl,
              wasmURL: localWasmUrl,
            });

            ffmpegLoadedRef.current = true;
            console.log('FFmpeg loaded successfully from local files');


            if (curState.debug) {
              enqueueSnackbar('Video encoder loaded successfully (local)', {
                variant: 'success',
                autoHideDuration: 3000
              });
            }
            return true;
          } catch (localError) {
            console.error('Local files found but failed to load:', localError);

            if (curState.debug) {
              enqueueSnackbar('Local video encoder files found but failed to load. Trying CDN fallback...', {
                variant: 'warning',
                autoHideDuration: 10000
              });
            }
          }
        } else {
          if (curState.debug) {
            enqueueSnackbar('Local video encoder files not found at ' + localCoreUrl + ' Downloading from CDN...', {
              variant: 'info',
              autoHideDuration: 5000
            });
          }
        }

        // Fallback to CDN
        console.log('Loading FFmpeg from CDN fallback...');

        // Try multiple CDN sources
        const cdnSources = [
          {
            name: 'unpkg',
            coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd/ffmpeg-core.js',
            wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd/ffmpeg-core.wasm',
          },
          {
            name: 'jsdelivr',
            coreURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.2/dist/umd/ffmpeg-core.js',
            wasmURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.2/dist/umd/ffmpeg-core.wasm',
          }
        ];

        let cdnLoaded = false;
        for (const source of cdnSources) {
          try {
            console.log(`Attempting to load from ${source.name}...`);
            await ffmpeg.load({
              coreURL: source.coreURL,
              wasmURL: source.wasmURL,
            });
            cdnLoaded = true;
            ffmpegLoadedRef.current = true;
            console.log(`FFmpeg loaded successfully from ${source.name}`);

            if (curState.debug) {
              enqueueSnackbar(`Video encoder loaded from ${source.name}`, {
                variant: 'success',
                autoHideDuration: 3000
              });
            }
            break;
          } catch (cdnError) {
            console.warn(`Failed to load from ${source.name}:`, cdnError);
          }
        }

        if (!cdnLoaded) {
          throw new Error('All CDN sources failed to load');
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to load FFmpeg from all sources:', error);

      if (curState.debug) {
        enqueueSnackbar('Failed to load video encoder. Please check your internet connection and try again.', {
          variant: 'error',
          autoHideDuration: 10000,
          persist: false
        });
      }
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
        enqueueSnackbar('Invalid video dimensions for capture', {
          variant: 'error',
          autoHideDuration: 10000
        });
        return null;
      }

      // Check if context is lost
      if (ctx.isContextLost()) {
        console.error('WebGL context lost');

        if (curState.debug) {
          enqueueSnackbar('WebGL context lost during recording', {
            variant: 'error',
            autoHideDuration: 10000
          });
        }
        return null;
      }

      // Check max texture size
      const maxTextureSize = ctx.getParameter(ctx.MAX_TEXTURE_SIZE);
      if (width > maxTextureSize || height > maxTextureSize) {
        console.error(`Dimensions (${width}x${height}) exceed max texture size (${maxTextureSize})`);
        enqueueSnackbar(`Video dimensions too large for this device (max: ${maxTextureSize}px)`, {
          variant: 'error',
          autoHideDuration: 10000
        });
        return null;
      }

      const buffer = new Uint8Array(width * height * 4);
      ctx.readPixels(0, 0, width, height, ctx.RGBA, ctx.UNSIGNED_BYTE, buffer);

      // Validate buffer (check if all zeros)
      let hasData = false;
      for (let i = 0; i < buffer.length; i += 4) {
        if (buffer[i] !== 0 || buffer[i+1] !== 0 || buffer[i+2] !== 0) {
          hasData = true;
          break;
        }
      }

      if (!hasData) {
        console.error('Captured frame is all black/empty');
        return null;
      }

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
      enqueueSnackbar(`Frame capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        variant: 'error',
        autoHideDuration: 10000
      });
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

    // Add validation for reasonable frame count
    const MAX_FRAMES = 3000; // ~100 seconds at 30fps
    if (capturedFrames.current.length > MAX_FRAMES) {
      throw new Error(`Too many frames (${capturedFrames.current.length}). Maximum supported: ${MAX_FRAMES}`);
    }

    // Check device memory with type-safe approach
    const navigatorWithMemory = navigator as NavigatorWithMemory;
    if (navigatorWithMemory.deviceMemory && navigatorWithMemory.deviceMemory < 4) {
      enqueueSnackbar('Low device memory detected. Encoding may be slow or fail.', {
        variant: 'warning',
        autoHideDuration: 10000
      });
    }

    const ffmpeg = ffmpegRef.current;
    const loaded = await loadFFmpeg();
    if (!loaded) throw new Error('FFmpeg not loaded');

    try {
      // Write frames to FFmpeg
      for (let i = 0; i < capturedFrames.current.length; i++) {
        const response = await fetch(capturedFrames.current[i]);
        const blob = await response.blob();

        // Check blob size
        if (blob.size === 0) {
          throw new Error(`Frame ${i} is empty`);
        }

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
      enqueueSnackbar(`Encoding error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        variant: 'error',
        autoHideDuration: 10000
      });
      throw error;
    }
  };

  const encodeFramesToGif = async () => {
    if (capturedFrames.current.length === 0) {
      throw new Error('No frames captured');
    }

    const MAX_FRAMES = 500; // GIFs have lower limit
    if (capturedFrames.current.length > MAX_FRAMES) {
      throw new Error(`Too many frames for GIF (${capturedFrames.current.length}). Maximum supported: ${MAX_FRAMES}`);
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

      let fps = viewerState.recordedVideoFPS || 30;

      if (fps == 30)
        fps = 25
      if (fps == 60)
        fps = 50

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
      enqueueSnackbar(`GIF encoding error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        variant: 'error',
        autoHideDuration: 10000
      });
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

  const getSupportedFormat = (desiredFormat: VideoFormat): VideoFormat => {
    const video = document.createElement('video');

    const formatSupport: Record<VideoFormat, boolean> = {
      mp4: true,
      mov: true,
      webm: false,
      gif: true,
      zip: true
    };

    if (formatSupport[desiredFormat]) {
      return desiredFormat;
    }

    if (desiredFormat === 'mp4' || desiredFormat === 'mov') {
      if (formatSupport.webm) {
        enqueueSnackbar(`${desiredFormat.toUpperCase()} not supported, falling back to MP4`, {
          variant: 'warning',
          autoHideDuration: 10000
        });
        return 'mp4';
      }
    }

    enqueueSnackbar(`No video format supported, falling back to ZIP of frames`, {
      variant: 'warning',
      autoHideDuration: 10000
    });
    return 'zip';
  };

  useEffect(() => {
    // Pre-load FFmpeg
    loadFFmpeg().then(loaded => {
      if (loaded) {
        console.log('FFmpeg pre-loaded successfully');
      }
    });

    gl.setClearColor(0xffffff, 1);

    const startRecording = async () => {
      const current = viewerState.currentAnimationIndices;
      if (current[0] === -1) {
        enqueueSnackbar(t('snackbars.no_animation_selected'), {
          variant: 'error',
          autoHideDuration: 10000
        });
        return;
      }

      // Check if FFmpeg is loaded
      if (!ffmpegLoadedRef.current) {
        enqueueSnackbar('Video encoder not ready yet. Please try again in a moment.', {
          variant: 'warning',
          autoHideDuration: 10000
        });
        return;
      }

      // Cleanup ffmpeg directory
      try {
        const files = await ffmpegRef.current.listDir('/');
        for (const file of files) {
          if (file.name.startsWith('input') || file.name.startsWith('gif')) {
            await ffmpegRef.current.deleteFile(file.name);
          }
        }
      } catch {}

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

      // Speed from currentState
      const animationSpeed = curState.guiAnimationSpeed;

      let effectiveDuration = animationDurationRef.current;
      let effectiveFps = fps;

      if (viewerState.recordedVideoFormat == "gif") {
        if (effectiveFps == 30)
          effectiveFps = 25
        if (effectiveFps == 60)
          effectiveFps = 50
      }

      if (animationSpeed > 0) {
        // Adjust duration based on speed
        effectiveDuration = animationDurationRef.current / animationSpeed;
      } else {
        // Speed is 0. Cancel recording.
        console.warn('Animation speed is 0, recording may not work as expected');
        enqueueSnackbar('Animation speed is 0. Recording canceled.', {
          variant: 'warning',
          autoHideDuration: 10000
        });
        stopRecording();
        return
      }

      // Calculate total frames based on effective duration
      const totalFrames = Math.ceil(effectiveDuration * effectiveFps);

      // Validate total frames
      if (totalFrames > 5000) {
        enqueueSnackbar(`Recording ${totalFrames} frames may take a while and use significant memory`, {
          variant: 'warning',
          autoHideDuration: 10000
        });
      }

      viewerState.setIsRecordingVideo(true);

      curState.viewerState.animationChange = {index: 0, operation: "start"};
      curState.viewerState.setAnimationsNeedUpdate(true);

      enqueueSnackbar(t('snackbars.recording_video'), {
        variant: 'info',
        persist: true,
        autoHideDuration: 10000
      });

      capturedFrames.current = [];
      isRecordingRef.current = true;

      let frameCount = 0;
      let captureErrors = 0;
      const MAX_ERRORS = 5;

      const loop = async () => {
        while (isRecordingRef.current && frameCount < totalFrames && captureErrors < MAX_ERRORS) {
          // Calculate animation time based on speed
          const animationTime = (frameCount / effectiveFps) * animationSpeed;

          // Clamp to animation duration to avoid going beyond
          const clampedTime = Math.min(animationTime, animationDurationRef.current);

          // Set animation time
          viewerState.setCurrentAnimationTime(clampedTime);

          // Calculate progress percentage based on actual frames captured vs total frames we expect to capture
          const progressPercent = (frameCount / totalFrames) * 100;
          curState.setCurrentFrame(progressPercent);

          // Wait for rendering to complete
          await waitForNextFrame();

          // Capture frame
          const frame = captureFrameReadPixels();
          if (frame) {
            capturedFrames.current.push(frame);
            frameCount++;

            // Log progress
            if (frameCount % 10 === 0) {
              console.log(`Captured ${frameCount}/${totalFrames} frames (speed: ${animationSpeed}x)`);
            }
          } else {
            captureErrors++;
            console.error(`Frame capture failed (${captureErrors}/${MAX_ERRORS})`);
          }
        }

        stopRecording();
      };

      loop();
    };

    const stopRecording = async () => {
      if (!isRecordingRef.current) return;

      closeSnackbar();
      isRecordingRef.current = false;

      enqueueSnackbar(t('snackbars.processing_video'), {
        variant: 'info',
        persist: true,
        autoHideDuration: 10000
      });
      viewerState.setIsRecordingVideo(false);
      viewerState.setIsProcessingVideo(true);

      try {
        if (capturedFrames.current.length === 0) {
          throw new Error('No frames were captured');
        }

        // Get WebGL vendor info safely
        let webglVendor = 'unknown';
        try {
          webglVendor = gl.getContext().getParameter(gl.getContext().VENDOR);
        } catch (e) {
          console.warn('Could not get WebGL vendor');
        }

        // Get device memory safely
        const navigatorWithMemory = navigator as NavigatorWithMemory;

        // Log debug info
        console.debug('Recording stats:', {
          frameCount: capturedFrames.current.length,
          firstFrameSize: capturedFrames.current[0]?.length,
          format: viewerState.recordedVideoFormat,
          fps: viewerState.recordedVideoFPS,
          webglContext: webglVendor,
          browser: navigator.userAgent,
          memory: navigatorWithMemory.deviceMemory,
          ffmpegLoaded: ffmpegLoadedRef.current
        });

        const desiredFormat = viewerState.recordedVideoFormat as VideoFormat;
        const format = getSupportedFormat(desiredFormat);
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
          enqueueSnackbar(`Export successful: ${capturedFrames.current.length} frames`, {
            variant: 'success',
            autoHideDuration: 10000
          });
        }
      } catch (e) {
        console.error('Export error:', e);
        const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
        enqueueSnackbar(`Error processing export: ${errorMessage}`, {
          variant: 'error',
          autoHideDuration: 10000
        });
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

  }, [props.videoRecorderRef, gl, camera, size, enqueueSnackbar, closeSnackbar, t, viewerState, curState]);

  return null;
}

export default observer(VideoRecorder);