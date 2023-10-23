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
import { Amplify } from 'aws-amplify';
import type { WithAuthenticatorProps } from '@aws-amplify/ui-react';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import awsconfig from './aws-exports';
Amplify.configure(awsconfig);

function App({ signOut, user }: WithAuthenticatorProps) {

    // On file system we'll have a folder per model containing cached/versioned gltf, possibly .osim file, data files, display 
    // preferences
    // urls could be something like:
    // The Desktop Application can retrieve (an API operation)
    // without necessarily viewing online
    //
    ///models/  # will show list personal models
    ///models/id/ = retrieve_model(id) # retrieve specfic model
    ///models/upload = create_model
    ///viewer/ show model gallery of personal models, or stock models if not logged-in
    ///viewer/id  show model id in 3D view
    ///viewer = redirect to viewer/DEFAULT_MODEL/ 
    // / current home page of opensim-viewer with upload and login options
    return (
        <ThemeProvider theme={viewerState.dark ? appTheme : lightTheme}>
            <CssBaseline />
            <BrowserRouter>
                <div className="App" style={{ width: '100%'}}>
                    <OpenSimAppBar dark={viewerState.dark} isLoggedIn={viewerState.isLoggedIn} />
                    <div>
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/about" element={<AboutPage />} />
                            <Route
                                path="/models"
                                element={<ModelListPage featuredModelsFilePath={viewerState.featuredModelsFilePath} />}
                            />
                            <Route
                                path="/viewer"
                                element={<ModelViewPage />}
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
        </ThemeProvider>
    )
}

export default observer( withAuthenticator(App))
