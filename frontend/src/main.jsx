import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { GameProvider } from './context/GameContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <GameProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </GameProvider>
    </ThemeProvider>
  </React.StrictMode>
);
