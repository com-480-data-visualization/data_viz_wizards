import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useMusicData } from '../context/MusicDataContext'
import '../css/CountryStatistics.css'

const CountryStatistics = () => {
  const { musicData, loading, error } = useMusicData()
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [countries, setCountries] = useState([])
  const [countryStats, setCountryStats] = useState(null)
  
  const genreChartRef = useRef(null)
  const tempoChartRef = useRef(null)
  const energyChartRef = useRef(null)
  const danceabilityChartRef = useRef(null)
  const valenceChartRef = useRef(null)
  const acousticsChartRef = useRef(null)

  useEffect(() => {
    if (musicData) {
      // Get unique countries with at least 30 songs
      const countryCounts = {}
      musicData.forEach(song => {
        const country = song.Country?.trim()
        if (country) {
          countryCounts[country] = (countryCounts[country] || 0) + 1
        }
      })
      
      const validCountries = Object.entries(countryCounts)
        .filter(([_, count]) => count >= 30)
        .map(([country]) => country)
        .sort()
      
      setCountries(validCountries)
      
      // Set default country (Spain if available, otherwise first country)
      if (validCountries.length > 0) {
        const defaultCountry = validCountries.includes('Spain') 
          ? 'Spain' 
          : validCountries[0]
        setSelectedCountry(defaultCountry)
      }
    }
  }, [musicData])

  useEffect(() => {
    if (musicData && selectedCountry) {
      const countryData = musicData.filter(d => d.Country?.trim() === selectedCountry)
      setCountryStats(calculateStats(countryData, selectedCountry))
    }
  }, [musicData, selectedCountry])
  
  useEffect(() => {
    if (countryStats) {
      createGenreChart()
      createTempoChart()
      createEnergyChart()
      createDanceabilityChart()
      createValenceChart()
      createAcousticsChart()
    }
  }, [countryStats])
  
  const calculateStats = (data, country) => {
    // Get total songs
    const totalSongs = data.length
    
    // Genre distribution
    const genreCounts = {}
    data.forEach(song => {
      // Make sure to capitalize first letter for consistency
      const genre = song.Genre ? song.Genre.charAt(0).toUpperCase() + song.Genre.slice(1).toLowerCase() : 'Unknown'
      genreCounts[genre] = (genreCounts[genre] || 0) + 1
    })
    
    // Create genre percentage
    const genrePercentages = {}
    Object.entries(genreCounts).forEach(([genre, count]) => {
      genrePercentages[genre] = (count / totalSongs) * 100
    })
    
    // Get top genres (for display)
    const topGenres = Object.entries(genrePercentages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre, percentage]) => ({
        genre,
        percentage
      }))
    
    // Artist distribution
    const artistCounts = {}
    data.forEach(song => {
      let artistName = 'Unknown';
      if (song.Artist) {
        try {
          // Attempt to parse the string representation of a list
          const artistList = JSON.parse(song.Artist.replace(/'/g, '"'));
          if (Array.isArray(artistList) && artistList.length > 0) {
            artistName = artistList[0]; // Take the first artist
          }
        } catch (e) {
          // If parsing fails, use the raw string (fallback)
          artistName = song.Artist;
        }
      }
      artistCounts[artistName] = (artistCounts[artistName] || 0) + 1
    })
    
    // Get top artists
    const topArtists = Object.entries(artistCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([artist, count]) => ({
        artist,
        count,
        percentage: (count / totalSongs) * 100
      }))
      
    // Tempo distribution
    const fastCount = data.filter(song => parseFloat(song.tempo) > 120).length
    const mediumCount = data.filter(song => parseFloat(song.tempo) >= 80 && parseFloat(song.tempo) <= 120).length
    const slowCount = data.filter(song => parseFloat(song.tempo) < 80).length
    const tempoDistribution = [
      { category: 'Fast', percentage: (fastCount / totalSongs) * 100 },
      { category: 'Medium', percentage: (mediumCount / totalSongs) * 100 },
      { category: 'Slow', percentage: (slowCount / totalSongs) * 100 }
    ]
    
    // Energy levels
    const highEnergyCount = data.filter(song => parseFloat(song.energy) > 0.66).length
    const mediumEnergyCount = data.filter(song => parseFloat(song.energy) >= 0.33 && parseFloat(song.energy) <= 0.66).length
    const lowEnergyCount = data.filter(song => parseFloat(song.energy) < 0.33).length
    const energyDistribution = [
      { category: 'High', percentage: (highEnergyCount / totalSongs) * 100 },
      { category: 'Medium', percentage: (mediumEnergyCount / totalSongs) * 100 },
      { category: 'Low', percentage: (lowEnergyCount / totalSongs) * 100 }
    ]
    
    // Danceability levels
    const highDanceCount = data.filter(song => parseFloat(song.danceability) > 0.66).length
    const mediumDanceCount = data.filter(song => parseFloat(song.danceability) >= 0.33 && parseFloat(song.danceability) <= 0.66).length
    const lowDanceCount = data.filter(song => parseFloat(song.danceability) < 0.33).length
    const danceDistribution = [
      { category: 'High', percentage: (highDanceCount / totalSongs) * 100 },
      { category: 'Medium', percentage: (mediumDanceCount / totalSongs) * 100 },
      { category: 'Low', percentage: (lowDanceCount / totalSongs) * 100 }
    ]
    
    // Valence (happiness) levels
    const highValenceCount = data.filter(song => parseFloat(song.valence) > 0.66).length
    const mediumValenceCount = data.filter(song => parseFloat(song.valence) >= 0.33 && parseFloat(song.valence) <= 0.66).length
    const lowValenceCount = data.filter(song => parseFloat(song.valence) < 0.33).length
    const valenceDistribution = [
      { category: 'Happy', percentage: (highValenceCount / totalSongs) * 100 },
      { category: 'Neutral', percentage: (mediumValenceCount / totalSongs) * 100 },
      { category: 'Sad', percentage: (lowValenceCount / totalSongs) * 100 }
    ]
    
    // Acoustics levels
    const highAcousticsCount = data.filter(song => parseFloat(song.acoustics) > 0.66).length
    const mediumAcousticsCount = data.filter(song => parseFloat(song.acoustics) >= 0.33 && parseFloat(song.acoustics) <= 0.66).length
    const lowAcousticsCount = data.filter(song => parseFloat(song.acoustics) < 0.33).length
    const acousticsDistribution = [
      { category: 'Acoustic', percentage: (highAcousticsCount / totalSongs) * 100 },
      { category: 'Mixed', percentage: (mediumAcousticsCount / totalSongs) * 100 },
      { category: 'Electronic', percentage: (lowAcousticsCount / totalSongs) * 100 }
    ]
    
    // Average values for audio features
    const avgFeatures = {}
    const features = ['energy', 'danceability', 'valence', 'acoustics', 'speechiness', 'instrumentalness', 'tempo']
    
    features.forEach(feature => {
      avgFeatures[feature] = data.reduce((sum, song) => sum + parseFloat(song[feature] || 0), 0) / totalSongs
    })
    
    return {
      country,
      totalSongs,
      topGenres,
      topArtists,
      tempoDistribution,
      energyDistribution,
      danceDistribution,
      valenceDistribution,
      acousticsDistribution,
      avgFeatures
    }
  }
  
  const createGenreChart = () => {
    if (!genreChartRef.current) return
    
    const svg = d3.select(genreChartRef.current)
    svg.selectAll("*").remove()
    
    const width = 350
    const height = 300
    const radius = Math.min(width, height - 80) / 2
    
    if (countryStats.topGenres.length === 0) {
      svg.attr("width", width)
         .attr("height", height)
         .append("text")
         .attr("x", width / 2)
         .attr("y", height / 2)
         .attr("text-anchor", "middle")
         .text("No genre data available")
         .style("fill", "#FFFFFF")
      return
    }

    const chart = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2 - 30})`)

    // Spotify-inspired vibrant color palette
    const color = d3.scaleOrdinal()
      .domain(countryStats.topGenres.map(d => d.genre))
      .range([
        "#1DB954", // Spotify Green
        "#1ed760", // Light Spotify Green
        "#ff6b35", // Spotify Orange
        "#e22856", // Spotify Pink/Red
        "#7c4dff", // Spotify Purple
        "#00d4ff", // Spotify Blue
        "#ffeb3b", // Spotify Yellow
        "#4caf50", // Additional Green
        "#ff9800", // Additional Orange
        "#9c27b0"  // Additional Purple
      ])

    const pie = d3.pie()
      .value(d => d.percentage)
      .sort(null)

    const arc = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.85)

    // Create the pie chart
    chart.selectAll("path")
      .data(pie(countryStats.topGenres))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.genre))
      .attr("stroke", "#121212")
      .style("stroke-width", "3px")

    // Add percentages
    chart.selectAll("text.percentage")
      .data(pie(countryStats.topGenres))
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

    // Add legend at the bottom
    const legend = svg.append("g")
      .attr("transform", `translate(15, ${height - 85})`)

    countryStats.topGenres.forEach((d, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 16})`)
      
      legendRow.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(d.genre))
        .attr("rx", 2)
      
      legendRow.append("text")
        .attr("x", 18)
        .attr("y", 10)
        .text(`${d.genre.substring(0, 15)}${d.genre.length > 15 ? '...' : ''}`)
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
    const margin = { top: 20, right: 30, bottom: 50, left: 50 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom
    
    const chart = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
    
    const x = d3.scaleBand()
      .domain(countryStats.tempoDistribution.map(d => d.category))
      .range([0, innerWidth])
      .padding(0.3)
    
    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0])

    // Different colors for each tempo category
    const colorMap = {
      "Fast": "#e22856",    // Spotify Pink/Red
      "Medium": "#1DB954",  // Spotify Green
      "Slow": "#7c4dff"     // Spotify Purple
    }
    
    // Add bars
    chart.selectAll(".bar")
      .data(countryStats.tempoDistribution)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.category))
      .attr("y", d => y(d.percentage))
      .attr("width", x.bandwidth())
      .attr("height", d => innerHeight - y(d.percentage))
      .attr("fill", d => colorMap[d.category])
      .attr("rx", 4)
    
    // Add X axis
    chart.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(x))
      .style("font-size", "12px")
      .style("font-family", "'Circular Std', 'Helvetica Neue', Helvetica, Arial, sans-serif")
      .selectAll("text")
      .style("fill", "#FFFFFF")
    
    // Add Y axis
    chart.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .style("font-size", "12px")
      .style("font-family", "'Circular Std', 'Helvetica Neue', Helvetica, Arial, sans-serif")
      .selectAll("text")
      .style("fill", "#FFFFFF")
      
    // Update axis lines
    chart.selectAll(".domain")
      .style("stroke", "#535353")
      
    chart.selectAll(".tick line")
      .style("stroke", "#535353")
    
    // Add labels on top of bars
    chart.selectAll(".label")
      .data(countryStats.tempoDistribution)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => x(d.category) + x.bandwidth() / 2)
      .attr("y", d => y(d.percentage) - 8)
      .attr("text-anchor", "middle")
      .text(d => `${Math.round(d.percentage)}%`)
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "#FFFFFF")
      .style("font-family", "'Circular Std', 'Helvetica Neue', Helvetica, Arial, sans-serif")
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
        "#ff6b35", // Spotify Orange (High Energy)
        "#ffeb3b", // Spotify Yellow (Medium Energy)
        "#00d4ff"  // Spotify Blue (Low Energy)
      ])
    
    const pie = d3.pie()
      .value(d => d.percentage)
      .sort(null)
    
    const arc = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.85)
    
    // Create the pie chart
    chart.selectAll("path")
      .data(pie(countryStats.energyDistribution))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.category))
      .attr("stroke", "#121212")
      .style("stroke-width", "3px")
    
    // Add percentages
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
    
    // Add legend at the bottom
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
        "#e22856", // Spotify Pink/Red (High Danceability)
        "#9c27b0", // Purple (Medium Danceability)
        "#7c4dff"  // Light Purple (Low Danceability)
      ])
    
    const pie = d3.pie()
      .value(d => d.percentage)
      .sort(null)
    
    const arc = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.85)
    
    // Create the pie chart
    chart.selectAll("path")
      .data(pie(countryStats.danceDistribution))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.category))
      .attr("stroke", "#121212")
      .style("stroke-width", "3px")
    
    // Add percentages
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
    
    // Add legend at the bottom
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
        "#ffeb3b", // Bright Yellow (Happy)
        "#1DB954", // Spotify Green (Neutral)
        "#00d4ff"  // Blue (Sad)
      ])
    
    const pie = d3.pie()
      .value(d => d.percentage)
      .sort(null)
    
    const arc = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.85)
    
    // Create the pie chart
    chart.selectAll("path")
      .data(pie(countryStats.valenceDistribution))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.category))
      .attr("stroke", "#121212")
      .style("stroke-width", "3px")
    
    // Add percentages
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
      .style("fill", d => d.data.category === "Happy" ? "#333" : "white") // Dark text for yellow
      .style("font-family", "'Circular Std', 'Helvetica Neue', Helvetica, Arial, sans-serif")
    
    // Add legend at the bottom
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
    const margin = { top: 20, right: 30, bottom: 50, left: 50 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom
    
    const chart = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)

    const x = d3.scaleBand()
      .domain(countryStats.acousticsDistribution.map(d => d.category))
      .range([0, innerWidth])
      .padding(0.3)

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0])

    // Different colors for each acoustic category
    const colorMap = {
      "Acoustic": "#4caf50",    // Green (Natural/Acoustic)
      "Mixed": "#ff9800",       // Orange (Mixed)
      "Electronic": "#9c27b0"   // Purple (Electronic/Synthetic)
    }
    
    // Add bars
    chart.selectAll(".bar")
      .data(countryStats.acousticsDistribution)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.category))
      .attr("y", d => y(d.percentage))
      .attr("width", x.bandwidth())
      .attr("height", d => innerHeight - y(d.percentage))
      .attr("fill", d => colorMap[d.category])
      .attr("rx", 4)
    
    // Add X axis
    chart.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(x))
      .style("font-size", "12px")
      .style("font-family", "'Circular Std', 'Helvetica Neue', Helvetica, Arial, sans-serif")
      .selectAll("text")
      .style("fill", "#FFFFFF")
    
    // Add Y axis
    chart.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .style("font-size", "12px")
      .style("font-family", "'Circular Std', 'Helvetica Neue', Helvetica, Arial, sans-serif")
      .selectAll("text")
      .style("fill", "#FFFFFF")
      
    chart.selectAll(".domain")
      .style("stroke", "#535353")
      
    chart.selectAll(".tick line")
      .style("stroke", "#535353")
    
    // Add labels on top of bars
    chart.selectAll(".label")
      .data(countryStats.acousticsDistribution)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => x(d.category) + x.bandwidth() / 2)
      .attr("y", d => y(d.percentage) - 8)
      .attr("text-anchor", "middle")
      .text(d => `${Math.round(d.percentage)}%`)
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "#FFFFFF")
      .style("font-family", "'Circular Std', 'Helvetica Neue', Helvetica, Arial, sans-serif")
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error loading data: {error.message}</div>
  if (!countryStats) return <div>Calculating statistics...</div>

  return (
    <div className="music-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Music Demographics Dashboard</h1>
          <p className="dashboard-subtitle">{selectedCountry} Music Profile, Split by Genre, Mood, Energy, and Acoustics</p>
        </div>
        <div className="dashboard-note">
          Charts are data-driven from Spotify dataset
        </div>
      </div>
      
      <div className="country-selector">
        <label htmlFor="country-select">Select Country: </label>
        <select
          id="country-select"
          value={selectedCountry || ''}
          onChange={(e) => setSelectedCountry(e.target.value)}
        >
          {countries.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </div>
      
      <div className="artist-section">
        <h3>Top Artists in {selectedCountry}</h3>
        <div className="artist-list">
          {countryStats.topArtists.map((artist, index) => (
            <div key={index} className="artist-card">
              <div className="artist-rank">{index + 1}</div>
              <div className="artist-info">
                <h4>{artist.artist}</h4>
                <p>{artist.count} songs ({Math.round(artist.percentage)}% of country's total)</p>
              </div>
            </div>
          ))}
        </div>
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
            <h3 className="card-title">Genres</h3>
            <div className="card-icon">
              <svg viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
          </div>
          <div className="card-body">
            <div className="donut-chart">
              <svg ref={genreChartRef}></svg>
            </div>
          </div>
          <div className="card-footer">
            Top 5 genres in {selectedCountry} music
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
            <div className="bar-chart">
              <svg ref={tempoChartRef}></svg>
            </div>
          </div>
          <div className="card-footer">
            Distribution of song tempo in {selectedCountry}
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
            Energy levels in {selectedCountry} music
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
            Danceability levels in {selectedCountry} music
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
            Mood distribution based on valence in {selectedCountry} music
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
            <div className="bar-chart">
              <svg ref={acousticsChartRef}></svg>
            </div>
          </div>
          <div className="card-footer">
            Acoustic vs electronic sound in {selectedCountry} music
          </div>
        </div>
      </div>
    </div>
  )
}

export default CountryStatistics 
