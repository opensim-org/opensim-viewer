import { Stack, Container, IconButton, ToggleButton } from "@mui/material";
import ThreeSixtyTwoToneIcon from '@mui/icons-material/ThreeSixtyTwoTone';
import ZoomInMapTwoToneIcon from '@mui/icons-material/ZoomInMapTwoTone';
import ZoomInTwoToneIcon from '@mui/icons-material/ZoomInTwoTone';
import StraightenTwoToneIcon from '@mui/icons-material/StraightenTwoTone';
import ModeTwoToneIcon from '@mui/icons-material/ModeTwoTone';
import PhotoCameraTwoToneIcon from '@mui/icons-material/PhotoCameraTwoTone';
import VideoCameraFrontTwoToneIcon from '@mui/icons-material/VideoCameraFrontTwoTone';
import viewerState from '../../state/ViewerState'
import React from 'react';
import { observer } from "mobx-react";

function BottomBar () {
    return (
        <Container>
            <Stack direction="row" color="primary" justifyContent="center" >
                <ToggleButton color="primary" selected={viewerState.rotating} value={"Rotate"} 
                    onClick={()=>viewerState.setRotating(!viewerState.rotating)}>
                    <ThreeSixtyTwoToneIcon />
                </ToggleButton>
                <IconButton color="primary" 
                    onClick={()=>viewerState.setZooming(-1.1)}>
                    <ZoomInMapTwoToneIcon/>
                </IconButton>
                <IconButton color="primary"
                    onClick={()=>viewerState.setZooming(1.1)}>
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
};

export default observer(BottomBar);