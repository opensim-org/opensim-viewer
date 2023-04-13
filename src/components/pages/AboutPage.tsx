import { Container, Typography } from "@mui/material";

const AboutPage = () => {
    return (
        <Container>
            <Typography variant="h4" style={{marginTop: 100}}>About OpenSim</Typography>
            <Typography variant="body1" align="left" style={{marginBottom: 40}}>
                OpenSim is a software platform for modeling humans, animals, robots, and the environment, 
                and simulating their interaction and movement. OpenSim has a graphical user interface (GUI) 
                for visualizing models and generating and analyzing simulations. 
                The open source and extensible software also includes an application programming interface (API) 
                that developers can use to extend the software.
            </Typography>
            <Typography variant="h4">OpenSim Viewer</Typography>
            <Typography variant="body1" align="left" style={{marginBottom: 40}}>
                OpenSim Viewer is a cloud based interface to allow users and stakeholders to visualize and share 
                OpenSim models and simulation results with collaborators and the community without requiring 
                software download/install/update cycle and on all platforms that have browser support including phones,
                and tablets for which the application/API may not be supported.
            </Typography>
            <Typography variant="h4">Acknowledgement</Typography>
            <Typography variant="body1" align="left">
                OpenSim is supported by ....
            </Typography>
        </Container>
    );
}

export default AboutPage;
