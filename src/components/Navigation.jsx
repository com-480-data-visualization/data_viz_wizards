const Navigation = ({ currentView, setCurrentView }) => {
  return (
    <nav className="navigation">
      <button
        style={{ marginRight: '10px' }}
        className={currentView === 'map' ? 'active' : ''}
        onClick={() => setCurrentView('map')}
      >
        World Map
      </button>
      <button
        style={{ marginRight: '10px' }}
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