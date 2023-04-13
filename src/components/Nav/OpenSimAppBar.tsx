import React from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import logo_dark from './logo-dark.svg'
import logo from './logo.svg'
import ShareTwoToneIcon from '@mui/icons-material/ShareTwoTone'
import TwitterIcon from '@mui/icons-material/Twitter'
import InfoTwoToneIcon from '@mui/icons-material/InfoTwoTone'

interface OpenSimAppBarProps {
    dark: boolean
}

const OpenSimAppBar: React.FC<OpenSimAppBarProps> = ({ dark }) => {
    return (
        <AppBar position="static">
            <Toolbar variant="dense">
                <Link href="/">
                    <Box component="img" sx={{ height: 60 }} alt="Logo" src={dark ? logo_dark : logo} />
                </Link>
                <Button href="/viewer" sx={{ marginLeft: 'auto' }}>
                    <Typography variant="button" color="secondary">
                        Viewer
                    </Typography>
                </Button>
                <Button href="/models">
                    <Typography variant="button" color="secondary">
                        Models
                    </Typography>
                </Button>
                <IconButton>
                    <InfoTwoToneIcon />
                </IconButton>
                <IconButton>
                    <ShareTwoToneIcon />
                </IconButton>
                <IconButton>
                    <TwitterIcon />
                </IconButton>
            </Toolbar>
        </AppBar>
    )
}

export default OpenSimAppBar
