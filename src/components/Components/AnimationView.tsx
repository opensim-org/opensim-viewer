import { Container, FormControl, IconButton, MenuItem, Select, SelectChangeEvent, Stack, Slider, Input } from '@mui/material';
import { styled } from '@mui/material/styles';
import PauseCircleTwoToneIcon from '@mui/icons-material/PauseCircleTwoTone';
import PlayCircleTwoToneIcon from '@mui/icons-material/PlayCircleTwoTone';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import InputLabel from '@mui/material/InputLabel';
import { AnimationClip } from 'three';
import { useModelContext } from '../../state/ModelUIStateContext';
import React, { useEffect, useCallback } from 'react';
import { observer } from 'mobx-react';

const NonAnimatedSlider = styled(Slider)(({ theme }) => ({
  "& .MuiSlider-thumb": {
    transition: 'none'
  },
  "& .MuiSlider-track": {
    transition: 'none'
  },
}));

interface AnimationViewProps {
    animating?: boolean;
    animationList: AnimationClip[];
    animationPlaySpeed?: number;
    animationBounds?: number[];
}

const AnimationView : React.FC<AnimationViewProps> = (props:AnimationViewProps) => {
  const { t } = useTranslation();
  const curState = useModelContext();

  const [play, setPlay] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [selectedAnim, setSelectedAnim] = useState<string | undefined>("");

  // console.log("Props", props);
  function togglePlayAnimation() {
      curState.setAnimating(!curState.animating);
      setPlay(!play);

  }
  function handleSpeedChange(event: SelectChangeEvent) {
      curState.setAnimationSpeed(Number(event.target.value));
      setSpeed(Number(event.target.value))
  }

  const handleAnimationChangeEvent = (event: SelectChangeEvent) => {
    const targetName = event.target.value as string
    handleAnimationChange(targetName, true)
  };

  const handleAnimationChange = useCallback((animationName: string, animate: boolean) => {
    const targetName = animationName
    setSelectedAnim(animationName);
    if ( targetName === ""){
        curState.setAnimating(false)
    }
    else {
        const idx = curState.animations.findIndex((value: AnimationClip, index: number)=>{return (value.name === targetName)})
        if (idx !== -1) {
            curState.currentAnimationIndex = idx
            curState.setAnimating(animate)
        }
    }
    if (animate)
      setPlay(curState.animating)
    //setAge(event.target.value as string);
  }, [curState]);

  useEffect(() => {
    if (curState.animations.length > 0) {
      setSelectedAnim(curState.animations[0].name)
      handleAnimationChange(curState.animations[0].name, false)
    }
  }, [curState.animations, handleAnimationChange]);

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    curState.setCurrentFrame(newValue as number)
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    curState.setCurrentFrame(event.target.value === '' ? 0 : Number(event.target.value));
  };

  const handleBlur = () => {
    if (curState.currentFrame < 0) {
      curState.setCurrentFrame(0);
    } else if (curState.currentFrame > 100) {
      curState.setCurrentFrame(100);
    }
  };

  return (
  <>
    <Container disableGutters>
      <FormControl variant="standard" sx={{ m: 1, minWidth: 150 }}>
        <Stack direction="row" color="primary">
          <NonAnimatedSlider defaultValue={50} value={typeof curState.currentFrame === 'number' ? curState.currentFrame : 0} aria-label="Default" valueLabelDisplay="auto"
          onChange={handleSliderChange}/>
          <Input
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
          />
          </Stack>
      </FormControl>
      <FormControl variant="standard" sx={{ m: 1, minWidth: 150 }}>
          <InputLabel id="simple-select-standard-label">Animations</InputLabel>
          <Select
          labelId="simple-select-standard-label"
          label={t('visualizationControl.animate')}
          value={selectedAnim?.toString()}
          onChange={handleAnimationChangeEvent}
          disabled={curState.animations.length < 1}
          >
          {curState.animations.map(anim => (
          <MenuItem key={anim.name} value={anim.name}>
            {anim.name}
          </MenuItem>
        ))}
      </Select>
      </FormControl>
        <Stack direction="row" color="primary">
        <IconButton
              color="primary"
              value={'Animation'}
              disabled={curState.animations.length < 1}
              onClick={togglePlayAnimation}>
              {play?<PauseCircleTwoToneIcon/>:<PlayCircleTwoToneIcon/>}
          </IconButton>
          <FormControl>
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
      </Container>
    </>
  );
}

export default observer(AnimationView);