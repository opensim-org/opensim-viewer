import { Grid, Container, IconButton, ToggleButton, FormControl, Slider, SelectChangeEvent, Input, MenuItem, Select, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import ThreeSixtyTwoToneIcon from '@mui/icons-material/ThreeSixtyTwoTone';
import PauseCircleTwoToneIcon from '@mui/icons-material/PauseCircleTwoTone';
import PlayCircleTwoToneIcon from '@mui/icons-material/PlayCircleTwoTone';
import Tooltip from '@mui/material/Tooltip';
import { observer } from 'mobx-react'
import { AnimationClip} from 'three';
import { useTranslation } from 'react-i18next';
import { useModelContext } from '../../state/ModelUIStateContext';
import React, { useCallback, useRef } from 'react';
import CameraPanel from './CameraPanel';

const NonAnimatedSlider = styled(Slider)(() => ({
  "& .MuiSlider-thumb": {
    transition: 'none'
  },
  "& .MuiSlider-track": {
    transition: 'none'
  },
}));

interface BottomBarProps {
  ref?: React.RefObject<HTMLButtonElement>;
  animating?: boolean;
  animationList: AnimationClip[];
  animationPlaySpeed?: number;
  animationBounds?: number[];
}

// Helper function to format seconds to mm:ss.dd
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hundredths = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
};

// Helper function to parse mm:ss.dd to seconds
const parseTime = (timeString: string): number => {
  const [timePart, hundredthsPart] = timeString.split('.');
  const [mins, secs] = timePart.split(':').map(Number);
  const hundredths = hundredthsPart ? Number(hundredthsPart) : 0;
  return (mins * 60) + (secs || 0) + (hundredths / 100);
};

const BottomBar = React.forwardRef(function CustomContent(
    props: BottomBarProps,
    ref,
  ) {
    const bottomBarRef = useRef(null);
    const { t } = useTranslation();
    const curState = useModelContext();
    const viewerState = curState.viewerState
    const [speed, setSpeed] = useState(1.0);
    const [play, setPlay] = useState(false);
    const [selectedAnim, setSelectedAnim] = useState("");
    const [currentTimeDisplay, setCurrentTimeDisplay] = useState("00:00.00");
    const [totalDuration, setTotalDuration] = useState(0);
    const [totalDurationDisplay, setTotalDurationDisplay] = useState("00:00.00");
    const isExtraSmallScreen = useMediaQuery((theme:any) => theme.breakpoints.only('xs'));
    const isSmallScreen = useMediaQuery((theme:any) => theme.breakpoints.only('sm'));
    const isMediumScreen = useMediaQuery((theme:any) => theme.breakpoints.only('md'));

    const minWidthSlider = isExtraSmallScreen ? 150 : isSmallScreen ? 175 : isMediumScreen ? 250 : 300;
    const maxWidthTime = 60; // Increased to accommodate mm:ss.dd format

    // Update time display when animation time changes
    useEffect(() => {
      if (viewerState.currentAnimationIndex !== -1 && viewerState.animations.length > 0) {
        const currentTime = viewerState.currentAnimationTime;
        setCurrentTimeDisplay(formatTime(currentTime));

        // Update total duration when animation changes
        const currentAnimation = viewerState.animations[viewerState.currentAnimationIndex];
        if (currentAnimation && currentAnimation.duration !== totalDuration) {
          setTotalDuration(currentAnimation.duration);
          setTotalDurationDisplay(formatTime(currentAnimation.duration));
        }
      } else {
        setCurrentTimeDisplay("00:00.00");
        setTotalDuration(0);
        setTotalDurationDisplay("00:00.00");
      }
    }, [viewerState.currentAnimationTime, viewerState.currentAnimationIndex, viewerState.animations, totalDuration]);

    const handleAnimationChange = useCallback((animationName: string, animate: boolean) => {
      const targetName = animationName
      setSelectedAnim(animationName);
      if (targetName === "") {
        // 'None' selected: stop animation and reset index
        curState.viewerState.setAnimating(false);
        curState.viewerState.setCurrentAnimationIndex(-1);
        setPlay(false);
        return;
      }
      const idx = curState.viewerState.animations.findIndex((value: AnimationClip)=>{return (value.name === targetName)});
      curState.viewerState.setCurrentAnimationIndex(idx);

      // Set total duration for new animation
      if (idx !== -1) {
        const animation = curState.viewerState.animations[idx];
        setTotalDuration(animation.duration);
        setTotalDurationDisplay(formatTime(animation.duration));
      }
    }, [curState.viewerState]);

    const handleAnimationChangeEvent = (event: SelectChangeEvent) => {
      const targetName = event.target.value as string
      handleAnimationChange(targetName, true)
    };

    function togglePlayAnimation() {
        curState.viewerState.setAnimating(!curState.viewerState.animating);
        setPlay(!play);
    }

    function handleSpeedChange(event: SelectChangeEvent) {
        curState.viewerState.setAnimationSpeed(Number(event.target.value));
        setSpeed(Number(event.target.value))
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (viewerState.currentAnimationIndex === -1) return;

      const timeString = event.target.value;
      setCurrentTimeDisplay(timeString);
    };

    const handleSliderChange = (event: Event, newValue: number | number[]) => {
      if (viewerState.currentAnimationIndex === -1) return;

      const percentage = newValue as number;
      const currentAnimation = viewerState.animations[viewerState.currentAnimationIndex];
      if (currentAnimation) {
        const newTime = (percentage / 100) * currentAnimation.duration;
        viewerState.setCurrentAnimationTime(newTime);

        // Force the animation to update immediately when manually scrubbing
        if (!viewerState.animating && !curState.isGUIAnimating) {
          // This will trigger the scene to update the animation pose
          curState.viewerState.forceAnimationUpdate = true;
        }
      }
    };

    const handleInputBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      if (viewerState.currentAnimationIndex === -1) return;

      const timeString = event.target.value;
      if (/^\d{1,2}:\d{2}\.\d{2}$/.test(timeString)) {
        const newTime = parseTime(timeString);
        const currentAnimation = viewerState.animations[viewerState.currentAnimationIndex];
        if (currentAnimation) {
          let clampedTime = newTime;
          if (newTime < 0) {
            clampedTime = 0;
          } else if (newTime > currentAnimation.duration) {
            clampedTime = currentAnimation.duration;
          }

          viewerState.setCurrentAnimationTime(clampedTime);
          setCurrentTimeDisplay(formatTime(clampedTime));

          // Force update when manually setting time
          if (!viewerState.animating && !curState.isGUIAnimating) {
            curState.viewerState.forceAnimationUpdate = true;
          }
        }
      } else {
        setCurrentTimeDisplay(formatTime(viewerState.currentAnimationTime));
      }
    };


    const handleInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        (event.target as HTMLInputElement).blur();
      }
    };


    // Calculate current percentage for slider
    const getCurrentPercentage = (): number => {
      if (viewerState.currentAnimationIndex === -1 || totalDuration === 0) return 0;
      return (viewerState.currentAnimationTime / totalDuration) * 100;
    };

    // Format value for slider tooltip
    const valueLabelFormat = (value: number): string => {
      if (viewerState.currentAnimationIndex === -1 || totalDuration === 0) return "00:00.00";
      const time = (value / 100) * totalDuration;
      return formatTime(time);
    };

    useEffect(() => {
      if (curState.viewerState.animations.length > 0 && curState.viewerState.currentAnimationIndex !== -1)
      {
        setSelectedAnim(curState.viewerState.animations[curState.viewerState.currentAnimationIndex].name)
        handleAnimationChange(curState.viewerState.animations[curState.viewerState.currentAnimationIndex].name, false)
      }
      else if (curState.viewerState.currentAnimationIndex === -1){
        setSelectedAnim("")
      }
    }, [curState.viewerState.animations, curState.viewerState.currentAnimationIndex,
        curState.viewerState.cameraDollies, curState.viewerState.currentDollyIndex,
            selectedAnim, curState.viewerState.animationsNeedUpdate]);

    return (
      <Container ref={(ref as any) || bottomBarRef}>
        <Grid container spacing={1} alignItems="center" justifyContent="center">
            <>
              <Grid item sx={{ mt: 1, display: { lg: 'block' } }}>
                  <CameraPanel uState={curState} />
              </Grid>
              <Divider orientation="vertical" sx={{ mx: 2, display: { xs: 'none', lg: 'block' } }} />
            </>
          { curState.viewerState.animations.length < 1 ? null : (
          <Grid item sx={{ mt: 1 }}>
            <FormControl margin="dense" size="small" variant="standard" sx={{maxWidth: 100 }}>
              <Select
                labelId="simple-select-standard-label"
                label={t('visualizationControl.animate')}
                value={selectedAnim}
                onChange={handleAnimationChangeEvent}
                displayEmpty
                disabled={curState.viewerState.animations.length < 1}>
                  <MenuItem value="">None</MenuItem>
                  {curState.viewerState.animations.map(anim => (
                    <MenuItem key={anim.name} value={anim.name}>
                      {anim.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
          )}

          {curState.getGuiMode()?"":
            <Grid item sx={{ mt: 1 }}>
              <FormControl margin="dense" size="small" variant="standard">
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={speed.toString()}
                  label={t('visualizationControl.speed')}
                  onChange={handleSpeedChange}
                  disabled={curState.viewerState.animations.length < 1}>
                    <MenuItem value={0.01}>0.01</MenuItem>
                    <MenuItem value={0.1}>0.1</MenuItem>
                    <MenuItem value={0.2}>0.2</MenuItem>
                    <MenuItem value={0.3}>0.3</MenuItem>
                    <MenuItem value={0.4}>0.4</MenuItem>
                    <MenuItem value={0.5}>0.5</MenuItem>
                    <MenuItem value={1.0}>1.0</MenuItem>
                    <MenuItem value={2.0}>2.0</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          }
          <Grid item sx={{ mt: 1 }}>
            <FormControl margin="dense" size="small" variant="standard">
              <IconButton
                size="small"
                color="primary"
                value={'Animation'}
                disabled={curState.viewerState.animations.length < 1 || curState.isGUIAnimating}
                onClick={togglePlayAnimation}>
                  {play?<PauseCircleTwoToneIcon/>:<PlayCircleTwoToneIcon/>}
              </IconButton>
            </FormControl>
          </Grid>
          <Grid item sx={{ mt: 1 }}>
            <FormControl margin="dense" size="small" sx={{minWidth: minWidthSlider}}>
              <NonAnimatedSlider
                value={getCurrentPercentage()}
                aria-label="Animation timeline"
                valueLabelDisplay="auto"
                valueLabelFormat={valueLabelFormat}
                onChange={handleSliderChange}
                disabled={curState.viewerState.animations.length < 1}/>
            </FormControl>
          </Grid>
          {/// Time display in mm:ss.dd format with total duration
          }
          <Grid item sx={{ mt: 1 }}>
            <FormControl margin="dense" size="small" variant="filled">
              <Input
                sx={{maxWidth: maxWidthTime}}
                size="small"
                value={currentTimeDisplay}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyPress={handleInputKeyPress}
                inputProps={{
                  pattern: '^\\d{1,2}:\\d{2}\\.\\d{2}$',
                  placeholder: 'mm:ss.dd',
                  'aria-labelledby': 'time-input'}}
                disabled={curState.viewerState.animations.length < 1}/>
            </FormControl>
          </Grid>
          {/// Total duration display
          curState.viewerState.animations.length > 0 && viewerState.currentAnimationIndex !== -1 && (
            <Grid item sx={{ mt: 1 }}>
              <span style={{
                fontSize: '0.875rem',
                color: 'text.secondary',
                marginLeft: '4px'
              }}>
                / {totalDurationDisplay}
              </span>
            </Grid>
          )}
          {curState.getGuiMode()?"":
            <Grid item sx={{ mt: 1 }}>
              <Tooltip title={t('bottomBar.autoRotate')}>
                <ToggleButton
                  color="primary"
                  selected={viewerState.rotating}
                  value={'Rotate'}
                  onClick={() => viewerState.setRotating(!viewerState.rotating)}>
                    <ThreeSixtyTwoToneIcon />
                </ToggleButton>
              </Tooltip>
            </Grid>
          }
        </Grid>
      </Container>
    )
});

export default observer(BottomBar)