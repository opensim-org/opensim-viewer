import React, { useState } from 'react';
import InfoIcon from '@mui/icons-material/Info';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next'
import './FloatingControlsPanel.css';
import { ModelInfo } from '../../state/ModelUIState';
import ThreeSixtyTwoToneIcon from '@mui/icons-material/ThreeSixtyTwoTone';
import ZoomOutTwoToneIcon from '@mui/icons-material/ZoomOutTwoTone';
import ZoomInTwoToneIcon from '@mui/icons-material/ZoomInTwoTone';
import ModeTwoToneIcon from '@mui/icons-material/ModeTwoTone';
import PhotoCameraTwoToneIcon from '@mui/icons-material/PhotoCameraTwoTone';
import VideoCameraFrontTwoToneIcon from '@mui/icons-material/VideoCameraFrontTwoTone';
import PauseCircleTwoToneIcon from '@mui/icons-material/PauseCircleTwoTone';
import PlayCircleTwoToneIcon from '@mui/icons-material/PlayCircleTwoTone';
import { useModelContext } from '../../state/ModelUIStateContext';
import viewerState from '../../state/ViewerState';

interface FloatingControlsPanelProps {
  videoRecorderRef: any;
}

function FloatingControlsPanel(props :FloatingControlsPanelProps) {
  const { t } = useTranslation();
  const curState = useModelContext();

  return (
    <div className="floating-buttons-container">


      <Tooltip title={t('bottomBar.zoomIn')}>
        <IconButton color="primary" onClick={() => {
          curState.setZoomFactor(1.1);
          curState.setZooming(true)}}>
            <ZoomInTwoToneIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('bottomBar.zoomOut')}>
        <IconButton color="primary" onClick={() => {
          curState.setZoomFactor(0.9);
          curState.setZooming(true)}}>
            <ZoomOutTwoToneIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('bottomBar.snapshoot')}>
        <IconButton color="primary" onClick={() => {
          curState.setTakeSnapshot();}}>
            <PhotoCameraTwoToneIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('bottomBar.record')}>
        <IconButton
          color={!viewerState.isRecordingVideo && !viewerState.isProcessingVideo ? "primary" : (viewerState.isProcessingVideo ? "warning" : "error")}
          disabled={viewerState.isProcessingVideo}
          onClick={() => {
            if (!viewerState.isRecordingVideo) {
              props.videoRecorderRef.current.startRecording();
            } else {
              props.videoRecorderRef.current.stopRecording();}}
          }>
            <VideoCameraFrontTwoToneIcon />
        </IconButton>
      </Tooltip>
    </div>
  );
};

export default FloatingControlsPanel;
