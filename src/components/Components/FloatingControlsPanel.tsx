import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next'
import './FloatingControlsPanel.css';
import ZoomOutTwoToneIcon from '@mui/icons-material/ZoomOutTwoTone';
import ZoomInTwoToneIcon from '@mui/icons-material/ZoomInTwoTone';
import VideoCameraFrontTwoToneIcon from '@mui/icons-material/VideoCameraFrontTwoTone';
import FitScreenTwoToneIcon from '@mui/icons-material/FitScreenTwoTone';
import { useModelContext } from '../../state/ModelUIStateContext';
import SnapShotModal from './SnapShotModal';
import { ModelInfo } from '../../state/ModelUIState';
import { observer } from "mobx-react";
import TripodCombo from './TripodCombo';
import DollyCombo from './DollyCombo';
interface FloatingControlsPanelProps {
  videoRecorderRef: any;
  info: ModelInfo;
  top: string;
  left: string;
}


function FloatingControlsPanel(props :FloatingControlsPanelProps) {
  const { t } = useTranslation();
  const curState = useModelContext();
  const viewerState = curState.viewerState;
  
  const [isWindowOpen, setIsWindowOpen] = useState(false);


  const handleRecordButtonClick = () => {
    curState.setIsInRecordMode(true)
    curState.viewerState.setShowAspectRatioGuides?.(true);
    curState.setIsInDollyEditMode(false)
  };

  return (
    <div className="floating-buttons-container" style={{top: props.top, left: props.left,}}>

      <Grid container spacing={-4} direction="column">
        <Grid item xs={6}>
          <Tooltip title={t('bottomBar.zoomIn')} placement="right">
            <IconButton color="primary" onClick={() => {
              curState.setZoomFactor(1.1);
              curState.setZooming(true)}}>
                <ZoomInTwoToneIcon />
            </IconButton>
          </Tooltip>
        </Grid>

        <Grid item xs={6}>
          <Tooltip title={t('bottomBar.zoomOut')} placement="right">
            <IconButton color="primary" onClick={() => {
              curState.setZoomFactor(0.9);
              curState.setZooming(true)}}>
                <ZoomOutTwoToneIcon />
            </IconButton>
          </Tooltip>
        </Grid>

        <Grid item xs={6}>
          <Tooltip title={t('bottomBar.fit')} placement="right">
            <IconButton color="primary" onClick={() => {
              viewerState.handleKey('F')}}>
                <FitScreenTwoToneIcon />
            </IconButton>
          </Tooltip>
        </Grid>

        <Grid item xs={6}>
            <SnapShotModal open={false}/>
        </Grid>

        <Grid item xs={6}>
          <Tooltip title={t("bottomBar.record")} placement="right">
              <IconButton
                color="primary"
                onClick={handleRecordButtonClick}>
                  <VideoCameraFrontTwoToneIcon />
              </IconButton>
          </Tooltip>
        </Grid>

        <Grid item xs={6}>
          <TripodCombo />
        </Grid>

        <Grid item xs={6}>
            <DollyCombo />
        </Grid>

      </Grid>

    </div>
  );
};

export default observer(FloatingControlsPanel);
