import Divider from '@mui/material/Divider/Divider';
import Slider from '@mui/material/Slider';
import { Button, Checkbox, Container, FormControl, FormControlLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
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
    animationList?: AnimationClip[];
    animationPlaySpeed?: number;
    animationBounds?: number[];
}
const VisualizationControl : React.FC<VisualizationControlProps> = (props:VisualizationControlProps) => {
    const { t } = useTranslation();
    const [play, setPlay] = useState(false);
    console.log("Props", props);
    function togglePlayAnimation() {
        modelUIState.setAnimating(!modelUIState.animating);
        setPlay(!play);

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
      <Divider variant="fullWidth"/>
      <Container disableGutters>
        <FormControl sx={{ m: 1, minWidth: 80 }}>
            <InputLabel >Animations</InputLabel>
                <Select
                labelId="simple-select--label"
                id="simple-select"
                autoWidth
                label="Animation"
                value={0.0}
                >
            <MenuItem value="0" onClick={togglePlayAnimation}>
                <em>None</em>
            </MenuItem>
            </Select>
        </FormControl>
        <Slider
            aria-label="Always visible"
            defaultValue={0}
            step={10}
            valueLabelDisplay="off"
        />
          <Stack direction="row" color="primary">
          <Button 
                color="primary"
                value={'Animate'} 
                onClick={togglePlayAnimation}>
                {play?<PauseCircleTwoToneIcon/>:<PlayCircleTwoToneIcon/>}
            </Button>
            <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={1.0}
                label="Speed"
            >
                <MenuItem value={0.25}>1/4</MenuItem>
                <MenuItem value={0.5}>1/2</MenuItem>
                <MenuItem value={1.0}>1</MenuItem>
                <MenuItem value={2.0}>2</MenuItem>
            </Select>
            </Stack>
        </Container>
    </>
    )
}

export default VisualizationControl
 