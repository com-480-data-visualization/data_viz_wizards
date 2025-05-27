import './Navigation.css'

const Navigation = ({ currentView, setCurrentView }) => {
  return (
    <nav className="navigation">
      <button
        className={currentView === 'map' ? 'active' : ''}
        onClick={() => setCurrentView('map')}
      >
        World Map
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
    </nav>
  )
}

export default Navigation 