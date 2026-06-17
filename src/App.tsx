import ModelViewPage from './components/pages/ModelViewPage'
import { observer } from 'mobx-react'
//import { Amplify } from 'aws-amplify';
import type { WithAuthenticatorProps } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';
import { useMediaQuery as useResponsiveQuery } from 'react-responsive';
import screenfull from 'screenfull';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './App.css'
import appTheme from './Theme'
import lightTheme from './LightTheme'

import { SnackbarProvider } from 'notistack';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import OpenSimAppBar from './components/Nav/OpenSimAppBar';
import Chart from './components/pages/Chart';
import RegisterPage from './components/pages/RegisterPage';
import LogoutPage from './components/pages/LogoutPage';
import LoginPage from './components/pages/LoginPage';
import HomePage from './components/pages/HomePage';
import AboutPage from './components/pages/AboutPage';
import ModelListPage from './components/pages/ModelListPage/ModelListPage';
import { useModelContext } from './state/ModelUIStateContext';
import DisableZoom from './disableZoom';
// import awsconfig from './aws-exports';
// Amplify.configure(awsconfig);

const useDeviceOrientation = () => {
  const isPortrait = useResponsiveQuery({ query: '(orientation: portrait)' });
  return isPortrait;
};

function App({ signOut, user }: WithAuthenticatorProps) {
  const { t } = useTranslation();

  const isPortrait = useDeviceOrientation();
  const isSmallScreen = useMediaQuery('(max-width:600px)');
  const elementRef = useRef(null);
  const curState = useModelContext();
  const viewerState = curState.viewerState;
  const toggleFullscreen = () => {
    if (screenfull.isEnabled) {
      if (elementRef.current) {
        screenfull.toggle(elementRef.current);
        viewerState.setIsFullScreen(!viewerState.isFullScreen)
      }
    }
  };


      // Parse URL parameters
      const urlParams = new URLSearchParams(window.location.search);

      // Parameter to set gui mode
      const cssParamGui = urlParams.get('css');
      // Parameter to set if the browser being used is modern or not.
      const cssParamModern = urlParams.get('modern')

      // Set gui mode if parameter is present unless we already know in gui mode.
      if (cssParamGui === 'gui') {
        curState.setIsGuiMode(true);
      } else {
        curState.setIsGuiMode(false);
      }
      if (cssParamModern === 'false') {
        curState.setIsModernBrowser(false);
      } else {
        curState.setIsModernBrowser(true);
      }

    React.useEffect(() => {
      if (isSmallScreen && isPortrait && !curState.isGuiMode) {
        // Force landscape mode
        alert(t('app.switch_landscape'));
      }
    }, [isSmallScreen, isPortrait, t, curState.isGuiMode]);

    // / current home page of opensim-viewer with upload and login options
    return (
        <ThemeProvider theme={viewerState.dark ? appTheme : lightTheme}>
          <SnackbarProvider>
            <CssBaseline />
            <DisableZoom />
            {curState.isGuiMode? <ModelViewPage/>:
            <BrowserRouter>
                <div className="App" style={{ width: '100%', overflow: 'auto', backgroundColor: viewerState.dark ? appTheme.palette.background.default : lightTheme.palette.background.default}} ref={elementRef}>
                    <div id="opensim-appbar-visibility" style={{display: curState.isGuiMode ? 'none' : 'default'}}>
                      <OpenSimAppBar dark={viewerState.dark} isLoggedIn={viewerState.isLoggedIn} isFullScreen={viewerState.isFullScreen} toggleFullscreen={toggleFullscreen}/>
                    </div>
                    <div>
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/about" element={<AboutPage />} />
                            <Route
                                path="/models"
                                element={<ModelListPage featuredModelsFilePath={viewerState.featuredModelsFilePath} />}
                            />
                            <Route
                                path="/viewer/:urlParam?"
                                element={<ModelViewPage/>}
                            />
                            <Route
                                path="/log_in"
                                element={<LoginPage isLoggedIn={viewerState.isLoggedIn}/>}
                            />
                            <Route
                                path="/log_out"
                                element={<LogoutPage isLoggedIn={viewerState.isLoggedIn}/>}
                            />
                            <Route
                                path="/register"
                                element={<RegisterPage />}
                            />
                            <Route
                                path="/chart"
                                element={<Chart />}
                            />
                        </Routes>
                    </div>
                </div>
            </BrowserRouter>
            }
          </SnackbarProvider>
        </ThemeProvider>
    )
}

export default observer(App)
