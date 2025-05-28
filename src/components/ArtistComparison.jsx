import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useMusicData } from '../context/MusicDataContext'
import SearchableSelect from './SearchableSelect'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, Tooltip } from 'recharts'
import '../css/ArtistComparison.css'

const ArtistComparison = () => {
  const svgRef = useRef(null)
  const { artists, calculateArtistStats, loading, error } = useMusicData()
  const [selectedArtists, setSelectedArtists] = useState([])
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
    instrumentalness: {
      tooltip: "Likelihood a track has no vocals (treats \"ooh/aah\" as instrumental).",
      levels: {
        low: "Vocals clearly present.",
        medium: "Some instrumental passages, but still singers.",
        high: "Fully instrumental, no vocals at all."
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
    instrumentalness: '🎹',
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
                  })()}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <PolarGrid />
                  <PolarAngleAxis 
                    dataKey="attribute" 
                    tick={({ payload, x, y, textAnchor, ...props }) => {
                      const isHovered = hoveredAttribute === payload.value
                      return (
                        <g>
                          {isHovered && (
                            <circle
                              cx={x}
                              cy={y - 15}
                              r={4}
                              fill="#ff6b6b"
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          )}
                          <text
                            x={x}
                            y={y}
                            textAnchor={textAnchor}
                            fill={isHovered ? "#ff6b6b" : "#666"}
                            fontSize={isHovered ? "14px" : "12px"}
                            fontWeight={isHovered ? "bold" : "normal"}
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
                      return null; // Don't render anything here
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
                    {tooltipContent.featureInfo && (
                      <p className="tooltip-description">{tooltipContent.featureInfo.tooltip}</p>
                    )}
                  </div>
                  
                  <div className="tooltip-values">
                    {tooltipContent.payload
                      .sort((a, b) => b.value - a.value)
                      .map((entry, index) => {
                        const level = getValueLevel(entry.value)
                        const levelDescription = tooltipContent.featureInfo?.levels[level]
                        
                        return (
                          <div key={index} className="tooltip-artist-info">
                            <p className="tooltip-artist" style={{ color: entry.color }}>
                              <strong>{entry.name}</strong>: {entry.value.toFixed(3)}
                            </p>
                            {levelDescription && (
                              <p className="tooltip-level-description">
                                {levelDescription}
                              </p>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </div>
              ) : (
                <div className="tooltip-panel-placeholder">
                  <p>Hover over the chart to see detailed information about musical attributes</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ArtistComparison 