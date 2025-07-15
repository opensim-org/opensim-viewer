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

function VideoRecorder(props :VideoRecorderViewProps) {
  const { t } = useTranslation();
  const viewerState = useModelContext().viewerState;
  const { gl } = useThree();
  const curState = useModelContext();
  
  const ffmpegRef = useRef(new FFmpeg());
  const { enqueueSnackbar, closeSnackbar  } = useSnackbar();

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
    await ffmpeg.exec(['-i', 'input.webm', '-r', '60', "-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "17", "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2", 'video.mp4']);
    const data = await ffmpeg.readFile('video.mp4');
    const urlMp4 = URL.createObjectURL(new Blob([data], {type: 'video/mp4'}));
    return urlMp4;
  }

  const transcodeMov = async (url:string) => {
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile('input.webm', await fetchFile(url));
    await ffmpeg.exec(['-i', 'input.webm', '-r', '60', "-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "17", "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2", 'video.mov']);
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
      curState.viewerState.setIsRecordingVideo(true)
      enqueueSnackbar(t('snackbars.recording_video'), {variant: 'info', anchorOrigin: { horizontal: "right", vertical: "bottom"}, persist: true})
      recorder.start();
    };

    const stopRecording = function() {
      recorder.stop()
      closeSnackbar()
      const viewerState = curState.viewerState
      viewerState.setIsRecordingVideo(false)
      recorder.addEventListener('dataavailable', async (evt) => {
        const url = URL.createObjectURL(evt.data);
        // If not webm, convert to format.
        if (viewerState.recordedVideoFormat === "webm") {
          downloadVideo(url, viewerState.recordedVideoName + "." + viewerState.recordedVideoFormat )
        } else {
          enqueueSnackbar(t('snackbars.processing_video'), {variant: 'info', anchorOrigin: { horizontal: "right", vertical: "bottom" }, persist: true})
          viewerState.setIsProcessingVideo(true)
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
        viewerState.setIsProcessingVideo(false)
        closeSnackbar()
      });
    };

    props.videoRecorderRef.current = {
      startRecording,
      stopRecording,
    };
  }, [props.videoRecorderRef, gl.domElement, enqueueSnackbar, closeSnackbar, t, viewerState]);

  return null;
}

export default observer(VideoRecorder);