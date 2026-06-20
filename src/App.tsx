import React from 'react';
import Header from './components/Header';
import Home from './pages/Home';
import TrainTrack from './pages/TrainTrack';
import Resume from './pages/Resume';

export default function App(){
  const path = window.location.pathname;
  return (
    <div>
      <Header />
      {path === '/traintrack' || path === '/traintrack/' ? <TrainTrack /> : path === '/resume' || path === '/resume/' ? <Resume /> : <Home />}
    </div>
  );
}
