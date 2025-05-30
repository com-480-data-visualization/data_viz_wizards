import { useState, useEffect } from 'react'
import { useMusicData } from '../context/MusicDataContext'
import DualRangeSlider from './DualRangeSlider'
import SearchableSelect from './SearchableSelect'
import '../css/CountryStatistics.css'

import LoadingSpinner from './LoadingSpinner'

import '../css/PropertySearch.css'

const PropertySearch = () => {
  const { musicData, loading, error } = useMusicData()
  const [filters, setFilters] = useState({
    tempoMin: 60,
    tempoMax: 200,
    valenceMin: 0,
    valenceMax: 1,
    energyMin: 0,
    energyMax: 1,
    danceabilityMin: 0,
    danceabilityMax: 1,
    acousticsMin: 0,
    acousticsMax: 1,
    genres: [],
    artists: []
  })
  const [suggestions, setSuggestions] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [genres, setGenres] = useState([])
  const [artists, setArtists] = useState([])
  const [showGenreArtistTooltip, setShowGenreArtistTooltip] = useState(false)

  useEffect(() => {
    if (musicData) {
      const uniqueGenres = [...new Set(musicData.map(song => song.Genre).filter(Boolean))]
      const uniqueArtists = [...new Set(musicData.map(song => {
        if (song.Artist) {
          try {
            const artistList = JSON.parse(song.Artist.replace(/'/g, '"'))
            return Array.isArray(artistList) ? artistList[0] : song.Artist
          } catch (e) {
            return song.Artist
          }
        }
        return null
      }).filter(Boolean))]
      
      setGenres(uniqueGenres.sort())
      setArtists(uniqueArtists.sort())
    }
  }, [musicData])

  const handleGenresChange = (updateFunction) => {
    setFilters(prev => ({
      ...prev,
      genres: updateFunction(prev.genres)
    }))
  }

  const handleArtistsChange = (updateFunction) => {
    setFilters(prev => ({
      ...prev,
      artists: updateFunction(prev.artists)
    }))
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleRangeChange = (prefix) => (min, max) => {
    setFilters(prev => ({
      ...prev,
      [`${prefix}Min`]: min,
      [`${prefix}Max`]: max
    }))
  }

  const calculateProximityScore = (value, userMin, userMax, globalMin, globalMax) => {
    if (value >= userMin && value <= userMax) {
      return 1.0
    }
    
    const userCenter = (userMin + userMax) / 2
    const distance = Math.abs(value - userCenter)
    const maxPossibleDistance = Math.max(
      Math.abs(globalMax - userCenter),
      Math.abs(globalMin - userCenter)
    )
    
    return Math.max(0, 1 - (distance / maxPossibleDistance))
  }

  const calculateMultiCategoricalScore = (songValue, filterValues) => {
    if (!filterValues || filterValues.length === 0) return 1.0
    
    if (filterValues.includes(songValue)) return 1.0
    
    return 0.2
  }

  const searchSongs = () => {
    if (!musicData) return
    
    setHasSearched(true)

    // Filter songs that match the user's criteria
    const filteredSongs = musicData.filter(song => {
      const tempo = parseFloat(song.tempo) || 0
      const valence = parseFloat(song.valence) || 0
      const energy = parseFloat(song.energy) || 0
      const danceability = parseFloat(song.danceability) || 0
      const acoustics = parseFloat(song.acoustics) || 0
      
      let artistName = 'Unknown'
      if (song.Artist) {
        try {
          const artistList = JSON.parse(song.Artist.replace(/'/g, '"'))
          artistName = Array.isArray(artistList) ? artistList[0] : song.Artist
        } catch (e) {
          artistName = song.Artist
        }
      }

      // Check if song meets all filter criteria
      const tempoMatch = tempo >= filters.tempoMin && tempo <= filters.tempoMax
      const valenceMatch = valence >= filters.valenceMin && valence <= filters.valenceMax
      const energyMatch = energy >= filters.energyMin && energy <= filters.energyMax
      const danceabilityMatch = danceability >= filters.danceabilityMin && danceability <= filters.danceabilityMax
      const acousticsMatch = acoustics >= filters.acousticsMin && acoustics <= filters.acousticsMax
      
      // Genre: if genres selected, song must match one of them
      const genreMatch = filters.genres.length === 0 || filters.genres.includes(song.Genre)
      
      // Artist: if artists selected, song must be by one of them  
      const artistMatch = filters.artists.length === 0 || filters.artists.includes(artistName)

      return tempoMatch && valenceMatch && energyMatch && danceabilityMatch && 
             acousticsMatch && genreMatch && artistMatch
    })

    // Convert to our format and remove duplicates
    const formattedSongs = filteredSongs.map(song => {
      let artistName = 'Unknown'
      if (song.Artist) {
        try {
          const artistList = JSON.parse(song.Artist.replace(/'/g, '"'))
          artistName = Array.isArray(artistList) ? artistList[0] : song.Artist
        } catch (e) {
          artistName = song.Artist
        }
      }
      
      return {
        title: song.Title || 'Unknown',
        artist: artistName,
        uri: song.Uri || '',
        popularity: parseFloat(song.Popularity) || 0,
        tempo: parseFloat(song.tempo) || 0,
        valence: parseFloat(song.valence) || 0,
        energy: parseFloat(song.energy) || 0,
        danceability: parseFloat(song.danceability) || 0,
        acoustics: parseFloat(song.acoustics) || 0,
        genre: song.Genre || 'Unknown',
        uniqueKey: `${(song.Title || 'Unknown').toLowerCase()}-${artistName.toLowerCase()}`
      }
    })

    // Remove duplicates
    const uniqueSongs = []
    const seenKeys = new Set()
    
    for (const song of formattedSongs) {
      if (!seenKeys.has(song.uniqueKey)) {
        seenKeys.add(song.uniqueKey)
        uniqueSongs.push(song)
      }
    }

    // Randomly shuffle and take 5
    const randomSongs = uniqueSongs
      .sort(() => Math.random() - 0.5)  // Random shuffle
      .slice(0, 5)

    setSuggestions(randomSongs)
  }

  const handleSongClick = (song) => {
    if (song.uri && song.uri.length > 0) {
      window.open(song.uri, '_blank', 'noopener,noreferrer')
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <div>Error loading data: {error.message}</div>

  return (
    <div className="property-search">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">🎶 Music Discovery</h1>
          <p className="dashboard-subtitle">Get personalized song recommendations by setting your musical preferences!</p>
        </div>
      </div>

      <div className="filters-container">
        <div className="recommendation-intro">
          <p>
            🎵 <strong>Discover your next favorite songs!</strong> Set your preferences below and we'll recommend 
            5 songs that match your taste. You can select multiple genres and artists to broaden your discovery.
          </p>
        </div>

        <div className="filter-section">
          <div className="filter-section-header">
            <div className="range-label-container">
              <h3>🎭 Genre & Artist</h3>
              <div className="info-button-container">
                <button 
                  className="info-button"
                  onMouseEnter={() => setShowGenreArtistTooltip(true)}
                  onMouseLeave={() => setShowGenreArtistTooltip(false)}
                  onClick={(e) => e.preventDefault()}
                >
                  ℹ️
                </button>
                {showGenreArtistTooltip && (
                  <div className="info-tooltip">
                    Leave empty to explore all genres and artists. Select specific ones to focus your recommendations.
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="multi-select-inputs">
            <div className="multi-select-group">
              <label>Genres:</label>
              <SearchableSelect
                options={genres}
                selectedValues={filters.genres}
                onChange={handleGenresChange}
                placeholder="Search and select genres..."
                multiple={true}
              />
            </div>
            <div className="multi-select-group">
              <label>Artists:</label>
              <SearchableSelect
                options={artists}
                selectedValues={filters.artists}
                onChange={handleArtistsChange}
                placeholder="Search and select artists..."
                multiple={true}
              />
            </div>
          </div>
        </div>

        <DualRangeSlider
          min={60}
          max={200}
          step={1}
          minValue={filters.tempoMin}
          maxValue={filters.tempoMax}
          onChange={handleRangeChange('tempo')}
          formatValue={(value) => `${value} BPM`}
          label="🎼 Tempo Range"
          infoText="Tempo measures the speed of a song in beats per minute (BPM). Low values (60-90) = slow ballads, medium values (90-140) = moderate pop/rock, high values (140-200) = fast dance/electronic music."
        />

        <DualRangeSlider
          min={0}
          max={1}
          step={0.1}
          minValue={filters.valenceMin}
          maxValue={filters.valenceMax}
          onChange={handleRangeChange('valence')}
          formatValue={(value) => value.toFixed(1)}
          label="😊 Valence (Mood)"
          infoText="Valence measures the musical positivity of a track. High valence (0.7-1.0) = happy, cheerful, euphoric songs. Low valence (0.0-0.3) = sad, depressed, angry songs. Medium valence (0.3-0.7) = neutral mood."
        />

        <DualRangeSlider
          min={0}
          max={1}
          step={0.1}
          minValue={filters.energyMin}
          maxValue={filters.energyMax}
          onChange={handleRangeChange('energy')}
          formatValue={(value) => value.toFixed(1)}
          label="⚡ Energy"
          infoText="Energy represents the intensity and power of a song. High energy (0.7-1.0) = fast, loud, noisy tracks (rock, metal, EDM). Low energy (0.0-0.3) = soft, quiet, ambient tracks (classical, acoustic). Based on loudness, timbre, and dynamics."
        />

        <DualRangeSlider
          min={0}
          max={1}
          step={0.1}
          minValue={filters.danceabilityMin}
          maxValue={filters.danceabilityMax}
          onChange={handleRangeChange('danceability')}
          formatValue={(value) => value.toFixed(1)}
          label="💃 Danceability"
          infoText="Danceability describes how suitable a track is for dancing. High danceability (0.7-1.0) = strong rhythm, stable beat, regular tempo (pop, disco, reggaeton). Low danceability (0.0-0.3) = irregular rhythm, complex time signatures (classical, experimental)."
        />

        <DualRangeSlider
          min={0}
          max={1}
          step={0.1}
          minValue={filters.acousticsMin}
          maxValue={filters.acousticsMax}
          onChange={handleRangeChange('acoustics')}
          formatValue={(value) => value.toFixed(1)}
          label="🎸 Acoustics"
          infoText="Acousticness measures whether the track is acoustic or electronic. High acousticness (0.7-1.0) = acoustic instruments, live recording (folk, unplugged, classical). Low acousticness (0.0-0.3) = electronic production, synthesizers, effects (EDM, hip-hop, pop)."
        />

        <button className="search-button" onClick={searchSongs}>
          🎲 Get My Recommendations
        </button>
      </div>

      {hasSearched && (
        <>
          {suggestions.length > 0 ? (
            <div className="suggestions-container">
              <h2>🎶 Your Personalized Recommendations</h2>
              <p className="recommendations-subtitle">
                Here are 5 songs we think you'll love based on your preferences:
              </p>
              <div className="suggestions-list">
                {suggestions.map((song, index) => (
                  <div 
                    key={index} 
                    className={`suggestion-card ${song.uri ? 'clickable' : ''}`}
                    onClick={() => handleSongClick(song)}
                    style={song.uri ? { cursor: 'pointer' } : {}}
                  >
                    <div className="song-rank">{index + 1}</div>
                    <div className="song-info">
                      <h4>
                        {song.title.charAt(0).toUpperCase() + song.title.slice(1)} {song.uri ? '🎵' : ''}
                      </h4>
                      <p>by {song.artist}</p>
                      <div className="song-properties">
                        <span>Genre: {song.genre}</span>
                        <span>Tempo: {song.tempo.toFixed(0)} BPM</span>
                        <span>Energy: {song.energy.toFixed(1)}</span>
                        <span>Valence: {song.valence.toFixed(1)}</span>
                        <span>Danceability: {song.danceability.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-results-container">
              <div className="no-results-content">
                <h2>🎯 No Songs Found</h2>
                <p>
                  The restrictions are too tight, please try to change some parameters.
                </p>
                <div className="suggestions-list-alternative">
                  <div className="suggestion">💡 Try widening your tempo or musical attribute ranges</div>
                  <div className="suggestion">💡 Remove some genre or artist selections</div>
                  <div className="suggestion">💡 Adjust your energy, valence, or danceability ranges</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PropertySearch 