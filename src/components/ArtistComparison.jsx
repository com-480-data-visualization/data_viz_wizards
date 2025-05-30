import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useMusicData } from '../context/MusicDataContext'
import VirtualizedSelect from './VirtualizedSelect'
import RankJitterPlot from './RankJitterPlot'
import RadarChart from './RadarChart'
import LoadingSpinner from './LoadingSpinner'
import '../css/ArtistComparison.css'
import '../css/CountryStatistics.css'

const ArtistComparison = () => {
  const svgRef = useRef(null)
  const { artists, calculateArtistStats, loading, error } = useMusicData()
  const [selectedArtists, setSelectedArtists] = useState(["Drake", "Kendrick Lamar", "Lana Del Rey", "A$AP Rocky"])
  const [artistStats, setArtistStats] = useState({})

  useEffect(() => {
    if (selectedArtists.length > 0) {
      const stats = {}
      
      selectedArtists.forEach(artist => {
        stats[artist] = calculateArtistStats(artist)
      })
      
      setArtistStats(stats)
    } else {
      setArtistStats({})
    }
  }, [selectedArtists, calculateArtistStats])

  const handleArtistChange = (values) => {
    setSelectedArtists(values)
  }

  if (loading) return <LoadingSpinner />
  if (error) return <div className="error">Error loading data: {error.message}</div>
  return (
    <div className="artist-comparison-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Artist Comparison Dashboard</h1>
          <p className="dashboard-subtitle">Compare Musical Attributes Across Multiple Artists</p>
        </div>
      </div>

      <div className="selector-section">
        <div className="selector-header">
          <h3 className="selector-title">Select Artists to Compare</h3>
          <p className="selector-subtitle">Choose up to four artists to compare</p>
        </div>
        <VirtualizedSelect
          options={artists}
          value={selectedArtists}
          onChange={handleArtistChange}
          placeholder="Search artists..."
          isMulti={true}
          isSearchable={true}
          closeMenuOnSelect={false}
          hideSelectedOptions={false}
          maxSelections={4}
          noOptionsMessage={({ inputValue }) =>
            inputValue ? `No artists found matching "${inputValue}"` : 'Type to search artists'
          }
        />
      </div>

      {selectedArtists.length > 0 && (
        <div className="comparison-section">
          <RadarChart 
            selectedArtists={selectedArtists}
            artistStats={artistStats}
          />

          <RankJitterPlot 
            selectedArtists={selectedArtists}
            artistStats={artistStats}
          />
        </div>
      )}

      {selectedArtists.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-content">
            <h3>No Artists Selected</h3>
            <p>Select one or more artists above to begin comparing their musical attributes</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ArtistComparison 