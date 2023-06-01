import Grid from '@mui/material/Unstable_Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Link from '@mui/material/Link'
import { Canvas } from '@react-three/fiber'
import { useTheme } from '@mui/material'
import { Bounds, Environment } from '@react-three/drei'
import Typography from '@mui/material/Typography'

import OpenSimControl from '../../Components/OpenSimControl'
import OpenSimScene from '../../Components/OpenSimScene'
import { ModelMetadataType } from './ModelListPage'
import viewerState from '../../../state/ViewerState'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface GridListProps {
    modelMetadata: ModelMetadataType[]
}

const GridList = ({ modelMetadata }: GridListProps) => {
    const { t } = useTranslation();
    const theme = useTheme()
    return (
        <Grid container spacing={2}>
            {modelMetadata.map((element) => (
                <Grid key={element.id} xs={12} md={4} component="div">
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div id="canvas-container">
                            <Canvas
                                gl={{ preserveDrawingBuffer: true }}
                                shadows
                                style={{ width: '100%', height: '40vh' }}
                                camera={{ position: [1500, 1500, 1000], fov: 75, far: 10000 }}
                            >
                                <color
                                    attach="background"
                                    args={theme.palette.mode === 'dark' ? ['#151518'] : ['#cccccc']}
                                />
                                <directionalLight
                                    position={[1500, 2000, 1000]}
                                    intensity={0.05}
                                    shadow-mapSize={128}
                                    castShadow
                                />
                                <Bounds fit clip>
                                    <OpenSimScene curentModelPath={element.path} />
                                </Bounds>
                                <Environment preset="city" />
                                <OpenSimControl />
                            </Canvas>
                        </div>
                        <CardContent sx={{ flexGrow: 1 }}>
                            <Typography gutterBottom variant="h5" component="h2">
                                <Link
                                    component={NavLink}
                                    onClick={() => {
                                        viewerState.setCurrentModelPath(element.path)
                                    }}
                                    to="/viewer/"
                                >
                                    {element.name}
                                </Link>
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
                                {element.description}
                            </Typography>
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2" sx={{ textAlign: 'left', width: '60%', margin: '1em' }}>
                                <strong>{t('modelList.by')} </strong>
                                {element.author}
                            </Typography>
                            <Link
                                href={element.link}
                                variant="subtitle2"
                                sx={{ textAlign: 'right', margin: '1em' }}
                                target="_blank"
                            >
                                {t('modelList.moreInfo')}
                            </Link>
                        </CardActions>
                    </Card>
                </Grid>
            ))}
        </Grid>
    )
}

export default GridList
