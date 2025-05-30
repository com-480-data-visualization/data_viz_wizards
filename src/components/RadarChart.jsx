import { useState } from 'react'
import { RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, Tooltip } from 'recharts'

const RadarChart = ({ selectedArtists, artistStats }) => {
  const [tooltipContent, setTooltipContent] = useState(null)
  const [hoveredAttribute, setHoveredAttribute] = useState(null)

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

  const getValueLevel = (value) => {
    if (value <= 0.33) return 'low'
    if (value <= 0.66) return 'medium'
    return 'high'
  }

  const attributeEmojis = {
    danceability: '💃',
    energy: '⚡️',
    speechiness: '🗣️',
    acoustics: '🎸',
    liveliness: '🎤',
    valence: '😊'
  }

  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', 
    '#ff00ff', '#00ffff', '#ff0000', '#0000ff', '#ffff00'
  ]

  const radarData = (() => {
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
  })()

  return (
    <div className="radar-chart-card">
      <div className="card-header">
        <div className="card-header-content">
          <h3 className="card-title">Musical Attributes</h3>
          <p className="card-description">See which artists pack the most energy, groove, or mood at a glance with this interactive radar visualization</p>
        </div>
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
              <RechartsRadarChart 
                key={selectedArtists.join('-')}
                cx="50%" 
                cy="50%" 
                outerRadius="80%" 
                data={radarData}
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
              </RechartsRadarChart>
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
                  <div className="wide-description top-description">
                    <p>{tooltipContent.featureInfo?.levels.high || "High level"}</p>
                  </div>
                  
                  <div className="main-content-area">
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
    </div>
  )
}

export default RadarChart 