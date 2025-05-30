import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useMusicData } from '../context/MusicDataContext'
import VirtualizedSelect from './VirtualizedSelect'
import LoadingSpinner from './LoadingSpinner'
import '../css/CountryStatistics.css'

const CountryStatistics = ({ selectedCountry: propSelectedCountry }) => {
  const { musicData, globalThresholds, validCountries, getCountryStats, loading, error } = useMusicData()
  const [selectedCountry, setSelectedCountry] = useState(null)
  console.log("Selected country: ", selectedCountry)
  const [countryStats, setCountryStats] = useState(null)
  
  const genreChartRef = useRef(null)
  const tempoChartRef = useRef(null)
  const energyChartRef = useRef(null)
  const danceabilityChartRef = useRef(null)
  const valenceChartRef = useRef(null)
  const acousticsChartRef = useRef(null)

  useEffect(() => {
    if (propSelectedCountry && validCountries.includes(propSelectedCountry)) {
      setSelectedCountry(propSelectedCountry)
    }
  }, [propSelectedCountry, validCountries])

  useEffect(() => {
    if (validCountries.length > 0 && !propSelectedCountry && !selectedCountry) {
      const defaultCountry = validCountries.includes('Spain') 
        ? 'Spain' 
        : validCountries[0]
      setSelectedCountry(defaultCountry)
    }
  }, [validCountries])

  useEffect(() => {
    if (selectedCountry) {
      setCountryStats(getCountryStats(selectedCountry))
    }
  }, [selectedCountry, getCountryStats])
  
  useEffect(() => {
    if (countryStats) {
      createLivelinessChart()
      createTempoChart()
      createEnergyChart()
      createDanceabilityChart()
      createValenceChart()
      createAcousticsChart()
    }
  }, [countryStats])
  
  const createLivelinessChart = () => {
    if (!genreChartRef.current) return
    
    const svg = d3.select(genreChartRef.current)
    svg.selectAll("*").remove()
    
    const width = 350
    const height = 300
    const radius = Math.min(width, height - 80) / 2
    
    const chart = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2 - 30})`)
    
    const color = d3.scaleOrdinal()
      .domain(["Live", "Mixed", "Studio"])
      .range([
        "#e22856",
        "#1DB954", 
        "#9c27b0"  
      ])
    
    const pie = d3.pie()
      .value(d => d.percentage)
      .sort(null)
    
    const arc = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.85)
    
    chart.selectAll("path")
      .data(pie(countryStats.livelinessDistribution))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.category))
      .attr("stroke", "#121212")
      .style("stroke-width", "3px")
    
    chart.selectAll("text.percentage")
      .data(pie(countryStats.livelinessDistribution))
      .enter()
      .append("text")
      .attr("class", "percentage")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(d => `${Math.round(d.data.percentage)}%`)
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "white")
      .style("font-family", "'Circular Std', 'Helvetica Neue', Helvetica, Arial, sans-serif")
    
    const legend = svg.append("g")
      .attr("transform", `translate(15, ${height - 70})`)
    
    countryStats.livelinessDistribution.forEach((d, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 16})`)
      
      legendRow.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(d.category))
        .attr("rx", 2)
      
      legendRow.append("text")
        .attr("x", 18)
        .attr("y", 10)
        .text(`${d.category}: ${Math.round(d.percentage)}%`)
        .style("font-size", "12px")
        .style("fill", "#FFFFFF")
        .style("font-family", "'Circular Std', 'Helvetica Neue', Helvetica, Arial, sans-serif")
    })
  }
  
  const createTempoChart = () => {
    if (!tempoChartRef.current) return
    
    const svg = d3.select(tempoChartRef.current)
    svg.selectAll("*").remove()
    
    const width = 350
    const height = 300
    const radius = Math.min(width, height - 80) / 2
    
    const chart = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2 - 30})`)
    
    const color = d3.scaleOrdinal()
      .domain(["Fast", "Medium", "Slow"])
      .range([
        "#e22856",
        "#1DB954", 
        "#7c4dff" 
      ])
    
    const pie = d3.pie()
      .value(d => d.percentage)
      .sort(null)
    
    const arc = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.85)
    
    chart.selectAll("path")
      .data(pie(countryStats.tempoDistribution))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.category))
      .attr("stroke", "#121212")
      .style("stroke-width", "3px")
    
    chart.selectAll("text.percentage")
      .data(pie(countryStats.tempoDistribution))
      .enter()
      .append("text")
      .attr("class", "percentage")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(d => `${Math.round(d.data.percentage)}%`)
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "white")
      .style("font-family", "'Circular Std', 'Helvetica Neue', Helvetica, Arial, sans-serif")
    
    const legend = svg.append("g")
      .attr("transform", `translate(15, ${height - 70})`)
    
    countryStats.tempoDistribution.forEach((d, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 16})`)
      
      legendRow.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(d.category))
        .attr("rx", 2)
      
      legendRow.append("text")
        .attr("x", 18)
        .attr("y", 10)
        .text(`${d.category}: ${Math.round(d.percentage)}%`)
        .style("font-size", "12px")
        .style("fill", "#FFFFFF")
        .style("font-family", "'Circular Std', 'Helvetica Neue', Helvetica, Arial, sans-serif")
    })
  }
  
  const createEnergyChart = () => {
    if (!energyChartRef.current) return
    
    const svg = d3.select(energyChartRef.current)
    svg.selectAll("*").remove()

    const width = 350
    const height = 300
    const radius = Math.min(width, height - 80) / 2
    
    const chart = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2 - 30})`)
    
    const color = d3.scaleOrdinal()
      .domain(["High", "Medium", "Low"])
      .range([
        "#ff6b35",
        "#ffeb3b",
        "#00d4ff" 
      ])
    
    const pie = d3.pie()
      .value(d => d.percentage)
      .sort(null)
    
    const arc = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.85)
    
    chart.selectAll("path")
      .data(pie(countryStats.energyDistribution))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.category))
      .attr("stroke", "#121212")
      .style("stroke-width", "3px")
    
    chart.selectAll("text.percentage")
      .data(pie(countryStats.energyDistribution))
      .enter()
      .append("text")
      .attr("class", "percentage")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(d => `${Math.round(d.data.percentage)}%`)
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "white")
      .style("font-family", "'Circular Std', 'Helvetica Neue', Helvetica, Arial, sans-serif")
    
    const legend = svg.append("g")
      .attr("transform", `translate(15, ${height - 70})`)
    
    countryStats.energyDistribution.forEach((d, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 16})`)
      
      legendRow.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(d.category))
        .attr("rx", 2)
      
      legendRow.append("text")
        .attr("x", 18)
        .attr("y", 10)
        .text(`${d.category}: ${Math.round(d.percentage)}%`)
        .style("font-size", "12px")
        .style("fill", "#FFFFFF")
        .style("font-family", "'Circular Std', 'Helvetica Neue', Helvetica, Arial, sans-serif")
    })
  }
  
  const createDanceabilityChart = () => {
    if (!danceabilityChartRef.current) return
    
    const svg = d3.select(danceabilityChartRef.current)
    svg.selectAll("*").remove()
    
    const width = 350
    const height = 300
    const radius = Math.min(width, height - 80) / 2
    
    const chart = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2 - 30})`)
    
    const color = d3.scaleOrdinal()
      .domain(["High", "Medium", "Low"])
      .range([
        "#e22856",
        "#9c27b0",
        "#7c4dff" 
      ])
    
    const pie = d3.pie()
      .value(d => d.percentage)
      .sort(null)
    
    const arc = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.85)
    
    chart.selectAll("path")
      .data(pie(countryStats.danceDistribution))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.category))
      .attr("stroke", "#121212")
      .style("stroke-width", "3px")
    
    chart.selectAll("text.percentage")
      .data(pie(countryStats.danceDistribution))
      .enter()
      .append("text")
      .attr("class", "percentage")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(d => `${Math.round(d.data.percentage)}%`)
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "white")
      .style("font-family", "'Circular Std', 'Helvetica Neue', Helvetica, Arial, sans-serif")
    
    const legend = svg.append("g")
      .attr("transform", `translate(15, ${height - 70})`)
    
    countryStats.danceDistribution.forEach((d, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 16})`)
      
      legendRow.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(d.category))
        .attr("rx", 2)
      
      legendRow.append("text")
        .attr("x", 18)
        .attr("y", 10)
        .text(`${d.category}: ${Math.round(d.percentage)}%`)
        .style("font-size", "12px")
        .style("fill", "#FFFFFF")
        .style("font-family", "'Circular Std', 'Helvetica Neue', Helvetica, Arial, sans-serif")
    })
  }
  
  const createValenceChart = () => {
    if (!valenceChartRef.current) return
    
    const svg = d3.select(valenceChartRef.current)
    svg.selectAll("*").remove()
    
    const width = 350
    const height = 300
    const radius = Math.min(width, height - 80) / 2
    
    const chart = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2 - 30})`)
    
    const color = d3.scaleOrdinal()
      .domain(["Happy", "Neutral", "Sad"])
      .range([
        "#ffeb3b",
        "#1DB954",
        "#00d4ff" 
      ])
    
    const pie = d3.pie()
      .value(d => d.percentage)
      .sort(null)
    
    const arc = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.85)
    
    chart.selectAll("path")
      .data(pie(countryStats.valenceDistribution))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.category))
      .attr("stroke", "#121212")
      .style("stroke-width", "3px")
    
    chart.selectAll("text.percentage")
      .data(pie(countryStats.valenceDistribution))
      .enter()
      .append("text")
      .attr("class", "percentage")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(d => `${Math.round(d.data.percentage)}%`)
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", d => d.data.category === "Happy" ? "#333" : "white")
      .style("font-family", "'Circular Std', 'Helvetica Neue', Helvetica, Arial, sans-serif")
    
    const legend = svg.append("g")
      .attr("transform", `translate(15, ${height - 70})`)
    
    countryStats.valenceDistribution.forEach((d, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 16})`)
      
      legendRow.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(d.category))
        .attr("rx", 2)
      
      legendRow.append("text")
        .attr("x", 18)
        .attr("y", 10)
        .text(`${d.category}: ${Math.round(d.percentage)}%`)
        .style("font-size", "12px")
        .style("fill", "#FFFFFF")
        .style("font-family", "'Circular Std', 'Helvetica Neue', Helvetica, Arial, sans-serif")
    })
  }
  
  const createAcousticsChart = () => {
    if (!acousticsChartRef.current) return
    
    const svg = d3.select(acousticsChartRef.current)
    svg.selectAll("*").remove()
    
    const width = 350
    const height = 300
    const radius = Math.min(width, height - 80) / 2
    
    const chart = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2 - 30})`)
    
    const color = d3.scaleOrdinal()
      .domain(["Acoustic", "Mixed", "Electronic"])
      .range([
        "#4caf50",
        "#ff9800",
        "#9c27b0" 
      ])
    
    const pie = d3.pie()
      .value(d => d.percentage)
      .sort(null)
    
    const arc = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.85)
    
    chart.selectAll("path")
      .data(pie(countryStats.acousticsDistribution))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.category))
      .attr("stroke", "#121212")
      .style("stroke-width", "3px")
    
    chart.selectAll("text.percentage")
      .data(pie(countryStats.acousticsDistribution))
      .enter()
      .append("text")
      .attr("class", "percentage")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(d => `${Math.round(d.data.percentage)}%`)
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "white")
      .style("font-family", "'Circular Std', 'Helvetica Neue', Helvetica, Arial, sans-serif")
    
    const legend = svg.append("g")
      .attr("transform", `translate(15, ${height - 70})`)
    
    countryStats.acousticsDistribution.forEach((d, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 16})`)
      
      legendRow.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(d.category))
        .attr("rx", 2)
      
      legendRow.append("text")
        .attr("x", 18)
        .attr("y", 10)
        .text(`${d.category}: ${Math.round(d.percentage)}%`)
        .style("font-size", "12px")
        .style("fill", "#FFFFFF")
        .style("font-family", "'Circular Std', 'Helvetica Neue', Helvetica, Arial, sans-serif")
    })
  }

  const handleCountryChange = (value) => {
    setSelectedCountry(value)
  }

  if (loading) return <LoadingSpinner />
  if (error) return <div>Error loading data: {error.message}</div>

  return (
    <div className="music-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Country Statistics</h1>
          <p className="dashboard-subtitle">🌍 Pick a country and dive into its musical DNA! Will you find your favorite song or artist? 🎵</p>
        </div>
      </div>
      
      <div className="selector-section">
        <div className="selector-header">
          <h3 className="selector-title">Select Country to Explore</h3>
          <p className="selector-subtitle">Choose a country to discover its musical DNA and popular tracks</p>
        </div>
        <VirtualizedSelect
          id="country-select"
          value={selectedCountry || ''}
          onChange={handleCountryChange}
          options={validCountries}
          placeholder="Choose a country..."
          isSearchable={true}
          className="country-select"
        />
      </div>
      
      {!selectedCountry ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px',
          color: '#FFFFFF',
          fontSize: '16px'
        }}>
          Please select a country to view statistics
        </div>
      ) : !countryStats ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px',
          color: '#FFFFFF',
          fontSize: '16px'
        }}>
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div className="section-description">
            <p>Discover the most popular songs in {selectedCountry} based on total popularity scores across our dataset. These tracks represent the biggest hits that have captured listeners' attention. <br />Click on any song with a 🎵 icon to listen on Spotify!</p>
          </div>
          
          <div className="artist-section">
            <h3>Top Songs in {selectedCountry}</h3>
            <div className="artist-list">
              {countryStats.topSongs.map((song, index) => (
                <div 
                  key={index} 
                  className={`artist-card ${song.uri ? 'clickable-card' : ''}`}
                  onClick={() => {
                    if (song.uri && song.uri.length > 0) {
                      window.open(song.uri, '_blank', 'noopener,noreferrer')
                    }
                  }}
                  style={song.uri ? { cursor: 'pointer' } : {}}
                >
                  <div className="artist-rank">{index + 1}</div>
                  <div className="artist-info">
                    <h4>
                      {song.title.charAt(0).toUpperCase() + song.title.slice(1)} {song.uri ? '🎵' : ''}
                    </h4>
                    <p>by {song.artist}</p>
                    <p className="popularity-score">Total popularity: {song.totalPopularity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="section-description">
            <p>Meet the most influential artists dominating {selectedCountry}'s music scene, ranked by their combined popularity across all tracks in our dataset. These musicians have consistently produced popular content and shaped the country's musical landscape.</p>
          </div>
          
          <div className="artist-section">
            <h3>Top Artists in {selectedCountry}</h3>
            <div className="artist-list">
              {countryStats.topArtists.map((artist, index) => (
                <div key={index} className="artist-card">
                  <div className="artist-rank">{index + 1}</div>
                  <div className="artist-info">
                    <h4>{artist.artist}</h4>
                    <p>{artist.songCount} songs</p>
                    <p className="popularity-score">Total popularity: {artist.totalPopularity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="section-description">
            <p>Explore the musical genres that define {selectedCountry}'s sound and cultural identity. This breakdown shows the percentage distribution of different music styles, revealing the country's musical preferences and diversity.</p>
          </div>
          
          <div className="artist-section">
            <h3>Top Genres in {selectedCountry}</h3>
            <div className="artist-list">
              {countryStats.topGenres.map((genre, index) => (
                <div key={index} className="artist-card">
                  <div className="artist-rank">{index + 1}</div>
                  <div className="artist-info">
                    <h4>{genre.genre}</h4>
                    <p>{Math.round(genre.percentage)}% of songs</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="section-description">
            <p>Now let's take a deep dive into the musical DNA of {selectedCountry}! This comprehensive analysis explores the acoustic characteristics that define the country's sound - from the energy and mood of the tracks to their tempo and danceability. Discover what makes {selectedCountry}'s music unique through data-driven insights into the emotional and technical qualities of their most popular songs.</p>
          </div>
          
          <div className="stats-summary">
            <div className="summary-content">
              <h3>Music Profile Summary for {selectedCountry}</h3>
              <p>Based on {countryStats.totalSongs} songs in our dataset</p>
              <ul>
                <li>
                  <strong>Top Genre:</strong> {countryStats.topGenres.length > 0 ? 
                    `${countryStats.topGenres[0].genre} (${Math.round(countryStats.topGenres[0].percentage)}%)` : 
                    'No genre data available'
                  }
                </li>
                <li>
                  <strong>Tempo:</strong> Mostly {
                    countryStats.tempoDistribution.sort((a, b) => b.percentage - a.percentage)[0].category
                  } tempo songs ({
                    Math.round(countryStats.tempoDistribution.sort((a, b) => b.percentage - a.percentage)[0].percentage)
                  }%)
                </li>
                <li>
                  <strong>Energy:</strong> Predominantly {
                    countryStats.energyDistribution.sort((a, b) => b.percentage - a.percentage)[0].category
                  } energy ({
                    Math.round(countryStats.energyDistribution.sort((a, b) => b.percentage - a.percentage)[0].percentage)
                  }%)
                </li>
                <li>
                  <strong>Danceability:</strong> Mostly {
                    countryStats.danceDistribution.sort((a, b) => b.percentage - a.percentage)[0].category
                  } danceability ({
                    Math.round(countryStats.danceDistribution.sort((a, b) => b.percentage - a.percentage)[0].percentage)
                  }%)
                </li>
                <li>
                  <strong>Mood:</strong> Primarily {
                    countryStats.valenceDistribution.sort((a, b) => b.percentage - a.percentage)[0].category
                  } sounding tracks ({
                    Math.round(countryStats.valenceDistribution.sort((a, b) => b.percentage - a.percentage)[0].percentage)
                  }%)
                </li>
                <li>
                  <strong>Sound Type:</strong> {
                    countryStats.acousticsDistribution.sort((a, b) => b.percentage - a.percentage)[0].category
                  } dominant ({
                    Math.round(countryStats.acousticsDistribution.sort((a, b) => b.percentage - a.percentage)[0].percentage)
                  }%)
                </li>
                <li>
                  <strong>Most Popular Artist:</strong> {
                    countryStats.topArtists.length > 0 ? countryStats.topArtists[0].artist : 'Unknown'
                  }
                </li>
              </ul>
            </div>
          </div>
          
          <div className="dashboard-grid">
            <div className="stat-card">
              <div className="card-header">
                <h3 className="card-title">Liveliness</h3>
                <div className="card-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
              </div>
              <div className="card-body">
                <div className="donut-chart">
                  <svg ref={genreChartRef}></svg>
                </div>
              </div>
              <div className="card-footer">
                Live vs recorded sound in music in {selectedCountry}
              </div>
            </div>
            
            <div className="stat-card">
              <div className="card-header">
                <h3 className="card-title">Tempo</h3>
                <div className="card-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M16.24 7.76C15.07 6.59 13.54 6 12 6v6l-4.24 4.24c2.34 2.34 6.14 2.34 8.49 0 2.34-2.34 2.34-6.14-.01-8.48zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                  </svg>
                </div>
              </div>
              <div className="card-body">
                <div className="donut-chart">
                  <svg ref={tempoChartRef}></svg>
                </div>
              </div>
              <div className="card-footer">
                Distribution of song tempo in music in {selectedCountry}
              </div>
            </div>
            
            <div className="stat-card">
              <div className="card-header">
                <h3 className="card-title">Energy</h3>
                <div className="card-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
                  </svg>
                </div>
              </div>
              <div className="card-body">
                <div className="donut-chart">
                  <svg ref={energyChartRef}></svg>
                </div>
              </div>
              <div className="card-footer">
                Energy levels in music in {selectedCountry}
              </div>
            </div>
            
            <div className="stat-card">
              <div className="card-header">
                <h3 className="card-title">Danceability</h3>
                <div className="card-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M10.8 15.9l4.2-4.2-4.2-4.2L12 6l6 6-6 6-1.2-1.2zM2.4 6L6 9.6 3.6 12 6 14.4 2.4 18l-1.2-1.2L4.8 12 1.2 7.2 2.4 6z"/>
                  </svg>
                </div>
              </div>
              <div className="card-body">
                <div className="donut-chart">
                  <svg ref={danceabilityChartRef}></svg>
                </div>
              </div>
              <div className="card-footer">
                Danceability levels in music in {selectedCountry}
              </div>
            </div>
            
            <div className="stat-card">
              <div className="card-header">
                <h3 className="card-title">Mood</h3>
                <div className="card-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                  </svg>
                </div>
              </div>
              <div className="card-body">
                <div className="donut-chart">
                  <svg ref={valenceChartRef}></svg>
                </div>
              </div>
              <div className="card-footer">
                Mood distribution based on valence in music in {selectedCountry}
              </div>
            </div>
            
            <div className="stat-card">
              <div className="card-header">
                <h3 className="card-title">Acoustics</h3>
                <div className="card-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M17 20c-.29 0-.56-.06-.76-.15-.71-.37-1.21-.88-1.71-2.38-.51-1.56-1.47-2.29-2.39-3-.79-.61-1.61-1.24-2.32-2.53C9.29 10.98 9 9.93 9 9c0-2.8 2.2-5 5-5s5 2.2 5 5h2c0-3.93-3.07-7-7-7S7 5.07 7 9c0 1.26.38 2.65 1.07 3.9.91 1.65 1.98 2.48 2.85 3.15.81.62 1.39 1.07 1.71 2.05.6 1.82 1.37 2.84 2.73 3.55.51.23 1.07.35 1.64.35 2.21 0 4-1.79 4-4h-2c0 1.1-.9 2-2 2zM7.64 2.64L6.22 1.22C4.23 3.21 3 5.96 3 9s1.23 5.79 3.22 7.78l1.41-1.41C6.01 13.74 5 11.49 5 9s1.01-4.74 2.64-6.36zM11.5 9c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5z"/>
                  </svg>
                </div>
              </div>
              <div className="card-body">
                <div className="donut-chart">
                  <svg ref={acousticsChartRef}></svg>
                </div>
              </div>
              <div className="card-footer">
                Acoustic vs electronic sound in music in {selectedCountry}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default CountryStatistics 
