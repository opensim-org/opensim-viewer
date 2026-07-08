import { Grid, Paper, IconButton, Button, FormControl, Slider, SelectChangeEvent, Input, MenuItem, Select} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import PauseCircleTwoToneIcon from '@mui/icons-material/PauseCircleTwoTone';
import PlayCircleTwoToneIcon from '@mui/icons-material/PlayCircleTwoTone';
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

// Floating overlay container — replaces the old docked <Container>
const OverlayPaper = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  left: '50%',
  bottom: theme.spacing(3),
  transform: 'translateX(-50%)',
  zIndex: 1200, // sits above the R3F canvas, below modals/dialogs
  display: 'inline-flex',
  alignItems: 'center',
  padding: theme.spacing(0.5, 2),
  borderRadius: 999, // pill shape
  maxWidth: 'calc(100vw - 32px)',
  overflowX: 'auto',
  overflowY: 'hidden',
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
  pointerEvents: 'auto',
  // hide scrollbar but keep it scrollable on overflow
  scrollbarWidth: 'thin',
  '&::-webkit-scrollbar': {
    height: 4,
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
    const [play, setPlay] = useState(false);
    const [selectedAnim, setSelectedAnim] = useState("");
    const [dollyIndexInAnimations, setDollyIndexInAnimations] = useState(-1);
    const [currentTimeDisplay, setCurrentTimeDisplay] = useState("00:00.00");
    const [totalDuration, setTotalDuration] = useState(0);
    const [totalDurationDisplay, setTotalDurationDisplay] = useState("00:00.00");
    const isExtraSmallScreen = useMediaQuery((theme:any) => theme.breakpoints.only('xs'));
    const isSmallScreen = useMediaQuery((theme:any) => theme.breakpoints.only('sm'));
    const isMediumScreen = useMediaQuery((theme:any) => theme.breakpoints.only('md'));

    const minWidthSlider = isExtraSmallScreen ? 120 : isSmallScreen ? 150 : isMediumScreen ? 200 : 260;
    const maxWidthTime = 60; // Increased to accommodate mm:ss.dd format
    const dollyAnimations = viewerState.animations.filter((anim, i)=>viewerState.isDollyAnimation[i]);

    const handleAnimationChange = useCallback((animationName: string, animate: boolean) => {
      const targetName = animationName
      setSelectedAnim(animationName);
      if (targetName === "") {
        // 'None' selected: stop animation and reset index
        curState.viewerState.setAnimating(false);
        curState.viewerState.clearCurrentAnimationIndices();
        setPlay(false);
        return;
      }
      // idx is index into the full animations list rather than dollyAnimations
      const idx = curState.viewerState.animations.findIndex((value: AnimationClip)=>{return (value.name === targetName)});
      curState.viewerState.addCurrentAnimationIndex(idx);
      setDollyIndexInAnimations(idx);
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
        curState.viewerState.animationChange = {index:0, operation:"start"};
        curState.viewerState.setAnimationsNeedUpdate(true)
        setPlay(!play);
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (viewerState.currentAnimationIndices.length === 0) return;

      const timeString = event.target.value;
      setCurrentTimeDisplay(timeString);
    };

    const handleSliderChange = (event: Event, newValue: number | number[]) => {
      if (viewerState.currentAnimationIndices.length === 0) return;
      if (dollyIndexInAnimations === -1) return;

      const percentage = newValue as number;
      const currentAnimation = viewerState.animations[dollyIndexInAnimations];
      if (currentAnimation) {
        const newTime = (percentage / 100) * currentAnimation.duration;
        viewerState.setCurrentAnimationTime(newTime);

        // Force the animation to update immediately when manually scrubbing
        if (!viewerState.animating) {
          // This will trigger the scene to update the animation pose
          curState.viewerState.forceAnimationUpdate = true;
        }
      }
      if (percentage > 99)
        viewerState.setAnimating(false);
    };

    const handleInputBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      if (viewerState.currentAnimationIndices.length === 0) return;

      const timeString = event.target.value;
      if (dollyIndexInAnimations===-1) return;
      if (/^\d{1,2}:\d{2}\.\d{2}$/.test(timeString)) {
        const newTime = parseTime(timeString);
        const currentAnimation = viewerState.animations[dollyIndexInAnimations];
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
          if (!viewerState.animating) {
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
      if (viewerState.currentAnimationIndices.length === 0 || totalDuration === 0) return 0;
      return (viewerState.currentAnimationTime / totalDuration) * 100;
    };

    // Format value for slider tooltip
    const valueLabelFormat = (value: number): string => {
      if (viewerState.currentAnimationIndices.length === 0 || totalDuration === 0) return "00:00.00";
      const time = (value / 100) * totalDuration;
      return formatTime(time);
    };

    useEffect(() => {
      if (viewerState.currentDollyIndex !== -1){
        // compute index and selectedAnim from current Dollyconst 
        const dollyName = curState.viewerState.cameraDollies[viewerState.currentDollyIndex].name;
        const idx = curState.viewerState.animations.findIndex((value: AnimationClip)=>{return (value.name === dollyName)});
        curState.viewerState.addCurrentAnimationIndex(idx);
        setDollyIndexInAnimations(idx);
      }
      if (curState.viewerState.animations.length > 0 && dollyIndexInAnimations >= 0)
      {
        setSelectedAnim(curState.viewerState.animations[dollyIndexInAnimations].name)
        handleAnimationChange(curState.viewerState.animations[dollyIndexInAnimations].name, false)
      }
      else if (curState.viewerState.currentAnimationIndices.length === 0){
        setSelectedAnim("")
      }
    }, [curState.viewerState.animations, curState.viewerState.currentAnimationIndices, curState.viewerState.cameraDollies, curState.viewerState.currentDollyIndex, selectedAnim, curState.viewerState.animationsNeedUpdate, dollyIndexInAnimations, handleAnimationChange, viewerState.currentDollyIndex, curState.viewerState]);

    return (
      <OverlayPaper ref={(ref as any) || bottomBarRef} elevation={0}>
        <Grid container spacing={1} alignItems="center" wrap="nowrap">
            <>
              <Grid item sx={{ display: { lg: 'block' } }}>
                  <CameraPanel uState={curState} />
              </Grid>
            </>
          { dollyAnimations.length < 1 ? null : (
          <Grid item>
            <FormControl margin="dense" size="small" variant="standard" sx={{maxWidth: 100 }}>
              <Select
                labelId="simple-select-standard-label"
                label={t('visualizationControl.animate')}
                value={selectedAnim}
                onChange={handleAnimationChangeEvent}
                displayEmpty
                disabled={dollyAnimations.length < 1}>
                  <MenuItem value="">None</MenuItem>
                  {dollyAnimations.map(anim=> (
                    <MenuItem key={anim.name} value={anim.name}>
                      {anim.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
          )}
          <Grid item>
            <FormControl margin="dense" size="small" variant="standard">
              <IconButton
                size="small"
                color="primary"
                value={'Animation'}
                disabled={dollyAnimations.length < 1 }
                onClick={togglePlayAnimation}>
                  {play?<PauseCircleTwoToneIcon/>:<PlayCircleTwoToneIcon/>}
              </IconButton>
            </FormControl>
          </Grid>
          <Grid item>
            <FormControl margin="dense" size="small" sx={{minWidth: minWidthSlider}}>
              <NonAnimatedSlider
                value={getCurrentPercentage()}
                aria-label="Animation timeline"
                valueLabelDisplay="auto"
                valueLabelFormat={valueLabelFormat}
                onChange={handleSliderChange}
                disabled={dollyAnimations.length < 1}/>
            </FormControl>
          </Grid>
          {/// Time display in mm:ss.dd format with total duration
          }
          <Grid item>
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
                disabled={dollyAnimations.length < 1}/>
            </FormControl>
          </Grid>
          {/// Total duration display
          dollyAnimations.length > 0 && dollyIndexInAnimations >= 0 && (
            <Grid item>
              <span style={{
                fontSize: '0.875rem',
                color: 'text.secondary',
                marginLeft: '4px',
                whiteSpace: 'nowrap'
              }}>
                / {totalDurationDisplay}
              </span>
            </Grid>
          )}
        </Grid>
        <Grid item>
        <FormControl margin="dense" size="small" variant="standard">
          <Button
          className="cancel-button"
          variant="contained"
          onClick={()=>curState.setIsInDollyEditMode(false)}
        >
          Close
        </Button>
        </FormControl>
        </Grid>
      </OverlayPaper>
    )
});

export default observer(BottomBar)