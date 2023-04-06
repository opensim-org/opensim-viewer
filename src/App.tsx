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
import React, { useEffect } from 'react';

function App() { 

  const [dark, setDark] = React.useState(true);

  useEffect(() => {
    // Event that switches between dark and light mode when the letter D is pressed.
    const handleKeyDUp = (event: KeyboardEvent) => {
      if (event.code === "KeyD") {
        setDark((dark) => !dark);
      }
    };

    // Register the event to "keyup" when the element is mount
    window.addEventListener("keyup", handleKeyDUp);

    return () => {
      // Unregister the event when the element is unmount.
      window.removeEventListener("keyup", handleKeyDUp);
    };
  }, []);

  console.log("Rendering")

  return (
    <ThemeProvider theme={dark?appTheme:lightTheme}>
      <CssBaseline />
        <BrowserRouter>
        <div className="App">
          <OpenSimAppBar dark={dark}/>
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
