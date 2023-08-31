import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import IconButton from '@mui/material/IconButton';
import ShareTwoToneIcon from '@mui/icons-material/ShareTwoTone';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import { useTranslation } from 'react-i18next'
import { Canvas } from '@react-three/fiber';
import { Bounds, Environment, GizmoHelper, GizmoViewport } from '@react-three/drei';
import viewerState from '../../state/ViewerState';
import OpenSimControl from '../pages/OpenSimControl';
import { Suspense } from 'react';
import BottomBar from '../pages/BottomBar';
import AccountTreeTwoToneIcon from '@mui/icons-material/AccountTreeTwoTone'
import VisibilityTwoToneIcon from '@mui/icons-material/VisibilityTwoTone';

import SceneTreeView from '../Components/SceneTreeView';
import FileView from '../Components/FileView';
import ShareView from '../Components/ShareView';
import OpenSimScene from '../pages/OpenSimScene';
import VisualizationControl from '../Components/VisualizationControl';
import { ModelUIState } from '../../state/ModelUIState';
import { observer } from 'mobx-react';
import { MyModelContext } from '../../state/ModelUIStateContext';
import { useModelContext } from '../../state/ModelUIStateContext';

import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(0),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

export function PersistentDrawerLeft() {
  const { t } = useTranslation();
  const theme = useTheme();
  const curState = useModelContext();
  curState.setCurrentModelPath(viewerState.currentModelPath);
  const [uiState] = React.useState<ModelUIState>(curState);
    const [menuOpen, setMenuOpen] = React.useState(false);
  const [selectedTabName, setSelectedTabName] = React.useState<string>("File");

  function toogleOpenMenu(name:string='') {
    // If same name, or empty just toggle.
    if (name === selectedTabName || name === '')
        setMenuOpen(!menuOpen)
    // If different name and not empty, if closed, open.
    else if (name !== '' && !menuOpen)
        setMenuOpen(!menuOpen)
    // Always store same name.
    setSelectedTabName(name)
  }

    const leftMenuWidth = 60;
    const drawerContentWidth = 250;

    const styles = {
      drawer: {
        width: leftMenuWidth + 'px', // Set the width of the Drawer as needed
        top: '68px',
        height: 'calc(100vh - 68px - 7.5vh)',
      },
      drawerContent: {
        width: drawerContentWidth + 'px', // Set the width of the Drawer as needed
        top: '68px',
        height: 'calc(100vh - 68px - 7.5vh)',
        left: leftMenuWidth + 'px'
      },
    };
  return (
    <MyModelContext.Provider value = {uiState}>
    <Box component="div" sx={{ display: 'flex' }}>
      <CssBaseline />

      <Main>

        <Drawer
          variant="persistent"
          anchor="left"
          open={menuOpen}
          ModalProps={{
            container: document.getElementById('canvas-container'), // Make sure to replace 'root' with your app's root container ID
          }}
          PaperProps={{
            style: styles.drawerContent,
          }}>

          {selectedTabName === 'File' && (
            <div style={{ margin: '1em' }}>
              <DrawerHeader>
                <h3>{t('modelView.file')}</h3>
                <IconButton onClick={() => toogleOpenMenu()}>
                  {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton>
              </DrawerHeader>
              <FileView />
            </div>
          )}

          {selectedTabName === 'SceneTreeView' && (
            <div style={{ margin: '1em' }}>
              <DrawerHeader>
                <h3>{t('modelView.sceneTree')}</h3>
                <IconButton onClick={() => toogleOpenMenu()}>
                  {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton>
              </DrawerHeader>
              <SceneTreeView />
            </div>
          )}

          {selectedTabName === 'VisualizationControl' && (
            <div style={{ margin: '1em' }}>
              <DrawerHeader>
                <h3>{t('modelView.visualizationControl')}</h3>
                <IconButton onClick={() => toogleOpenMenu('')}>
                  {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton>
              </DrawerHeader>
              <VisualizationControl
                animationPlaySpeed={1.0}
                animating={uiState.animating}
                animationList={uiState.animations}
              />
            </div>
          )}

          {selectedTabName === 'Share' && (
            <div style={{ margin: '1em' }}>
              <DrawerHeader>
                <h3>{t('modelView.share')}</h3>
                <IconButton onClick={() => toogleOpenMenu('')}>
                  {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton>
              </DrawerHeader>
              <ShareView />
            </div>
          )}
      </Drawer>

      <Drawer
        variant="persistent"
        anchor="left"
        open={true}
        ModalProps={{
          container: document.getElementById('canvas-container'), // Make sure to replace 'root' with your app's root container ID
        }}
        PaperProps={{
          style: styles.drawer,
        }}
      >
          <List  color="inherit">
            <Tooltip title={t('modelView.file')} placement="right">
                <ListItem button onClick={() => toogleOpenMenu('File')}>
                    <TextSnippetIcon />
                </ListItem>
            </Tooltip>
            <Tooltip title={t('modelView.sceneTree')} placement="right">
                <ListItem button onClick={() => toogleOpenMenu('SceneTreeView')}>
                        <AccountTreeTwoToneIcon />
                </ListItem>
            </Tooltip>
            <Tooltip title={t('modelView.visualizationControl')} placement="right">
                <ListItem button onClick={() => toogleOpenMenu('VisualizationControl')}>
                        <VisibilityTwoToneIcon />
                </ListItem>
            </Tooltip>
            <Tooltip title={t('modelView.share')} placement="right">
                <ListItem button onClick={() => toogleOpenMenu('Share')}>
                        <ShareTwoToneIcon />
                </ListItem>
            </Tooltip>
          </List>

        </Drawer>

        <div id="canvas-container">
            <Suspense fallback={null}>
                <Canvas
                    gl={{ preserveDrawingBuffer: true }}
                    shadows="soft"
                    style={{ width: 'calc(100vw - ' + (leftMenuWidth + (menuOpen ? drawerContentWidth : 0)) + 'px)', height: 'calc(100vh - 68px - 7vh)', left: leftMenuWidth + (menuOpen ? drawerContentWidth : 0), transition: 'left 0.1s ease'}}
                    camera={{ position: [1500, 2000, 1000], fov: 75, far: 10000 }}

                >
                    <color attach="background" args={theme.palette.mode === 'dark' ? ['#151518'] : ['#cccccc']} />
                    <Bounds fit clip>
                        <OpenSimScene currentModelPath={viewerState.currentModelPath} supportControls={true}/>
                    </Bounds>
                    <Environment  files="./builtin/potsdamer_platz_1k.hdr" />
                     <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
                        <GizmoViewport labelColor="white" axisHeadScale={1} />
                    </GizmoHelper>
                    <OpenSimControl />
                    <axesHelper visible={uiState.showGlobalFrame} args={[20]} />
            </Canvas>
            </Suspense>
            </div>
            <BottomBar />
      </Main>
    </Box>
    </MyModelContext.Provider>
  );
}

export default observer(PersistentDrawerLeft)