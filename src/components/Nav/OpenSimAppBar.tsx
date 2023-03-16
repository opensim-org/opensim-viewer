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
            <Button href="/">Home</Button>
            <Button href="/about">About</Button>
            <Button href="/models">Models</Button>
            <Button href="/viewer">Viewer</Button>
        </Toolbar>
    </AppBar>
);
}

export default OpenSimAppBar;