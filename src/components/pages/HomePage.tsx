import { Container, Typography } from "@mui/material";

const HomePage = () => {
    return (
        <Container>
        <Typography variant="h2" style={{marginTop: 100}}>OpenSim Viewer</Typography>
        <video width="601" height="325" src="videos/Home1-Fast1080p30.mp4">
        </video>
        </Container>
    );
}

export default HomePage;