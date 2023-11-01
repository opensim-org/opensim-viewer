import { Container, FormControl, IconButton, MenuItem, Select, SelectChangeEvent, Stack } from '@mui/material';
import PauseCircleTwoToneIcon from '@mui/icons-material/PauseCircleTwoTone';
import PlayCircleTwoToneIcon from '@mui/icons-material/PlayCircleTwoTone';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import InputLabel from '@mui/material/InputLabel';
import { AnimationClip } from 'three';
import { useModelContext } from '../../state/ModelUIStateContext';
import React, { useEffect } from 'react';
import { observer } from 'mobx-react';

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

    useEffect(() => {
      if (props.animationList.length > 0)
        setSelectedAnim(props.animationList[0].name)
    }, [props.animationList]);


    // console.log("Props", props);
    function togglePlayAnimation() {
        curState.setAnimating(!curState.animating);
        setPlay(!play);

    }
    function handleSpeedChange(event: SelectChangeEvent) {
        curState.setAnimationSpeed(Number(event.target.value));
         setSpeed(Number(event.target.value))
   }

   const handleAnimationChange = (event: SelectChangeEvent) => {
    const targetName = event.target.value as string
    setSelectedAnim(event.target.value as string);
    if ( targetName === ""){
        curState.setAnimating(false)
    }
    else {
        const idx = curState.animations.findIndex((value: AnimationClip, index: number)=>{return (value.name === targetName)})
        if (idx !== -1) {
            curState.currentAnimationIndex = idx
            curState.setAnimating(true)
        }
    }
    setPlay(curState.animating)
    //setAge(event.target.value as string);
  };

  return (
  <>
    <Container disableGutters>
      <FormControl variant="standard" sx={{ m: 1, minWidth: 150 }}>
          <InputLabel id="simple-select-standard-label">Animations</InputLabel>
          <Select
          labelId="simple-select-standard-label"
          label={t('visualizationControl.animate')}
          value={selectedAnim}
          onChange={handleAnimationChange}
          disabled={props.animationList.length < 1}
          >
          {props.animationList.map(anim => (
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
              disabled={props.animationList.length < 1}
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
                  disabled={props.animationList.length < 1}
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