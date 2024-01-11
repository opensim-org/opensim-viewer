import { Container, FormControl, IconButton, MenuItem, Select, SelectChangeEvent, Stack, Slider, Input } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import InputLabel from '@mui/material/InputLabel';
import { AnimationClip } from 'three';
import { useModelContext } from '../../state/ModelUIStateContext';
import React, { useEffect, useCallback } from 'react';
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

  const [selectedAnim, setSelectedAnim] = useState<string | undefined>("");

  // console.log("Props", props);
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
    //setAge(event.target.value as string);
  }, [curState]);

  useEffect(() => {
    if (curState.animations.length > 0) {
      setSelectedAnim(curState.animations[0].name)
      handleAnimationChange(curState.animations[0].name, false)
    }
  }, [curState.animations, handleAnimationChange]);

  return (
  <>
    <Container disableGutters>
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

      </Container>
    </>
  );
}

export default observer(AnimationView);