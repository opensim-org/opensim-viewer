import Grid from '@mui/material/Unstable_Grid2'
import { Stack, Container, IconButton, ToggleButton, FormControl, Slider, SelectChangeEvent, Input, MenuItem, Select } from '@mui/material'
import { styled } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { AnimationClip } from 'three';
import ThreeSixtyTwoToneIcon from '@mui/icons-material/ThreeSixtyTwoTone'
import ZoomOutTwoToneIcon from '@mui/icons-material/ZoomOutTwoTone'
import ZoomInTwoToneIcon from '@mui/icons-material/ZoomInTwoTone'
import StraightenTwoToneIcon from '@mui/icons-material/StraightenTwoTone'
import ModeTwoToneIcon from '@mui/icons-material/ModeTwoTone'
import PhotoCameraTwoToneIcon from '@mui/icons-material/PhotoCameraTwoTone'
import VideoCameraFrontTwoToneIcon from '@mui/icons-material/VideoCameraFrontTwoTone'
import PauseCircleTwoToneIcon from '@mui/icons-material/PauseCircleTwoTone';
import PlayCircleTwoToneIcon from '@mui/icons-material/PlayCircleTwoTone';
import InputLabel from '@mui/material/InputLabel';
import Tooltip from '@mui/material/Tooltip';
import { observer } from 'mobx-react'
import { useTranslation } from 'react-i18next'
import { useModelContext } from '../../state/ModelUIStateContext';
import viewerState from '../../state/ViewerState'

const NonAnimatedSlider = styled(Slider)(({ theme } : {theme:any}) => ({
  "& .MuiSlider-thumb": {
    transition: 'none'
  },
  "& .MuiSlider-track": {
    transition: 'none'
  },
}));

interface BottomBarProps {
  videoRecorderRef: any;
}

function BottomBar({ videoRecorderRef }: BottomBarProps) {
    const { t } = useTranslation();
    const curState = useModelContext();
    const [speed, setSpeed] = useState(1.0);
    const [play, setPlay] = useState(false);

    const isExtraSmallScreen = useMediaQuery((theme:any) => theme.breakpoints.only('xs'));
    const isSmallScreen = useMediaQuery((theme:any) => theme.breakpoints.only('sm'));
    const isMediumScreen = useMediaQuery((theme:any) => theme.breakpoints.only('md'));

    const minWidthSlider = isExtraSmallScreen ? 150 : isSmallScreen ? 175 : isMediumScreen ? 250 : 300; // Adjust values as needed
    const marginTopSlider = isExtraSmallScreen ? 0 : isSmallScreen ? 0 : isMediumScreen ? 0 : 1
    useEffect(() => {
      console.log(curState.animations)
    }, [curState.animations]);

    function togglePlayAnimation() {
        curState.setAnimating(!curState.animating);
        setPlay(!play);
    }

    function handleSpeedChange(event: SelectChangeEvent) {
        curState.setAnimationSpeed(Number(event.target.value));
        setSpeed(Number(event.target.value))
    }

    const handleBlur = () => {
      if (curState.currentFrame < 0) {
        curState.setCurrentFrame(0);
      } else if (curState.currentFrame > 100) {
        curState.setCurrentFrame(100);
      }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      curState.setCurrentFrame(event.target.value === '' ? 0 : Number(event.target.value));
    };

    const handleSliderChange = (event: Event, newValue: number | number[]) => {
      curState.setCurrentFrame(newValue as number)
    };

    return (
        <Container style={{height: '7vh' }}>

            <Stack direction="row" color="primary" justifyContent="center">
              <Grid container spacing={2} style={{textAlign: "center"}} alignItems="center" justifyContent="center">
                <Stack direction="row" color="primary" justifyContent="center">
                  <FormControl variant="standard" sx={{ mr: 0, mt: 0.5, minWidth: 100 }}>
                    <Stack direction="row" color="primary">
                      <IconButton
                            color="primary"
                            value={'Animation'}
                            disabled={curState.animations.length < 1}
                            onClick={togglePlayAnimation}>
                            {play?<PauseCircleTwoToneIcon/>:<PlayCircleTwoToneIcon/>}
                        </IconButton>
                        <FormControl size="small" margin="normal">
                            <InputLabel id="simple-select-standard-label2">Speed</InputLabel>
                            <Select
                                labelId="demo-simple-select-label"
                                id="demo-simple-select"
                                value={speed.toString()}
                                label={t('visualizationControl.speed')}
                                onChange={handleSpeedChange}
                                disabled={curState.animations.length < 1}
                            >
                                <MenuItem value={0.25}>0.25</MenuItem>
                                <MenuItem value={0.5}>0.5</MenuItem>
                                <MenuItem value={1.0}>1.0</MenuItem>
                                <MenuItem value={2.0}>2.0</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                  </FormControl>
                  <FormControl variant="standard" margin="normal" sx={{ m: 1, mr: 2, minWidth: minWidthSlider }}>
                    <Stack direction="row" color="primary">
                      <NonAnimatedSlider
                        sx={{ mr: 1, mt: marginTopSlider }}
                        defaultValue={50}
                        value={typeof curState.currentFrame === 'number' ? curState.currentFrame : 0}
                        aria-label="Default"
                        valueLabelDisplay="auto"
                        onChange={handleSliderChange}
                        disabled={curState.animations.length < 1}
                        />
                      <Input
                        sx={{ mt: marginTopSlider }}
                        size="small"
                        value={curState.currentFrame}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        inputProps={{
                          step: 1,
                          min: 0,
                          max: 100,
                          type: 'number',
                          'aria-labelledby': 'input-slider',
                        }}
                        disabled={curState.animations.length < 1}
                      />
                    </Stack>
                  </FormControl>
                </Stack>
                <Stack direction="row" color="primary">
                  <Tooltip title={t('bottomBar.autoRotate')}>
                      <ToggleButton
                          color="primary"
                          selected={curState.rotating}
                          value={'Rotate'}
                          onClick={() => curState.setRotating(!curState.rotating)}>
                          <ThreeSixtyTwoToneIcon />
                      </ToggleButton>
                  </Tooltip>
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
                  <Tooltip title={t('bottomBar.annotate')}>
                      <IconButton color="primary">
                          <ModeTwoToneIcon />
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
                              videoRecorderRef.current.startRecording();
                          } else {
                              videoRecorderRef.current.stopRecording();
                          }}}>
                          <VideoCameraFrontTwoToneIcon />
                      </IconButton>
                  </Tooltip>
                </Stack>
              </Grid>
            </Stack>
        </Container>
    )
}

export default observer(BottomBar)
