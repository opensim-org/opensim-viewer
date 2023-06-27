import { useTheme } from '@mui/material'
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
