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
      {currentView === 'map' && (
        <MapPlot
          currentView={currentView}
          setCurrentView={setCurrentView}
          setSelectedCountry={setSelectedCountry}
        />
      )}
      {currentView === 'map' && (
        <MapPlot
          currentView={currentView}
          setCurrentView={setCurrentView}
          setSelectedCountry={setSelectedCountry}
        />
      )}
      {currentView === 'artist-comparison' && <ArtistComparison />}
    </MusicDataProvider>
  )
}

export default App 