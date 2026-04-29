import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import ShareTwoToneIcon from '@mui/icons-material/ShareTwoTone';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import { useTranslation } from 'react-i18next'
import AccountTreeTwoToneIcon from '@mui/icons-material/AccountTreeTwoTone'
import LayersTwoToneIcon from '@mui/icons-material/LayersTwoTone';
import CameraEnhanceIcon from '@mui/icons-material/CameraEnhance';

import SceneTreeView from '../Components/SceneTreeView';
import FileView from '../Components/FileView';
import ShareView from '../Components/ShareView';
import VisualizationControl from '../Components/VisualizationControl';
import RecordView from '../Components/RecordView';
import { ModelUIState } from '../../state/ModelUIState';
import { observer } from 'mobx-react';
import useMediaQuery from '@mui/material/useMediaQuery';

import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';

import { useModelContext } from '../../state/ModelUIStateContext';

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));


type DrawerMenuProps = {
  menuOpen : boolean;
  selectedTabName: string;
  toggleOpenMenu: Function;
  uiState: ModelUIState;
  leftMenuWidth: number;
  drawerContentWidth: number;
}

function DrawerMenu(props :DrawerMenuProps) {
  const { t } = useTranslation();  
  const theme = useTheme();
  const viewerState = useModelContext().viewerState;
  const isExtraSmallScreen = useMediaQuery((theme:any) => theme.breakpoints.only('xs'));
  const isSmallScreen = useMediaQuery((theme:any) => theme.breakpoints.only('sm'));
  const isMediumScreen = useMediaQuery((theme:any) => theme.breakpoints.only('md'));

  const heightBottomBar = isExtraSmallScreen ? 14 : isSmallScreen ? 14 : isMediumScreen ? 7 : 7;

    const styles = {
      drawer: {
        width: props.leftMenuWidth + 'px', // Set the width of the Drawer as needed
        top: '68px',
        height: 'calc(100vh - 68px - ' + heightBottomBar + 'vh)',
      },
      drawerContent: {
        width: props.drawerContentWidth + 'px', // Set the width of the Drawer as needed
        top: '68px',
        height: 'calc(100vh - 68px ' + heightBottomBar + 'vh)',
        left: props.leftMenuWidth + 'px'
      },
    };

    return(
     <>
        <Drawer
          variant="persistent"
          anchor="left"
          open={props.menuOpen}
          ModalProps={{
            container: document.getElementById('canvas-container'), // Make sure to replace 'root' with your app's root container ID
          }}
          PaperProps={{
            style: styles.drawerContent,
          }}>

          {props.selectedTabName === 'File' && (
            <div style={{ margin: '1em' }}>
              <DrawerHeader>
                <h3>{t('modelView.file')}</h3>
                <IconButton onClick={() => props.toggleOpenMenu()}>
                  {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton>
              </DrawerHeader>
              <FileView />
            </div>
          )}

          {props.selectedTabName === 'SceneTreeView' && (
            <div style={{ margin: '1em' }}>
              <DrawerHeader>
                <h3>{t('modelView.sceneTree')}</h3>
                <IconButton onClick={() => props.toggleOpenMenu()}>
                  {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton>
              </DrawerHeader>
              <SceneTreeView />
            </div>
          )}

          {props.selectedTabName === 'VisualizationControl' && (
            <div style={{ margin: '1em' }}>
              <DrawerHeader>
                <h3>{t('modelView.visualizationControl')}</h3>
                <IconButton onClick={() => props.toggleOpenMenu('')}>
                  {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton>
              </DrawerHeader>
              <VisualizationControl />
            </div>
          )}

          {props.selectedTabName === 'Share' && (
            <div style={{ margin: '1em' }}>
              <DrawerHeader>
                <h3>{t('modelView.share')}</h3>
                <IconButton onClick={() => props.toggleOpenMenu('')}>
                  {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton>
              </DrawerHeader>
              <ShareView />
            </div>
          )}

          {props.selectedTabName === 'Record' && (
            <div style={{ margin: '1em' }}>
              <DrawerHeader>
                <h3>{t('modelView.record')}</h3>
                <IconButton onClick={() => props.toggleOpenMenu('')}>
                  {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton>
              </DrawerHeader>
              <RecordView />
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
                <ListItem button onClick={() => props.toggleOpenMenu('File')}>
                    <TextSnippetIcon />
                </ListItem>
            </Tooltip>
            <Tooltip title={t('modelView.sceneTree')} placement="right">
                <ListItem button onClick={() => props.toggleOpenMenu('SceneTreeView')}>
                        <AccountTreeTwoToneIcon />
                </ListItem>
            </Tooltip>
            <Tooltip title={t('modelView.visualizationControl')} placement="right">
                <ListItem button onClick={() => props.toggleOpenMenu('VisualizationControl')}>
                        <LayersTwoToneIcon />
                </ListItem>
            </Tooltip>
            <Tooltip title={t('modelView.record')} placement="right">
                <ListItem button onClick={() => props.toggleOpenMenu('Record')}>
                        <CameraEnhanceIcon />
                </ListItem>
            </Tooltip>
            {viewerState.isLoggedIn && !viewerState.isLocalUpload && (
              <Tooltip title={t('modelView.share')} placement="right">
                  <ListItem button onClick={() => props.toggleOpenMenu('Share')}>
                          <ShareTwoToneIcon />
                  </ListItem>
              </Tooltip>
            )}
          </List>

        </Drawer>
        </>
        )
}

export default observer(DrawerMenu);