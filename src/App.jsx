import { useState } from 'react'
import MapPlot from './components/MapPlot'
import CountryStatistics from './components/CountryStatistics'
import PropertySearch from './components/PropertySearch'
import ArtistComparison from './components/ArtistComparison'
import Navigation from './components/Navigation'
import { MusicDataProvider } from './context/MusicDataContext'
import DatasetOverview from './components/DatasetOverview'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('map')
  const [selectedCountry, setSelectedCountry] = useState(null)

  return (
    <MusicDataProvider>
      <div
        className="app-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh'
        }}
      >
        <div>
          <Navigation
            currentView={currentView}
            setCurrentView={setCurrentView}
          />
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
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
          {currentView === 'property-search' && <PropertySearch />}

          {currentView === 'artist-comparison' 
          && <ArtistComparison />}
          {currentView === 'dataset-overview' && (
          <DatasetOverview />
        )}
        </div>
      </div>
    </MusicDataProvider>
  )
}

export default App 