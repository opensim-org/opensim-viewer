import { Stack, IconButton, ToggleButton, Drawer } from "@mui/material";
import ThreeSixtyTwoToneIcon from '@mui/icons-material/ThreeSixtyTwoTone';
import ZoomInMapTwoToneIcon from '@mui/icons-material/ZoomInMapTwoTone';
import ZoomInTwoToneIcon from '@mui/icons-material/ZoomInTwoTone';
import StraightenTwoToneIcon from '@mui/icons-material/StraightenTwoTone';
import ModeTwoToneIcon from '@mui/icons-material/ModeTwoTone';
import PhotoCameraTwoToneIcon from '@mui/icons-material/PhotoCameraTwoTone';
import VideoCameraFrontTwoToneIcon from '@mui/icons-material/VideoCameraFrontTwoTone';
import viewerState from '../../state/ViewerState'
import { observer } from "mobx-react";

function BottomBar () {
    return (
        <Drawer open={true} anchor="bottom">
            <Stack direction="row" color="primary" justifyContent="center" >
                <ToggleButton color="primary" selected={viewerState.rotating} value={"Rotate"} 
                    onClick={()=>viewerState.setRotating(!viewerState.rotating)}>
                    <ThreeSixtyTwoToneIcon />
                </ToggleButton>
                <IconButton color="primary">
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
        </Drawer>
    );
};

export default observer(BottomBar);