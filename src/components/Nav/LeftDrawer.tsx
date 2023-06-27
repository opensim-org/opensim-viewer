import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import logo_dark from './logo-dark.svg';
import logo from './logo.svg';
import Link from '@mui/material/Link';
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Canvas } from '@react-three/fiber';
import { Bounds, Environment, GizmoHelper, GizmoViewport } from '@react-three/drei';
import viewerState from '../../state/ViewerState';
import OpenSimControl from '../pages/OpenSimControl';
import { Suspense } from 'react';
import BottomBar from '../pages/BottomBar';
import AccountTreeTwoToneIcon from '@mui/icons-material/AccountTreeTwoTone'
import LayersTwoToneIcon from '@mui/icons-material/LayersTwoTone'

import SceneTreeView from '../Components/SceneTreeView';
import { Tab } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import OpenSimScene from '../pages/OpenSimScene';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(0),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

export default function PersistentDrawerLeft() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const [tabValue, setTabValue] = React.useState('1');

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  return (
    <Box component="div" sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            component="img"
            sx={{ height: 60 }}
            alt="Logo"
            src={true ? logo_dark : logo}
          />
        <Link component={NavLink} to="/viewer" sx={{ marginLeft: "auto", textDecoration: 'none',}}>
            <Typography variant="button" color="secondary">
                {t('viewer')}
            </Typography>
        </Link>

        <Link component={NavLink} to="/models" sx={{ marginLeft: "1em", textDecoration: 'none',}}>
            <Typography variant="button" color="secondary">
                {t('models')}
            </Typography>
        </Link>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />

        <TabContext value={tabValue}>
        <TabList   
            onChange={handleTabChange}  aria-label="basic tabs example"
            variant='scrollable' scrollButtons='auto'>
            <Tab  icon={<AccountTreeTwoToneIcon />} value='1' />
            <Tab  icon={<LayersTwoToneIcon />} value='2'/>
        </TabList>
        <TabPanel value={tabValue} tabIndex={0}>
            <SceneTreeView/>
            </TabPanel>
        <TabPanel value={tabValue} tabIndex={1}>
            </TabPanel>
        </TabContext>
      </Drawer>
      <Main open={open}>
        <div id="canvas-container">
            <Suspense fallback={null}>
                <Canvas
                    gl={{ preserveDrawingBuffer: true }}
                    shadows="soft"
                    style={{ width: '100vw', height: 'calc(100vh - 67px - 7vh)' }}
                    camera={{ position: [1500, 2000, 1000], fov: 75, far: 10000 }}
                >
                    <color attach="background" args={theme.palette.mode === 'dark' ? ['#151518'] : ['#cccccc']} />
                    <Bounds fit clip>
                        <OpenSimScene curentModelPath={viewerState.currentModelPath} />
                    </Bounds>
                    <Environment preset="city" />
                     <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
                        <GizmoViewport labelColor="white" axisHeadScale={1} />
                    </GizmoHelper>
                    <OpenSimControl />
                    <axesHelper visible={viewerState.showGlobalFrame} args={[20]} />
            </Canvas>
            </Suspense>
            <BottomBar />
            </div>
      </Main>
    </Box>
  );
}