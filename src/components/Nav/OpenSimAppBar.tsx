import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import logo from './logo.svg';
import ShareTwoToneIcon from '@mui/icons-material/ShareTwoTone';
import TwitterIcon from '@mui/icons-material/Twitter';

function OpenSimAppBar() {

return (
    <AppBar position="static">
        <Toolbar variant="dense">
            <Link href="/">
                <Box
                  component ="img"
                  sx={{height: 60}}
                  alt="Logo"
                  src={logo}
                />
            </Link>
            <Button href="/viewer" sx={{marginLeft: "auto"}}><Typography variant="button">Viewer</Typography></Button>
            <Button href="/models"><Typography variant="button">Models</Typography></Button>
            <Button href="/about"><Typography variant="button">About</Typography></Button>
            <IconButton>
                <ShareTwoToneIcon/>
            </IconButton>
            <IconButton>
                <TwitterIcon/>
            </IconButton>
        </Toolbar>
    </AppBar>
);
}

export default OpenSimAppBar;