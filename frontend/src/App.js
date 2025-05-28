import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Remosa - Система мониторинга</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<div>Главная страница</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 