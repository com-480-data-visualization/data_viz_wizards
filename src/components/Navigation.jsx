import '../css/Navigation.css'

const Navigation = ({ currentView, setCurrentView }) => {
  return (
    <nav className="navigation">
      <button
        className={currentView === 'map' ? 'active' : ''}
        onClick={() => setCurrentView('map')}
      >
        Globe
      </button>
      <button
        className={currentView === 'country-stats' ? 'active' : ''}
        onClick={() => setCurrentView('country-stats')}
      >
        Country Statistics
      </button>
      <button
        className={currentView === 'artist-comparison' ? 'active' : ''}
        onClick={() => setCurrentView('artist-comparison')}
      >
        Artist Comparison
      </button>
      <button
        className={currentView === 'property-search' ? 'active' : ''}
        onClick={() => setCurrentView('property-search')}
      >
        Music Discovery
      </button>
      <button
        className={currentView === 'dataset-overview' ? 'active' : ''}
        onClick={() => setCurrentView('dataset-overview')}
      >
        Dataset
      </button>
    </nav>
  )
}

export default Navigation 