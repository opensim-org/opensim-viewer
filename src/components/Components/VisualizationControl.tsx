import { Checkbox, Container, FormControl, FormControlLabel, IconButton, MenuItem, Select, SelectChangeEvent, Stack, Typography } from '@mui/material';
import FormGroup from '@mui/material/FormGroup';
import PauseCircleTwoToneIcon from '@mui/icons-material/PauseCircleTwoTone';
import PlayCircleTwoToneIcon from '@mui/icons-material/PlayCircleTwoTone';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import InputLabel from '@mui/material/InputLabel';
import { AnimationClip } from 'three';
import { useModelContext } from '../../state/ModelUIStateContext';
import Tooltip from '@mui/material/Tooltip';
import React from 'react';

interface VisualizationControlProps {
    animating?: boolean;
    showWCS?: boolean;
    showJoints?: boolean;
    animationList: AnimationClip[];
    animationPlaySpeed?: number;
    animationBounds?: number[];
}

const VisualizationControl : React.FC<VisualizationControlProps> = (props:VisualizationControlProps) => {
    const { t } = useTranslation();
    const [play, setPlay] = useState(false);
    const [speed, setSpeed] = useState(1.0);
    const [selectedAnim, setSelectedAnim] = useState<string | undefined>("");
    const curState = useModelContext();
    // This is just a hack to force updating checkboxes, otherwise they function but don't toggle! --Ayman 9/23
    const [, setCameraLayerMask] = useState(curState.cameraLayersMask);

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
        <FormGroup>
            <Typography variant="h6" align='left'>{t('visualizationControl.visibility')}</Typography>
            <Tooltip title={t('visualizationControl.wcsTooltip')} placement="top">
                <FormControlLabel control={<Checkbox checked={curState.showGlobalFrame}/>} label={t('visualizationControl.wcs')}
                        onChange={()=>curState.setShowGlobalFrame(!curState.showGlobalFrame)}/>
            </Tooltip>
            <FormControlLabel control={<Checkbox />} label={t('visualizationControl.joints')} />
            <FormControlLabel control={<Checkbox checked={curState.getLayerVisibility(1)}/>} label={t('visualizationControl.bodies')}
                    onChange={()=>{curState.toggleLayerVisibility(1); setCameraLayerMask(curState.cameraLayersMask)}} />
            <FormControlLabel control={<Checkbox checked={curState.getLayerVisibility(7)}/>} label={t('visualizationControl.wrapObjects')}
                    onChange={()=>{curState.toggleLayerVisibility(7); setCameraLayerMask(curState.cameraLayersMask)}} />
            <FormControlLabel control={<Checkbox checked={curState.getLayerVisibility(8)}/>} label={t('visualizationControl.contactObjects')}
                    onChange={()=>{curState.toggleLayerVisibility(8); setCameraLayerMask(curState.cameraLayersMask)}} />
            <FormControlLabel control={<Checkbox checked={curState.getLayerVisibility(4)}/>} label={t('visualizationControl.markers')} 
                    onChange={()=>{curState.toggleLayerVisibility(4); setCameraLayerMask(curState.cameraLayersMask)}}/>
        </FormGroup>
      </Container>
      <Container disableGutters>
        <FormControl variant="standard" sx={{ m: 1, minWidth: 150 }}>
            <InputLabel id="simple-select-standard-label">Animations</InputLabel>
            <Select 
            labelId="simple-select-standard-label"
            label={t('visualizationControl.animate')}
            value={selectedAnim}
            onChange={handleAnimationChange}
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
    )
}

export default VisualizationControl
 