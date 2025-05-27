import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useMusicData } from '../context/MusicDataContext'
import SearchableSelect from './SearchableSelect'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, Tooltip } from 'recharts'
import '../css/ArtistComparison.css'

const ArtistComparison = () => {
  const svgRef = useRef(null)
  const { musicData, loading, error } = useMusicData()
  const [artists, setArtists] = useState([])
  const [selectedArtists, setSelectedArtists] = useState([])
  const [artistStats, setArtistStats] = useState({})

  // Color palette for multiple artists
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', 
    '#ff00ff', '#00ffff', '#ff0000', '#0000ff', '#ffff00'
  ]

  const parseArtistString = (artistStr) => {
    try {
      // Remove the outer square brackets and split by comma
      const cleanStr = artistStr.replace(/[\[\]]/g, '')
      // Split by comma and clean up each artist name
      return cleanStr.split(',')
        .map(artist => {
          // First trim whitespace
          let cleanArtist = artist.trim()
          // Remove single quotes at the start and end
          cleanArtist = cleanArtist.replace(/^'|'$/g, '')
          // Remove double quotes at the start and end
          cleanArtist = cleanArtist.replace(/^"|"$/g, '')
          return cleanArtist
        })
        .filter(artist => artist) // Remove empty strings
    } catch (error) {
      console.error('Error parsing artist string:', artistStr, error)
      return []
    }
  }

  useEffect(() => {
    if (musicData) {
      // Extract all unique artists from the arrays
      const allArtists = new Set()
      musicData.forEach(song => {
        const songArtists = parseArtistString(song.Artist)
        songArtists.forEach(artist => {
          if (artist) {
            allArtists.add(artist)
          }
        })
      })
      
      // Convert to array and sort
      const uniqueArtists = Array.from(allArtists).sort((a, b) => a.localeCompare(b))
      
      console.log('Processed artists:', {
        totalArtists: uniqueArtists.length,
        sampleArtists: uniqueArtists.slice(0, 5)
      })
      
      setArtists(uniqueArtists)
    }
  }, [musicData])

  useEffect(() => {
    if (musicData && selectedArtists.length > 0) {
      const stats = {}
      
      const calculateArtistStats = (artist) => {
        if (!artist) return null;
        
        const artistSongs = musicData.filter(song => {
          const songArtists = parseArtistString(song.Artist)
          return songArtists.includes(artist)
        })
        
        const attributes = {
          danceability: 0,
          energy: 0,
          speechiness: 0,
          acoustics: 0,
          instrumentalness: 0,
          liveliness: 0,
          valence: 0,
          tempo: 0
        }
        
        artistSongs.forEach(song => {
          attributes.danceability += parseFloat(song.danceability) || 0
          attributes.energy += parseFloat(song.energy) || 0
          attributes.speechiness += parseFloat(song.speechiness) || 0
          attributes.acoustics += parseFloat(song.acoustics) || 0
          attributes.instrumentalness += parseFloat(song.instrumentalness) || 0
          attributes.liveliness += parseFloat(song.liveliness) || 0
          attributes.valence += parseFloat(song.valence) || 0
          attributes.tempo += parseFloat(song.tempo) || 0
        })
        
        Object.keys(attributes).forEach(key => {
          attributes[key] = attributes[key] / artistSongs.length
        })
        
        return {
          attributes,
          songCount: artistSongs.length
        }
      }

      selectedArtists.forEach(artist => {
        stats[artist] = calculateArtistStats(artist)
      })
      
      setArtistStats(stats)
    } else {
      setArtistStats({})
    }
  }, [musicData, selectedArtists])

  const handleArtistChange = (values) => {
    setSelectedArtists(values)
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error loading data: {error.message}</div>

  return (
    <div className="artist-comparison-container">
      <div className="artist-selectors">
        <div className="artist-selector">
          <h3>Select Artists</h3>
          <SearchableSelect
            options={artists}
            selectedValues={selectedArtists}
            onChange={handleArtistChange}
            placeholder="Search artists..."
            label="Select artists to compare"
            multiple={true}
          />
        </div>
      </div>
      <div className="artist-stats-comparison">
        {selectedArtists.length > 0 && (
          <div className="radar-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={(() => {
                if (selectedArtists.length === 0) return [];
                
                const attributes = ['danceability', 'energy', 'speechiness', 'acoustics', 
                                 'instrumentalness', 'liveliness', 'valence'];
                
                return attributes.map(attr => {
                  const dataPoint = { attribute: attr };
                  selectedArtists.forEach(artist => {
                    if (artistStats[artist]?.attributes) {
                      dataPoint[artist] = artistStats[artist].attributes[attr];
                    }
                  });
                  return dataPoint;
                });
              })()}>
                <PolarGrid />
                <PolarAngleAxis dataKey="attribute" />
                <PolarRadiusAxis angle={30} domain={[0, 1]} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip">
                          <p className="tooltip-label">{label}</p>
                          {payload.map((entry, index) => (
                            <p key={index} style={{ color: entry.color }}>
                              {entry.name}: {entry.value.toFixed(3)}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {selectedArtists.map((artist, index) => (
                  <Radar
                    key={artist}
                    name={artist}
                    dataKey={artist}
                    stroke={colors[index % colors.length]}
                    fill={colors[index % colors.length]}
                    fillOpacity={0.3}
                  />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
            <div className="artist-stats-info">
              {selectedArtists.map((artist) => (
                <div key={artist} className="artist-stat-info">
                  <h4>{artist}</h4>
                  <p>Number of songs: {artistStats[artist]?.songCount || 0}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ArtistComparison 