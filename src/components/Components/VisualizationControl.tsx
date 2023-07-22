import Slider from '@mui/material/Slider';
import { Button, Checkbox, Container, FormControl, FormControlLabel, MenuItem, Select, SelectChangeEvent, Stack, Typography } from '@mui/material';
import FormGroup from '@mui/material/FormGroup';
import PauseCircleTwoToneIcon from '@mui/icons-material/PauseCircleTwoTone';
import PlayCircleTwoToneIcon from '@mui/icons-material/PlayCircleTwoTone';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import InputLabel from '@mui/material/InputLabel';
import { modelUIState } from '../../state/ModelUIState';
import { AnimationClip } from 'three';

interface VisualizationControlProps {
    animating?: boolean;
    showWCS?: boolean;
    showJoints?: boolean;
    animationList: AnimationClip[];
    animationPlaySpeed?: number;
    animationBounds?: number[];
}

function AnimationsMenu (props:VisualizationControlProps) {
    const handleAnimationChange = (event: SelectChangeEvent) => {
        if (event.target.value as string === ""){
            modelUIState.setAnimating(false)
        }
        else {
            modelUIState.setAnimating(true)
        }
        //setAge(event.target.value as string);
    };
    return (
        <Select 
            labelId="simple-select-standard-label"
            value=""
            label="Animate"
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
    // console.log("Props", props);
    function togglePlayAnimation() {
        modelUIState.setAnimating(!modelUIState.animating);
        setPlay(!play);

    }
    function handleSpeedChange(event: SelectChangeEvent) {
         modelUIState.setAnimationSpeed(Number(event.target.value));
         setSpeed(Number(event.target.value))
   }
    return (
    <>
      <Container disableGutters>
        <FormGroup>
            <Typography variant="h6" align='left'>{t('Visibility')}</Typography>
            <FormControlLabel control={<Checkbox checked={modelUIState.showGlobalFrame}/>} label="WCS" 
                    onClick={()=>modelUIState.setShowGlobalFrame(!modelUIState.showGlobalFrame)}/>
            <FormControlLabel control={<Checkbox />} label="Joints" />
            <FormControlLabel control={<Checkbox />} label="Bodies" />
            <FormControlLabel control={<Checkbox />} label="Markers" />
        </FormGroup>
      </Container>
      <Container disableGutters>
        <FormControl variant="standard" sx={{ m: 1, minWidth: 150 }}>
            <InputLabel id="simple-select-standard-label">Animations</InputLabel>
            <AnimationsMenu {...props}/>
        </FormControl>
          <Stack direction="row" color="primary">
          <Button 
                color="primary"
                value={'Animation'} 
                onClick={togglePlayAnimation}>
                {play?<PauseCircleTwoToneIcon/>:<PlayCircleTwoToneIcon/>}
            </Button>
            <FormControl>
                <InputLabel id="simple-select-standard-label2">Speed</InputLabel>
                <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={speed.toString()}
                    label="Speed"
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
 