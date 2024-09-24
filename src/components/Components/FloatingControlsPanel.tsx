import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next'
import './FloatingControlsPanel.css';
import InfoIcon from '@mui/icons-material/Info';
import ZoomOutTwoToneIcon from '@mui/icons-material/ZoomOutTwoTone';
import ZoomInTwoToneIcon from '@mui/icons-material/ZoomInTwoTone';
import PhotoCameraTwoToneIcon from '@mui/icons-material/PhotoCameraTwoTone';
import VideoCameraFrontTwoToneIcon from '@mui/icons-material/VideoCameraFrontTwoTone';
import { useModelContext } from '../../state/ModelUIStateContext';
import viewerState from '../../state/ViewerState';
import { ModelInfo } from '../../state/ModelUIState';

interface FloatingControlsPanelProps {
  videoRecorderRef: any;
  info: ModelInfo;
  top: string;
}

function FloatingControlsPanel(props :FloatingControlsPanelProps) {
  const { t } = useTranslation();
  const curState = useModelContext();
  const [isWindowOpen, setIsWindowOpen] = useState(false);


  const handleButtonClick = () => {
    setIsWindowOpen(!isWindowOpen);
  };

  return (
    <div className="floating-buttons-container" style={{top: props.top}}>

      <Grid container spacing={-4} direction="row">
        <Grid item xs={6}>
          <Tooltip title={t('bottomBar.zoomIn')}>
            <IconButton color="primary" onClick={() => {
              curState.setZoomFactor(1.1);
              curState.setZooming(true)}}>
                <ZoomInTwoToneIcon />
            </IconButton>
          </Tooltip>
        </Grid>

        <Grid item xs={6}>
          <Tooltip title={t('bottomBar.zoomOut')}>
            <IconButton color="primary" onClick={() => {
              curState.setZoomFactor(0.9);
              curState.setZooming(true)}}>
                <ZoomOutTwoToneIcon />
            </IconButton>
          </Tooltip>
        </Grid>

        <Grid item xs={6}>
          <Tooltip title={t('bottomBar.snapshoot')}>
            <IconButton color="primary" onClick={() => {
              curState.setTakeSnapshot();}}>
                <PhotoCameraTwoToneIcon />
            </IconButton>
          </Tooltip>
        </Grid>

        <Grid item xs={6}>
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
        </Grid>

        <Grid item xs={6}>
          <Tooltip title={t('floatingButton.model_info')}>
              <IconButton
                color="primary"
                onClick={handleButtonClick}>
                  <InfoIcon />
              </IconButton>
          </Tooltip>
        </Grid>
      </Grid>

      {isWindowOpen &&
        <div className="floating-window">
        {props.info.model_name}
        <br></br>
        Description: {props.info.desc}
        <br></br>
        Authors: {props.info.authors}
        </div>
      }
    </div>
  );
};

export default FloatingControlsPanel;
