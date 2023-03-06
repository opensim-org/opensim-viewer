import React from 'react';
import HomePage from './components/pages/HomePage';
import AboutPage from './components/pages/AboutPage';
import ModelListPage from './components/pages/ModelListPage';
import ModelViewPage from './components/pages/ModelViewPage';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import './App.css';
import Nav from './components/Nav/Nav';

function App() { 
  return (
      <BrowserRouter>
      <div className="App">
        <Nav />
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
  );
}

export default App;
