import Divider from '@mui/material/Divider/Divider';
import Slider from '@mui/material/Slider';
import { Button, Checkbox, Container, FormControl, FormControlLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import FormGroup from '@mui/material/FormGroup';
import PauseCircleTwoToneIcon from '@mui/icons-material/PauseCircleTwoTone';
import PlayCircleTwoToneIcon from '@mui/icons-material/PlayCircleTwoTone';
import viewerState from '../../state/ViewerState';
import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react'
import { useState } from 'react';
import InputLabel from '@mui/material/InputLabel';

interface VisualizationControlProps {
    showWCS?: boolean;
    showJoints?: boolean;
    animationList?: string[];
    animationPlaySpeed?: number;
    animationBounds?: number[];
}
const VisualizationControl : React.FC<VisualizationControlProps> = (props:VisualizationControlProps) => {
    const { t } = useTranslation();
    const [play, setPlay] = useState(true);

    function togglePlayAnimation() {
        viewerState.setAnimating(!viewerState.animating);
        setPlay(!play);
        console.log(viewerState.animating);

    }
    return (
    <>
      <Container disableGutters>
        <FormGroup>
            <Typography variant="h6" align='left'>{t('Visibility')}</Typography>
            <FormControlLabel control={<Checkbox />} label="WCS" />
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
            <MenuItem value="0">
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

export default observer(VisualizationControl)
 