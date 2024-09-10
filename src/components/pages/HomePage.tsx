import { Container, Typography } from '@mui/material'
import DropFile from '../Components/DropFile'
import { useTranslation } from 'react-i18next'

const HomePage = () => {
    const { t } = useTranslation();
    return (
        <Container>
            <Typography variant="h2" style={{ marginTop: 100 }}>
                {t('welcome_title')}
                <DropFile paddingY={50}></DropFile>
            </Typography>
        </Container>
    )
}

export default HomePage
