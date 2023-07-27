import HomePage from './components/pages/HomePage'
import AboutPage from './components/pages/AboutPage'
import ModelListPage from './components/pages/ModelListPage/ModelListPage'
import ModelViewPage from './components/pages/ModelViewPage'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import { observer } from 'mobx-react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import appTheme from './Theme'
import lightTheme from './LightTheme'
import OpenSimAppBar from './components/Nav/OpenSimAppBar'
import React, { useEffect } from 'react'
import viewerState from './state/ViewerState'

function App() {

    useEffect(() => {
        // Event that switches between dark and light mode when the letter D is pressed.
        const handleKeyDUp = (event: KeyboardEvent) => {
            if (event.code === 'KeyD') {
                viewerState.setDark(!viewerState.dark)
            }
        }

        // Register the event to "keyup" when the element is mount
        window.addEventListener('keyup', handleKeyDUp)

        return () => {
            // Unregister the event when the element is unmount.
            window.removeEventListener('keyup', handleKeyDUp)
        }
    }, [])
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
                    <OpenSimAppBar dark={viewerState.dark} />
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
                                element={<ModelViewPage curentModelPath={viewerState.currentModelPath} />}
                            />
                        </Routes>
                    </div>
                </div>
            </BrowserRouter>
        </ThemeProvider>
    )
}

export default observer(App)
