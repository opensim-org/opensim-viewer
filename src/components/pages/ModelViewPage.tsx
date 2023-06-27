import { Canvas } from '@react-three/fiber'
import { useTheme } from '@mui/material'
import { GizmoHelper, GizmoViewport, Bounds, Environment } from '@react-three/drei'
import BottomBar from './BottomBar'
import OpenSimControl from './OpenSimControl'
import OpenSimScene from './OpenSimScene'
import { Suspense } from 'react'
import viewerState from '../../state/ViewerState'
import LeftDrawer from '../Nav/LeftDrawer'

interface ModelViewPageProps {
    curentModelPath: string
}

const ModelViewPage: React.FC<ModelViewPageProps> = ({ curentModelPath }) => {
    const theme = useTheme()
    console.log(theme.palette.mode)

    return (
        <LeftDrawer />
    )
}

export default ModelViewPage
