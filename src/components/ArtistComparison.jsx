import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useMusicData } from '../context/MusicDataContext'
import SearchableSelect from './SearchableSelect'
import RankJitterPlot from './RankJitterPlot'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, Tooltip } from 'recharts'
import '../css/ArtistComparison.css'

const ArtistComparison = () => {
  const svgRef = useRef(null)
  const { artists, calculateArtistStats, loading, error } = useMusicData()
  const [selectedArtists, setSelectedArtists] = useState(["Drake", "Kendrick Lamar", "Lana Del Rey", "A$AP Rocky"])
  const [artistStats, setArtistStats] = useState({})
  const [tooltipContent, setTooltipContent] = useState(null)
  const [hoveredAttribute, setHoveredAttribute] = useState(null)

  // Feature descriptions and level descriptions
  const featureDescriptions = {
    danceability: {
      tooltip: "How dance-friendly a track is, from very rigid to groove-filled.",
      levels: {
        low: "Tracks feel rigid or uneven for dancing.",
        medium: "Moderately danceable—steady beat but not urgent.",
        high: "Very danceable—strong groove and steady rhythm."
      }
    },
    energy: {
      tooltip: "Perceived intensity: volume, tempo, and dynamic activity.",
      levels: {
        low: "Calm or minimal activity.",
        medium: "Moderately intense—some punch, not overwhelming.",
        high: "High-octane: loud, fast, and driving."
      }
    },
    speechiness: {
      tooltip: "How vocal/speech-like the track is (e.g. talk vs. singing vs. rap).",
      levels: {
        low: "Mostly music, little to no speech.",
        medium: "Mix of singing and spoken/rap sections.",
        high: "Predominantly spoken word (podcast/rap)."
      }
    },
    acoustics: {
      tooltip: "Confidence that the track is acoustic (no electric/processed sounds).",
      levels: {
        low: "Almost no acoustic elements.",
        medium: "Blend of acoustic and electronic production.",
        high: "Predominantly acoustic (guitar, piano, etc.)."
      }
    },
    liveliness: {
      tooltip: "Probability an audience is present (live vs. studio recording).",
      levels: {
        low: "Studio-clean, no crowd noise.",
        medium: "Some live ambience or crowd hints in mix.",
        high: "Strong live feel—audience noise & hall reverb."
      }
    },
    valence: {
      tooltip: "Musical positiveness: happy/cheerful vs. sad/angry mood.",
      levels: {
        low: "Darker or more negative mood.",
        medium: "Mixed emotions—neither overtly happy nor sad.",
        high: "Bright, upbeat, and cheerful."
      }
    }
  }

  // Function to determine value level
  const getValueLevel = (value) => {
    if (value <= 0.33) return 'low'
    if (value <= 0.66) return 'medium'
    return 'high'
  }

  // Emoji mappings for attributes
  const attributeEmojis = {
    danceability: '💃',
    energy: '⚡️',
    speechiness: '🗣️',
    acoustics: '🎸',
    liveliness: '🎤',
    valence: '😊'
  }

  // Color palette for multiple artists
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', 
    '#ff00ff', '#00ffff', '#ff0000', '#0000ff', '#ffff00'
  ]

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

  if (loading) return <div className="loading">Loading...</div>
  if (error) return <div className="error">Error loading data: {error.message}</div>

  return (
    <div className="artist-comparison-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Artist Comparison Dashboard</h1>
          <p className="dashboard-subtitle">Compare Musical Attributes Across Multiple Artists</p>
        </div>
        <div className="dashboard-note">
          Interactive Radar Chart Analysis
        </div>
      </div>

      <div className="artist-selector-section">
        <div className="selector-header">
          <h3 className="selector-title">Select Artists to Compare</h3>
          <p className="selector-subtitle">Choose multiple artists to analyze their musical attributes</p>
        </div>
        <SearchableSelect
          options={artists}
          selectedValues={selectedArtists}
          onChange={handleArtistChange}
          placeholder="Search artists..."
          label="Select artists to compare"
          maxSelections={4}
          multiple={true}
          defaultValues={["Drake", "Kendrick Lamar", "Lana Del Rey", "A$AP Rocky"]}
        />
      </div>

      {selectedArtists.length > 0 && (
        <div className="comparison-section">
          <div className="radar-chart-card">
            <div className="card-header">
              <h3 className="card-title">Musical Attributes Comparison</h3>
              <div className="card-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M3.05 13H1v-2h2.05C3.5 6.83 6.83 3.5 11 3.05V1h2v2.05C17.17 3.5 20.5 6.83 20.95 11H23v2h-2.05C20.5 17.17 17.17 20.5 13 20.95V23h-2v-2.05C6.83 20.5 3.5 17.17 3.05 13zM12 19c3.87 0 7-3.13 7-7s-3.13-7-7-7-7 3.13-7 7 3.13 7 7 7z"/>
                </svg>
              </div>
            </div>
            <div className="card-body">
              <div className="radar-chart-container">
                <div className="chart-section">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart 
                      key={selectedArtists.join('-')}
                      cx="50%" 
                      cy="50%" 
                      outerRadius="80%" 
                      data={(() => {
                        if (selectedArtists.length === 0) return [];
                        
                        const attributes = ['danceability', 'energy', 'speechiness', 'acoustics', 
                                         'liveliness', 'valence'];
                        
                        return attributes.map(attr => {
                          const dataPoint = { attribute: attr };
                          selectedArtists.forEach(artist => {
                            if (artistStats[artist]?.attributes) {
                              dataPoint[artist] = artistStats[artist].attributes[attr];
                            }
                          });
                          return dataPoint;
                        });
                      })()}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <PolarGrid />
                      <PolarAngleAxis 
                        dataKey="attribute" 
                        tick={({ payload, x, y, textAnchor, ...props }) => {
                          const isHovered = hoveredAttribute === payload.value
                          return (
                            <g
                              onMouseEnter={() => setHoveredAttribute(payload.value)}
                              onMouseLeave={() => setHoveredAttribute(null)}
                              style={{ cursor: 'pointer' }}
                            >
                              {/* Enhanced background circle for hovered state */}
                              {isHovered && (
                                <circle
                                  cx={x}
                                  cy={y - 18}
                                  r={6}
                                  fill="#1DB954"
                                  stroke="#fff"
                                  strokeWidth={2}
                                  style={{
                                    filter: 'drop-shadow(0 0 8px #1DB954)'
                                  }}
                                />
                              )}
                              <text
                                x={x}
                                y={y}
                                textAnchor={textAnchor}
                                fill={isHovered ? "#1DB954" : "#FFFFFF"}
                                fontSize={isHovered ? "16px" : "12px"}
                                fontWeight={isHovered ? "900" : "500"}
                                stroke="none"
                                style={{ 
                                  fontFamily: 'Circular Std, Helvetica Neue, Arial, sans-serif',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  cursor: 'pointer'
                                }}
                                {...props}
                              >
                                {attributeEmojis[payload.value]} {payload.value}
                              </text>
                            </g>
                          )
                        }}
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 1]} />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const featureInfo = featureDescriptions[label]
                            setTooltipContent({
                              label,
                              featureInfo,
                              payload
                            })
                            setHoveredAttribute(label)
                          } else {
                            setTooltipContent(null)
                            setHoveredAttribute(null)
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
                          strokeWidth={2}
                          animationBegin={index * 150}
                          animationDuration={600}
                          animationEasing="ease-in-out"
                          isAnimationActive={true}
                        />
                      ))}
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="tooltip-panel">
                  {tooltipContent ? (
                    <div className="tooltip-panel-content">
                      <div className="tooltip-header">
                        <p className="tooltip-title">
                          {attributeEmojis[tooltipContent.label]} {tooltipContent.label.charAt(0).toUpperCase() + tooltipContent.label.slice(1)}
                        </p>
                      </div>
                      
                      <div className="four-column-container">
                        {/* Top description spanning all columns */}
                        <div className="wide-description top-description">
                          <p>{tooltipContent.featureInfo?.levels.high || "High level"}</p>
                        </div>
                        
                        {/* Main content area with four artist columns */}
                        <div className="main-content-area">
                          {/* Artist columns (all 4) */}
                          {Array.from({ length: 4 }).map((_, columnIndex) => {
                            const artist = tooltipContent.payload[columnIndex];
                            return (
                              <div key={columnIndex} className="artist-column">
                                <div className="artist-track">
                                  {artist && (
                                    <div
                                      className="artist-indicator"
                                      style={{
                                        bottom: `calc(${artist.value * 100}% * 1 + 2.5%)`,
                                      }}
                                    >
                                      <div
                                        className="artist-dot"
                                        style={{
                                          backgroundColor: artist.color,
                                          borderColor: artist.color,
                                        }}
                                      />
                                      <div className="artist-info">
                                        <div className="artist-name">{artist.name}</div>
                                        <div className="artist-percentage">{(artist.value * 100).toFixed(1)}%</div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Bottom description spanning all columns */}
                        <div className="wide-description bottom-description">
                          <p>{tooltipContent.featureInfo?.levels.low || "Low level"}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="tooltip-panel-placeholder">
                      <p>Hover over the chart to see detailed information about musical attributes</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="card-footer">
              Compare audio features across selected artists using interactive radar visualization
            </div>
          </div>

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