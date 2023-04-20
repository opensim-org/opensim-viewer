import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import logo_dark from './logo-dark.svg';
import logo from './logo.svg';
import logo_dark_small from './logo-dark-small.svg';
import logo_small from './logo-small.svg';
import ShareTwoToneIcon from '@mui/icons-material/ShareTwoTone';
import TwitterIcon from '@mui/icons-material/Twitter';
import InfoTwoToneIcon from '@mui/icons-material/InfoTwoTone';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PortraitTwoToneIcon from '@mui/icons-material/PortraitTwoTone';
import GridViewTwoToneIcon from '@mui/icons-material/GridViewTwoTone';

import viewerState from '../../state/ViewerState';

interface OpenSimAppBarProps {
    dark: boolean
}

const OpenSimAppBar: React.FC<OpenSimAppBarProps> = ({ dark }) => {

return (
  <AppBar position="static">
    <Toolbar variant="dense" color="inherit">
      <Link href="/">
        <Box
          component="img"
          sx={{ height: 60 }}
          alt="Logo"
          src={dark ? logo_dark : logo}
        />
      </Link>
      <IconButton href="/viewer" sx={{ marginLeft: "auto" }} data-testid="viewer-icon">
        <PortraitTwoToneIcon />
      </IconButton>
      <IconButton href="/models" data-testid="gallery-icon">
        <GridViewTwoToneIcon/>
      </IconButton>
      <IconButton
        sx={{ ml: 1 }}
        onClick={() => {
          viewerState.setDark(!viewerState.dark);
        }}
        color="inherit"
      >
        {viewerState.dark ? <Brightness4Icon /> : <Brightness7Icon />}
      </IconButton>
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
);
}

export default OpenSimAppBar
