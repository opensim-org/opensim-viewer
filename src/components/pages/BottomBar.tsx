import { Stack, Container, IconButton } from "@mui/material";
import ThreeSixtyTwoToneIcon from '@mui/icons-material/ThreeSixtyTwoTone';
import ZoomInMapTwoToneIcon from '@mui/icons-material/ZoomInMapTwoTone';
import ZoomInTwoToneIcon from '@mui/icons-material/ZoomInTwoTone';
import StraightenTwoToneIcon from '@mui/icons-material/StraightenTwoTone';
import ModeTwoToneIcon from '@mui/icons-material/ModeTwoTone';
import PhotoCameraTwoToneIcon from '@mui/icons-material/PhotoCameraTwoTone';
import VideoCameraFrontTwoToneIcon from '@mui/icons-material/VideoCameraFrontTwoTone';

import { MouseEvent, useRef } from "react";

const BottomBar = () => {
    const camRef = useRef<THREE.Camera>(null);
    
    const handleZoom = (event:MouseEvent)=>{
        console.log('Camera', camRef);
    }
    const handleRefit = ()=>{
        console.log('Refit', camRef);
    }
    return (
        <Container>
            <Stack direction="row" color="primary" justifyContent="center" >
            <IconButton color="primary">
                    <ThreeSixtyTwoToneIcon/>
                </IconButton>
                <IconButton color="primary" onClick={handleRefit}>
                    <ZoomInMapTwoToneIcon/>
                </IconButton>
                <IconButton color="primary"  onClick={handleZoom}>
                    <ZoomInTwoToneIcon/>
                </IconButton>
                <IconButton color="primary">
                    <StraightenTwoToneIcon/>
                </IconButton>
                <IconButton color="primary">
                    <ModeTwoToneIcon/>
                </IconButton>
                <IconButton color="primary">
                    <PhotoCameraTwoToneIcon/>
                </IconButton>
                <IconButton color="primary">
                    <VideoCameraFrontTwoToneIcon/>
                </IconButton>
            </Stack>
        </Container>
    );
}

export default BottomBar;