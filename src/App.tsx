import HomePage from './components/pages/HomePage'
import AboutPage from './components/pages/AboutPage'
import ModelListPage from './components/pages/ModelListPage/ModelListPage'
import ModelViewPage from './components/pages/ModelViewPage'
import LoginPage from './components/pages/LoginPage'
import LogoutPage from './components/pages/LogoutPage'
import RegisterPage from './components/pages/RegisterPage'
import Chart from './components/pages/Chart'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import { observer } from 'mobx-react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import appTheme from './Theme'
import lightTheme from './LightTheme'
import OpenSimAppBar from './components/Nav/OpenSimAppBar'
import viewerState from './state/ViewerState'
import { SnackbarProvider } from 'notistack'
import { Amplify } from 'aws-amplify';
import type { WithAuthenticatorProps } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useMediaQuery } from '@mui/material';
import { useMediaQuery as useResponsiveQuery } from 'react-responsive';
import screenfull from 'screenfull';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import awsconfig from './aws-exports';
Amplify.configure(awsconfig);

const useDeviceOrientation = () => {
  const isPortrait = useResponsiveQuery({ query: '(orientation: portrait)' });
  return isPortrait;
};

function App({ signOut, user }: WithAuthenticatorProps) {
  const { t } = useTranslation();
  const isPortrait = useDeviceOrientation();
  const isSmallScreen = useMediaQuery('(max-width:600px)');
  const elementRef = useRef(null);

  const toggleFullscreen = () => {
    if (screenfull.isEnabled) {
      if (elementRef.current) {
        screenfull.toggle(elementRef.current);
        viewerState.setIsFullScreen(!viewerState.isFullScreen)
      }
    }
  };

  React.useEffect(() => {
    if (isSmallScreen && isPortrait) {
      // Force landscape mode
      alert(t('app.switch_landscape'));
    }
  }, [isSmallScreen, isPortrait, t]);
    // On file system we'll have a folder per model containing cached/versioned gltf, possibly .osim file, data files, display 
    // preferences
    // urls could be something like:
    // The Desktop Application can retrieve (an API operation)
    // without necessarily viewing online
    //
    ///models/  # will show list personal models
    ///models/id/ = retrieve_model(id) # retrieve specfic model
    ///viewer/ show model gallery of personal models, or stock models if not logged-in
    ///viewer/url  show model specified by url in 3D view
    ///viewer = redirect to viewer/DEFAULT_MODEL/ 
    // / current home page of opensim-viewer with upload and login options
    return (
        <ThemeProvider theme={viewerState.dark ? appTheme : lightTheme}>
          <SnackbarProvider>
            <CssBaseline />
            <BrowserRouter>
                <div className="App" style={{ width: '100%', overflow: 'auto', backgroundColor: viewerState.dark ? appTheme.palette.background.default : lightTheme.palette.background.default}} ref={elementRef}>
                    <OpenSimAppBar dark={viewerState.dark} isLoggedIn={viewerState.isLoggedIn} isFullScreen={viewerState.isFullScreen} toggleFullscreen={toggleFullscreen}/>
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
                                element={<ModelViewPage />}
                            />
                            <Route
                                path="/embed-viewer/:urlParam?"
                                element={<ModelViewPage embedded={true} noFloor={true} />}
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
          </SnackbarProvider>
        </ThemeProvider>
    )
}

export default observer(App)
