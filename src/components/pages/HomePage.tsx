import { Container, Typography } from '@mui/material'
import DropFile from '../Components/DropFile'

const HomePage = () => {
    return (
        <Container>
            <Typography variant="h2" style={{ marginTop: 100 }}>
                OpenSim Online Viewer
                <DropFile></DropFile>
            </Typography>
        </Container>
    )
}

export default HomePage
