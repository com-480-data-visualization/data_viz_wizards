import { useState } from 'react'
import MapPlot from './components/MapPlot'
import CountryStatistics from './components/CountryStatistics'
import ArtistComparison from './components/ArtistComparison'
import Navigation from './components/Navigation'
import { MusicDataProvider } from './context/MusicDataContext'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('map')
  const [selectedCountry, setSelectedCountry] = useState(null)

  return (
    <MusicDataProvider>
      <div className="app-container">
        <Navigation currentView={currentView} setCurrentView={setCurrentView} />
        {currentView === 'map' && (
          <MapPlot
            currentView={currentView}
            setCurrentView={setCurrentView}
            setSelectedCountry={setSelectedCountry}
          />
        )}
        {currentView === 'country-stats' && (
          <CountryStatistics selectedCountry={selectedCountry} />
        )}
        {currentView === 'artist-comparison' && <ArtistComparison />}
      </div>
    </MusicDataProvider>
  )
}

export default App 