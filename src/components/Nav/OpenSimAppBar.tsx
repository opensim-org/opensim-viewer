import React, { useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import InfoTwoToneIcon from '@mui/icons-material/InfoTwoTone';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import GridViewIcon from '@mui/icons-material/GridView';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import viewerState from '../../state/ViewerState';
import { NavLink } from 'react-router-dom';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';
import Drawer from '@mui/material/Drawer';
import Hidden from '@mui/material/Hidden';
import { Auth } from 'aws-amplify';

interface OpenSimAppBarProps {
  dark: boolean;
  isLoggedIn: boolean;
  isFullScreen: boolean;
  toggleFullscreen?: any;
}

const OpenSimAppBar: React.FC<OpenSimAppBarProps> = ({ dark, isLoggedIn, isFullScreen, toggleFullscreen }) => {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };
/*
  useEffect(() => {
    const checkIsUserLoggedIn = async () => {
      try {
        const authenticatedUser = await Auth.currentAuthenticatedUser();
        if (authenticatedUser !== undefined) {
          viewerState.setIsLoggedIn(true);
        } else {
          viewerState.setIsLoggedIn(false);
        }
      } catch {
        viewerState.setIsLoggedIn(false);
      }
    };

    checkIsUserLoggedIn();
  }, [isLoggedIn]);
*/
  const styles = {
    drawer: {
      top: '68px',
      left: '60px',
      width: 'calc(100% - 60px)',
    }
  };
  const url = encodeURIComponent(viewerState.currentModelPath);
  console.log(url);
  
  return (
    <div>

      <Drawer
        variant="persistent"
        anchor="top"
        open={isDrawerOpen}
        onClose={toggleDrawer}
        PaperProps={{
          style: styles.drawer,
        }}>
        <div>
          <Tooltip title={t('topBar.viewer')}>
            <Link component={NavLink} to="/viewer" sx={{ marginLeft: 'auto' }}>
              <IconButton color="inherit">
                <ThreeDRotationIcon />
              </IconButton>
            </Link>
          </Tooltip>

          <Tooltip title={t('topBar.models')}>
            <Link component={NavLink} to="/models">
              <IconButton color="inherit">
                <GridViewIcon />
              </IconButton>
            </Link>
          </Tooltip>

          <Tooltip title={t('topBar.switchTheme')}>
            <IconButton
              color="inherit"
              sx={{ ml: 1 }}
              onClick={() => {
                viewerState.setDark(!viewerState.dark);
              }}
            >
              {viewerState.dark ? <Brightness4Icon /> : <Brightness7Icon />}
            </IconButton>
          </Tooltip>

          <Tooltip title={t('topBar.info')}>
            <Link component={NavLink} to="/about">
              <IconButton color="inherit">
                <InfoTwoToneIcon />
              </IconButton>
            </Link>
          </Tooltip>

          <Tooltip
            title={isLoggedIn ? t('topBar.logOut') : t('topBar.logIn')}
          >
            <Link
              component={NavLink}
              to={isLoggedIn ? '/log_out' : '/log_in'}
            >
              <IconButton color="inherit">
                {isLoggedIn ? <LogoutIcon /> : <LoginIcon />}
              </IconButton>
            </Link>
          </Tooltip>

        </div>
      </Drawer>

      <AppBar position="relative" style={{zIndex: 3000}}>

        <Toolbar variant="dense" color="inherit">

          <Hidden smUp>
            <IconButton
              color="secondary"
              sx={{ ml: 'auto', display: { md: 'none' } }}
              onClick={toggleDrawer}>
                <MenuIcon />
            </IconButton>
          </Hidden>


          <Hidden smDown>
            <Tooltip title={t('topBar.viewer')}>
              <Link component={NavLink} to="/viewer" sx={{ marginLeft: 'auto' }}>
                <IconButton color="secondary">
                  <ThreeDRotationIcon />
                </IconButton>
              </Link>
            </Tooltip>
          </Hidden>

          <Hidden smDown>
            <Tooltip title={t('topBar.models')}>
              <Link component={NavLink} to="/models">
                <IconButton color="secondary">
                  <GridViewIcon />
                </IconButton>
              </Link>
            </Tooltip>
          </Hidden>

          <Hidden smDown>
            <Tooltip title={t('topBar.switchTheme')}>
              <IconButton
                color="secondary"
                sx={{ ml: 1 }}
                onClick={() => {
                  viewerState.setDark(!viewerState.dark);
                }}>
                {viewerState.dark ? <Brightness4Icon /> : <Brightness7Icon />}
              </IconButton>
            </Tooltip>
          </Hidden>

          <Hidden smDown>
            <Tooltip title={t('topBar.info')}>
              <Link component={NavLink} to="/about">
                <IconButton color="secondary">
                  <InfoTwoToneIcon />
                </IconButton>
              </Link>
            </Tooltip>
          </Hidden>

          <Hidden smDown>
            <Tooltip title={isLoggedIn ? t('topBar.logOut') : t('topBar.logIn')}>
              <Link component={NavLink} to={isLoggedIn ? '/log_out' : '/log_in'}>
                <IconButton color="secondary">
                  {isLoggedIn ? <LogoutIcon /> : <LoginIcon />}
                </IconButton>
              </Link>
            </Tooltip>
          </Hidden>

          <Hidden>
            <Tooltip title={isFullScreen ? t('topBar.exitFullScreen') : t('topBar.enterFullScreen')}>
              <IconButton
                color="secondary"
                sx={{ ml: 1 }}
                onClick={() => {
                  toggleFullscreen();
                }}>
                  { isFullScreen ?  <FullscreenExitIcon /> : <FullscreenIcon /> }
              </IconButton>
            </Tooltip>
          </Hidden>
        </Toolbar>
      </AppBar>

    </div>
  );
};

export default OpenSimAppBar;
