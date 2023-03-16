import { Button, Stack, Container, IconButton } from "@mui/material";
import BungalowTwoToneIcon from '@mui/icons-material/BungalowTwoTone';
import ZoomInMapTwoToneIcon from '@mui/icons-material/ZoomInMapTwoTone';
import ZoomInTwoToneIcon from '@mui/icons-material/ZoomInTwoTone';
import StraightenTwoToneIcon from '@mui/icons-material/StraightenTwoTone';
import ModeTwoToneIcon from '@mui/icons-material/ModeTwoTone';
import LocalMoviesTwoToneIcon from '@mui/icons-material/LocalMoviesTwoTone';
import LeaderboardTwoToneIcon from '@mui/icons-material/LeaderboardTwoTone';

const BottomBar = () => {
    return (
        <Container>
            <Stack direction="row" color="primary" justifyContent="center" >
            <IconButton color="secondary">
                    <BungalowTwoToneIcon/>
                </IconButton>
                <IconButton color="secondary">
                    <ZoomInMapTwoToneIcon/>
                </IconButton>
                <IconButton color="secondary">
                    <ZoomInTwoToneIcon/>
                </IconButton>
                <IconButton color="secondary">
                    <StraightenTwoToneIcon/>
                </IconButton>
                <IconButton color="secondary">
                    <ModeTwoToneIcon/>
                </IconButton>
                <IconButton color="secondary">
                    <LocalMoviesTwoToneIcon/>
                </IconButton>
                <IconButton color="secondary">
                    <LeaderboardTwoToneIcon/>
                </IconButton>
            </Stack>
        </Container>
    );
}

export default BottomBar;