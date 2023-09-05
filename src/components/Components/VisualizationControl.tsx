import { Checkbox, Container, FormControl, FormControlLabel, IconButton, MenuItem, Select, SelectChangeEvent, Stack, Typography } from '@mui/material';
import FormGroup from '@mui/material/FormGroup';
import PauseCircleTwoToneIcon from '@mui/icons-material/PauseCircleTwoTone';
import PlayCircleTwoToneIcon from '@mui/icons-material/PlayCircleTwoTone';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import InputLabel from '@mui/material/InputLabel';
import { AnimationClip } from 'three';
import { useModelContext } from '../../state/ModelUIStateContext';

interface VisualizationControlProps {
    animating?: boolean;
    showWCS?: boolean;
    showJoints?: boolean;
    animationList: AnimationClip[];
    animationPlaySpeed?: number;
    animationBounds?: number[];
}

function AnimationsMenu (props:VisualizationControlProps) {
    const { t } = useTranslation();

    const curState = useModelContext();
    const handleAnimationChange = (event: SelectChangeEvent) => {
        if (event.target.value as string === ""){
            curState.setAnimating(false)
        }
        else {
            curState.setAnimating(true)
        }
        //setAge(event.target.value as string);
    };
    let selectedAnim=(props.animationList.length===0?"":props.animationList[0].name)
    return (

        <Select 
            labelId="simple-select-standard-label"
            value={selectedAnim}
            label={t('visualizationControl.animate')}
            onChange={handleAnimationChange}
            >
            {props.animationList.map(anim => (
            <option key={anim.name} value={anim.name}>
              {anim.name}
            </option>
          ))}
        </Select>
    )
}
const VisualizationControl : React.FC<VisualizationControlProps> = (props:VisualizationControlProps) => {
    const { t } = useTranslation();
    const [play, setPlay] = useState(false);
    const [speed, setSpeed] = useState(1.0);
    const curState = useModelContext();
    // console.log("Props", props);
    function togglePlayAnimation() {
        curState.setAnimating(!curState.animating);
        setPlay(!play);

    }
    function handleSpeedChange(event: SelectChangeEvent) {
        curState.setAnimationSpeed(Number(event.target.value));
         setSpeed(Number(event.target.value))
   }
    return (
    <>
      <Container disableGutters>
        <FormGroup>
            <Typography variant="h6" align='left'>{t('visualizationControl.visibility')}</Typography>
            <FormControlLabel control={<Checkbox checked={curState.showGlobalFrame}/>} label={t('visualizationControl.wcs')}
                    onClick={()=>curState.setShowGlobalFrame(!curState.showGlobalFrame)}/>
            <FormControlLabel control={<Checkbox />} label={t('visualizationControl.joints')} />
            <FormControlLabel control={<Checkbox />} label={t('visualizationControl.bodies')} />
            <FormControlLabel control={<Checkbox />} label={t('visualizationControl.markers')} />
        </FormGroup>
      </Container>
      <Container disableGutters>
        <FormControl variant="standard" sx={{ m: 1, minWidth: 150 }}>
            <InputLabel id="simple-select-standard-label">Animations</InputLabel>
            <AnimationsMenu {...props}/>
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
 