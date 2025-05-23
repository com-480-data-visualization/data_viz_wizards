import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useMusicData } from '../context/MusicDataContext'
import SearchableSelect from './SearchableSelect'

const ArtistComparison = () => {
  const svgRef = useRef(null)
  const { musicData, loading, error } = useMusicData()
  const [artists, setArtists] = useState([])
  const [selectedArtists, setSelectedArtists] = useState([])

  useEffect(() => {
    if (musicData) {
      // Get unique artists
      const uniqueArtists = [...new Set(musicData.map(d => d.Artist))]
      setArtists(uniqueArtists)
    }
  }, [musicData])

  useEffect(() => {
    if (musicData && selectedArtists.length > 0) {
      const artistData = musicData.filter(d => selectedArtists.includes(d.Artist))
      updateVisualization(artistData)
    }
  }, [musicData, selectedArtists])

  const updateVisualization = (artistData) => {
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    // Add your D3 visualization code here
    // This will be similar to the original artist comparison visualization
    // but adapted for React and using the refs
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error loading data: {error.message}</div>

  return (
    <div className="artist-comparison-container">
      <div className="artist-selector">
        <h3>Select Artists to Compare</h3>
        <SearchableSelect
          options={artists}
          selectedValues={selectedArtists}
          onChange={setSelectedArtists}
          placeholder="Search artists..."
          label="Select artists to compare"
          multiple={true}
        />
      </div>
      {selectedArtists.length > 0 && (
        <svg ref={svgRef} width="960" height="500"></svg>
      )}
    </div>
  )
}

export default ArtistComparison 