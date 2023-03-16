import React from 'react';
import HomePage from './components/pages/HomePage';
import AboutPage from './components/pages/AboutPage';
import ModelListPage from './components/pages/ModelListPage';
import ModelViewPage from './components/pages/ModelViewPage';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import './App.css';
import Nav from './components/Nav/Nav';

import {
  Button,
  Paper,
  ThemeProvider,
  CssBaseline
} from "@mui/material";
import appTheme from './Theme';
import OpenSimAppBar from './components/Nav/OpenSimAppBar';

function App() { 

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
        <BrowserRouter>
        <div className="App">
          <OpenSimAppBar />
          <div>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/models" element={<ModelListPage />} />
              <Route path="/viewer" element={<ModelViewPage />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
