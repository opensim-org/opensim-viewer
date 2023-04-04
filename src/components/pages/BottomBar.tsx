import { Stack, Container, IconButton, ToggleButton } from "@mui/material";
import ThreeSixtyTwoToneIcon from '@mui/icons-material/ThreeSixtyTwoTone';
import ZoomInMapTwoToneIcon from '@mui/icons-material/ZoomInMapTwoTone';
import ZoomInTwoToneIcon from '@mui/icons-material/ZoomInTwoTone';
import StraightenTwoToneIcon from '@mui/icons-material/StraightenTwoTone';
import ModeTwoToneIcon from '@mui/icons-material/ModeTwoTone';
import PhotoCameraTwoToneIcon from '@mui/icons-material/PhotoCameraTwoTone';
import VideoCameraFrontTwoToneIcon from '@mui/icons-material/VideoCameraFrontTwoTone';

import { MouseEvent } from "react";
import React, { useState } from 'react';
import { Camera } from "@react-three/fiber";

interface BottomBarProps {
    rotating?: boolean;
}
const BottomBar = (props: BottomBarProps) => {
    const [toggle, setToggle] = useState(true);

    const handleZoom = (event:MouseEvent)=>{
        console.log('Camera Zoom');
    }
    const handleRefit = ()=>{
        console.log('Refit Scene');
    }
    return (
        <Container>
            <Stack direction="row" color="primary" justifyContent="center" >
                <ToggleButton color="primary" selected={toggle} value={"Rotate"} 
                        onClick={()=>setToggle(!toggle)}>
                    <ThreeSixtyTwoToneIcon />
                </ToggleButton>
                <IconButton color="primary" onClick={handleRefit}>
                    <ZoomInMapTwoToneIcon/>
                </IconButton>
                <IconButton color="primary">
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