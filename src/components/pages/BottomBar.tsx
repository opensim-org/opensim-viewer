import { Stack, Container, IconButton, ToggleButton } from '@mui/material'
import ThreeSixtyTwoToneIcon from '@mui/icons-material/ThreeSixtyTwoTone'
import ZoomOutTwoToneIcon from '@mui/icons-material/ZoomOutTwoTone'
import ZoomInTwoToneIcon from '@mui/icons-material/ZoomInTwoTone'
import StraightenTwoToneIcon from '@mui/icons-material/StraightenTwoTone'
import ModeTwoToneIcon from '@mui/icons-material/ModeTwoTone'
import PhotoCameraTwoToneIcon from '@mui/icons-material/PhotoCameraTwoTone'
import VideoCameraFrontTwoToneIcon from '@mui/icons-material/VideoCameraFrontTwoTone'
import Tooltip from '@mui/material/Tooltip';
import { observer } from 'mobx-react'
import { useTranslation } from 'react-i18next'
import { modelUIState } from '../../state/ModelUIState'

function BottomBar() {
    const { t } = useTranslation();

    return (
        <Container style={{height: '7vh' }}>
            <Stack direction="row" color="primary" justifyContent="center">
                <Tooltip title={t('bottomBar.autoRotate')}>
                    <ToggleButton
                        color="primary"
                        selected={modelUIState.rotating}
                        value={'Rotate'}
                        onClick={() => modelUIState.setRotating(!modelUIState.rotating)}>
                        <ThreeSixtyTwoToneIcon />
                    </ToggleButton>
                </Tooltip>
                <Tooltip title={t('bottomBar.zoomIn')}>
                    <IconButton color="primary" onClick={() => {
                        modelUIState.setZoomFactor(1.1); 
                        modelUIState.setZooming(true)}}>
                        <ZoomInTwoToneIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t('bottomBar.zoomOut')}>
                    <IconButton color="primary" onClick={() => {
                        modelUIState.setZoomFactor(0.9); 
                        modelUIState.setZooming(true)}}>
                        <ZoomOutTwoToneIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t('bottomBar.measure')}>
                    <IconButton color="primary">
                        <StraightenTwoToneIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t('bottomBar.annotate')}>
                    <IconButton color="primary">
                        <ModeTwoToneIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t('bottomBar.snapshoot')}>
                    <IconButton color="primary" onClick={() => {
                        modelUIState.setTakeSnapshot();}}>
                        <PhotoCameraTwoToneIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t('bottomBar.record')}>
                    <IconButton color="primary">
                        <VideoCameraFrontTwoToneIcon />
                    </IconButton>
                </Tooltip>
            </Stack>
        </Container>
    )
}

export default observer(BottomBar)
