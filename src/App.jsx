import { useState } from 'react'
import MapPlot from './components/MapPlot'
import CountryStatistics from './components/CountryStatistics'
import ArtistComparison from './components/ArtistComparison'
import Navigation from './components/Navigation'
import { MusicDataProvider } from './context/MusicDataContext'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('map')

  return (
    <MusicDataProvider>
      <div className="app">
        <h1>Popularity of different Genres, Artists and Songs across the World</h1>
        <Navigation currentView={currentView} setCurrentView={setCurrentView} />
        
        {currentView === 'map' && <MapPlot />}
        {currentView === 'country-stats' && <CountryStatistics />}
        {currentView === 'artist-comparison' && <ArtistComparison />}
      </div>
    </MusicDataProvider>
  )
}

export default App 