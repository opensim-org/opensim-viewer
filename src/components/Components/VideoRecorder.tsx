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
import { PerspectiveCamera, WebGLRenderer } from 'three';
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

// Aspect ratio utility functions
const parseAspectRatio = (aspectRatio: string): { width: number; height: number } => {
  const [widthStr, heightStr] = aspectRatio.split(':');
  return { width: parseInt(widthStr, 10), height: parseInt(heightStr, 10) };
};

const ensureEvenDimensions = (width: number, height: number) => ({
  width: width % 2 === 0 ? width : width - 1,
  height: height % 2 === 0 ? height : height - 1
});

type VideoFormat = 'mp4' | 'mov' | 'webm' | 'gif' | 'zip';

function VideoRecorder(props: VideoRecorderViewProps) {
  const { t } = useTranslation();
  const viewerState = useModelContext().viewerState;
  const { gl, camera, scene } = useThree();
  const curState = useModelContext();

  const ffmpegRef = useRef(new FFmpeg());
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const capturedFrames = useRef<string[]>([]);
  const isRecordingRef = useRef(false);
  const animationDurationRef = useRef(0);
  const ffmpegLoadedRef = useRef(false);
  const originalUpdateProjectionMatrixRef = useRef<(() => void) | null>(null);

  // Store original camera state
  const originalCameraAspectRef = useRef<number | null>(null);
  const originalCameraMatrixRef = useRef<any>(null);

  // Offscreen renderer
  const offscreenRenderer = useRef<WebGLRenderer | null>(null);

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

  const getBaseDimensions = () => {
    const baseWidth = viewerState.videoRecorderBaseDimension || 1920;

    // Get actual canvas size
    const canvas = gl.domElement;
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;

    // Fallback safety
    if (!canvasWidth || !canvasHeight) {
      return ensureEvenDimensions(baseWidth, baseWidth); // square fallback
    }

    const aspect = canvasWidth / canvasHeight;

    const height = Math.round(baseWidth / aspect);

    return ensureEvenDimensions(baseWidth, height);
  };

  const getTargetAspectRatio = () => {
    const aspectRatio = viewerState.recordedVideoAspectRatio || '16:9';
    const { width, height } = parseAspectRatio(aspectRatio);
    return width / height;
  };

  // Setup offscreen renderer
  const setupOffscreenRenderer = () => {
    const { width, height } = getBaseDimensions();

    // Create offscreen renderer if it doesn't exist
    if (!offscreenRenderer.current) {
      offscreenRenderer.current = new WebGLRenderer({
        preserveDrawingBuffer: true,
        alpha: false,
        antialias: true
      });
    }

    // Set size for offscreen renderer

    offscreenRenderer.current.setSize(width, height);
    offscreenRenderer.current.setPixelRatio(1);
    offscreenRenderer.current.setClearColor(0xffffff, 1);

    return { width, height, renderer: offscreenRenderer.current };
  };

  const makeEven = (n: number) => n % 2 === 0 ? n : n - 1;

  const computeCrop = (baseWidth: number, baseHeight: number) => {
    const targetAspect = getTargetAspectRatio();
    const baseAspect = baseWidth / baseHeight;

    let cropWidth = baseWidth;
    let cropHeight = baseHeight;

    if (baseAspect > targetAspect) {
      cropWidth = baseHeight * targetAspect;
    } else {
      cropHeight = baseWidth / targetAspect;
    }

    cropWidth = makeEven(Math.floor(cropWidth));
    cropHeight = makeEven(Math.floor(cropHeight));

    const offsetX = makeEven(Math.floor((baseWidth - cropWidth) / 2));
    const offsetY = makeEven(Math.floor((baseHeight - cropHeight) / 2));

    return { cropWidth, cropHeight, offsetX, offsetY };
  };

  // Capture frame using offscreen renderer
  const captureFrameOffscreen = (): string | null => {
    try {
      if (!offscreenRenderer.current) return null;

      const { width, height } = getBaseDimensions();

      offscreenRenderer.current.render(scene, camera);

      const ctx = offscreenRenderer.current.getContext();

      const buffer = new Uint8Array(width * height * 4);
      ctx.readPixels(0, 0, width, height, ctx.RGBA, ctx.UNSIGNED_BYTE, buffer);

      // Create base canvas
      const baseCanvas = document.createElement('canvas');
      baseCanvas.width = width;
      baseCanvas.height = height;
      const baseCtx = baseCanvas.getContext('2d')!;
      const img = baseCtx.createImageData(width, height);

      // Flip Y (vertically)
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

      baseCtx.putImageData(img, 0, 0);

      // Crop to target aspect ratio
      const { cropWidth, cropHeight, offsetX, offsetY } =
        computeCrop(width, height);

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = cropWidth;
      finalCanvas.height = cropHeight;

      const finalCtx = finalCanvas.getContext('2d')!;

      finalCtx.drawImage(
        baseCanvas,
        offsetX, offsetY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );

      return finalCanvas.toDataURL('image/png');

    } catch (error) {
      console.error('Frame capture failed:', error);
      return null;
    }
  };

  const waitForNextFrame = async (ensureOffscreenSync: boolean = true): Promise<void> => {
    return new Promise(async resolve => {
      // Wait for main renderer frame
      await new Promise<void>(r => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => r());
        });
      });

      if (ensureOffscreenSync && offscreenRenderer.current) {
        // Force offscreen renderer to render
        offscreenRenderer.current.render(scene, camera);

        // Wait for offscreen renderer's frame
        await new Promise<void>(r => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // Ensure GPU has processed all commands
              const gl = offscreenRenderer.current?.getContext();
              gl?.finish();
              r();
            });
          });
        });
      }

      resolve();
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

        await ffmpeg.writeFile(`input${String(i).padStart(3, '0')}.png`, await fetchFile(blob));

        // Progress notification for long recordings
        if (i % 30 === 0) {
          console.log(`Processed ${i}/${capturedFrames.current.length} frames`);
        }
      }

      const fps = viewerState.recordedVideoFPS || 30;

      const args = ['-framerate', `${fps}`, '-i', 'input%03d.png', '-r', `${fps}`];

      if (ext === 'webm') {
        args.push('-c:v', 'libvpx', '-b:v', '2M', '-auto-alt-ref', '0');
      } else {
        args.push(
          '-c:v', 'libx264',
          '-preset', 'slow',
          '-crf', '16',
          '-pix_fmt', 'yuv420p',
          '-movflags', 'faststart',
          '-profile:v', 'high',
          '-level', '4.2',
          '-vsync', 'cfr'
        );
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
        await ffmpeg.writeFile(`gif${String(i).padStart(3, '0')}.png`, await fetchFile(blob));
      }

      let fps = viewerState.recordedVideoFPS || 30;

      if (fps == 30)
        fps = 25
      if (fps == 60)
        fps = 50

      await ffmpeg.exec(['-framerate', `${fps}`, '-i', 'gif%03d.png', '-vf', 'palettegen', 'palette.png']);
      await ffmpeg.exec([
        '-framerate', `${fps}`,
        '-i', 'gif%03d.png',
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
      zip.file(`frame_${String(i).padStart(4, '0')}.png`, blob);
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
    // Pre-load FFmpeg and setup offscreen renderer
    loadFFmpeg().then(loaded => {
      if (loaded) {
        console.log('FFmpeg pre-loaded successfully');
      }
    });

    // Initialize offscreen renderer
    setupOffscreenRenderer();

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

      const animationIndex = current[0];
      const animation = viewerState.animations[animationIndex];

      if(!animation) {
        enqueueSnackbar(t('snackbars.no_animation_selected'), {
          variant: 'error',
          autoHideDuration: 10000
        });
        return;
      }

      const startTime = viewerState.animationStartTimes[animationIndex] || 0;
      curState.guiAnimationStartTime = startTime; // Reset animation start time
      animationDurationRef.current = animation.duration - startTime; //account for non-zero start

      // Setup offscreen rendering with correct dimensions and aspect ratio
      setupOffscreenRenderer();

      // Reset to beginning
      viewerState.setCurrentAnimationTime(startTime);
      viewerState.forceAnimationUpdate = true;
      curState.setCurrentFrame(0);

      // Wait for animation to reset and render
      await waitForNextFrame(true);

      startCaptureProcess();
    };

    const startCaptureProcess = () => {
      const fps = viewerState.recordedVideoFPS || 30;

      // Speed from currentState
      const animationSpeed = curState.guiAnimationSpeed;

      let effectiveDuration = animationDurationRef.current;
      let effectiveFps = fps;

      if (viewerState.recordedVideoFormat === "gif") {
        if (effectiveFps === 30)
          effectiveFps = 25
        if (effectiveFps === 60)
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
        return;
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
      curState.guiAnimationLoop = false; // Stop any existing loops
      curState.viewerState.animationChange = { index: 0, operation: "start" };
      viewerState.animating = false; // avoid useFrame mixer advancing
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
      const animationIndex = viewerState.currentAnimationIndices[0];
      let animationStartTime = viewerState.animationStartTimes[animationIndex] || 0;

      const loop = async () => {
        while (isRecordingRef.current && frameCount < totalFrames && captureErrors < MAX_ERRORS) {
          // Calculate animation time based on speed
          const animationTime = (frameCount / effectiveFps) * animationSpeed + animationStartTime;

          // Set animation time
          viewerState.setCurrentAnimationTime(animationTime);

          // Calculate progress percentage based on actual frames captured vs total frames we expect to capture
          const progressPercent = (frameCount / totalFrames) * 100;
          curState.setCurrentFrame(progressPercent);

          // Wait for rendering to complete
          await waitForNextFrame(true);

          // Capture frame using offscreen renderer
          const frame = captureFrameOffscreen();
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
      curState.finishRecording();
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
          webglVendor = offscreenRenderer.current?.getContext().getParameter(offscreenRenderer.current.getContext().VENDOR) || 'unknown';
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
          ffmpegLoaded: ffmpegLoadedRef.current,
          dimensions: getBaseDimensions()
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

    // Cleanup function
    return () => {
      // Dispose offscreen renderer
      if (offscreenRenderer.current) {
        offscreenRenderer.current.dispose();
        offscreenRenderer.current = null;
      }
    };
  }, [props.videoRecorderRef, gl, camera, scene, enqueueSnackbar, closeSnackbar, t, viewerState, curState]);

  return null;
}

export default observer(VideoRecorder);