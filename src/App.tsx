import HomePage from './components/pages/HomePage';
import AboutPage from './components/pages/AboutPage';
import ModelListPage from './components/pages/ModelListPage';
import ModelViewPage from './components/pages/ModelViewPage';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import './App.css';

import {
  ThemeProvider,
  CssBaseline
} from "@mui/material";
import appTheme from './Theme';
import lightTheme from './LightTheme';
import OpenSimAppBar from './components/Nav/OpenSimAppBar';
import React from 'react';

function App() { 

  const [dark, setDark] = React.useState(true);
  window.addEventListener("keyup", (event) => {
    if (event.code==='KeyD'){ // P for print screen
      setDark(!dark);
    }
  });
  return (
    <ThemeProvider theme={dark?appTheme:lightTheme}>
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
