import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useMusicData } from '../context/MusicDataContext'

const CountryStatistics = () => {
  const svgRef = useRef(null)
  const { musicData, loading, error } = useMusicData()
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [countries, setCountries] = useState([])
  const [globalCharacteristics, setGlobalCharacteristics] = useState(null)

  useEffect(() => {
    if (musicData) {
      // Get unique countries
      const uniqueCountries = [...new Set(musicData.map(d => d.Country.trim()))]
      console.log('Unique countries found:', {
        count: uniqueCountries.length,
        countries: uniqueCountries
      })
      setCountries(uniqueCountries)

      // Calculate global characteristics
      const characteristics = calculateGlobalCharacteristics(musicData)
      setGlobalCharacteristics(characteristics)
    }
  }, [musicData])

  useEffect(() => {
    if (musicData && selectedCountry && globalCharacteristics) {
      const countryData = musicData.filter(d => d.Country.trim() === selectedCountry)
      const countryCharacteristics = calculateCountryCharacteristics(countryData)
      updateVisualization(countryCharacteristics, globalCharacteristics)
    }
  }, [musicData, selectedCountry, globalCharacteristics])

  const calculateCountryCharacteristics = (songs) => {
    const characteristics = {
      happiness: 0,
      energy: 0,
      danceability: 0,
      speechiness: 0,
      acoustics: 0,
      instrumentalness: 0,
      valence: 0,
      tempo: 0
    }
    
    songs.forEach(song => {
      characteristics.happiness += parseFloat(song.valence) || 0
      characteristics.energy += parseFloat(song.energy) || 0
      characteristics.danceability += parseFloat(song.danceability) || 0
      characteristics.speechiness += parseFloat(song.speechiness) || 0
      characteristics.acoustics += parseFloat(song.acoustics) || 0
      characteristics.instrumentalness += parseFloat(song.instrumentalness) || 0
      characteristics.valence += parseFloat(song.valence) || 0
      characteristics.tempo += parseFloat(song.tempo) || 0
    })
    
    Object.keys(characteristics).forEach(key => {
      characteristics[key] /= songs.length
    })
    
    return characteristics
  }

  const calculateGlobalCharacteristics = (data) => {
    const characteristics = {
      happiness: 0,
      energy: 0,
      danceability: 0,
      speechiness: 0,
      acoustics: 0,
      instrumentalness: 0,
      valence: 0,
      tempo: 0
    }
    
    data.forEach(song => {
      characteristics.happiness += parseFloat(song.valence) || 0
      characteristics.energy += parseFloat(song.energy) || 0
      characteristics.danceability += parseFloat(song.danceability) || 0
      characteristics.speechiness += parseFloat(song.speechiness) || 0
      characteristics.acoustics += parseFloat(song.acoustics) || 0
      characteristics.instrumentalness += parseFloat(song.instrumentalness) || 0
      characteristics.valence += parseFloat(song.valence) || 0
      characteristics.tempo += parseFloat(song.tempo) || 0
    })
    
    Object.keys(characteristics).forEach(key => {
      characteristics[key] /= data.length
    })
    
    return characteristics
  }

  const updateVisualization = (countryCharacteristics, globalCharacteristics) => {
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 30, bottom: 60, left: 60 }
    const width = 960 - margin.left - margin.right
    const height = 500 - margin.top - margin.bottom

    const chartSvg = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    const data = []
    Object.keys(countryCharacteristics).forEach(key => {
      const countryValue = countryCharacteristics[key] || 0
      const globalValue = globalCharacteristics[key] || 0
      
      let difference = 0
      if (globalValue !== 0) {
        difference = ((countryValue - globalValue) / globalValue) * 100
      }
      
      if (!isFinite(difference)) {
        difference = 0
      }
      
      const scaleFactor = key === 'tempo' ? 0.01 : 1
      
      data.push({
        characteristic: key.charAt(0).toUpperCase() + key.slice(1),
        country: countryValue * scaleFactor,
        global: globalValue * scaleFactor,
        difference: difference
      })
    })

    const x = d3.scaleBand()
      .domain(data.map(d => d.characteristic))
      .range([0, width])
      .padding(0.3)

    const minDiff = d3.min(data, d => d.difference) || -20
    const maxDiff = d3.max(data, d => d.difference) || 20

    const y = d3.scaleLinear()
      .domain([Math.min(minDiff, -20), Math.max(maxDiff, 20)])
      .range([height, 0])

    // X axis
    chartSvg.append("g")
      .attr("transform", `translate(0,${y(0)})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)")

    // Y axis
    chartSvg.append("g")
      .call(d3.axisLeft(y).tickFormat(d => `${d}%`))

    // Y axis label
    chartSvg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Difference from Global Average (%)")

    // X axis label
    chartSvg.append("text")
      .attr("transform", `translate(${width/2}, ${height + margin.bottom - 10})`)
      .style("text-anchor", "middle")
      .text("Music Characteristics")

    // Zero line
    chartSvg.append("line")
      .attr("x1", 0)
      .attr("y1", y(0))
      .attr("x2", width)
      .attr("y2", y(0))
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4")

    // Bars
    chartSvg.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.characteristic))
      .attr("width", x.bandwidth())
      .attr("y", d => d.difference > 0 ? y(d.difference) : y(0))
      .attr("height", d => Math.abs(y(d.difference) - y(0)))
      .attr("fill", d => d.difference > 0 ? "#4CAF50" : "#F44336")
      .append("title")
      .text(d => `${d.characteristic}: ${d.difference.toFixed(1)}% difference from global average`)

    // Value labels
    chartSvg.selectAll(".label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => x(d.characteristic) + x.bandwidth() / 2)
      .attr("y", d => d.difference > 0 ? y(d.difference) - 5 : y(d.difference) + 15)
      .attr("text-anchor", "middle")
      .text(d => `${d.difference.toFixed(1)}%`)

    // Add tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "1px solid #ddd")
      .style("padding", "10px")
      .style("border-radius", "5px")
      .style("pointer-events", "none")

    chartSvg.selectAll(".bar")
      .data(data)
      .on("mouseover", function(event, d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9)
        tooltip.html(`<strong>${d.characteristic}</strong><br/>
                      Country: ${d.country.toFixed(2)}<br/>
                      Global: ${d.global.toFixed(2)}<br/>
                      Difference: ${d.difference.toFixed(1)}%`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px")
      })
      .on("mouseout", function() {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0)
      })
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error loading data: {error.message}</div>

  return (
    <div className="country-stats-container">
      <div className="country-selector">
        <label htmlFor="country-select">Select Country: </label>
        <select
          id="country-select"
          value={selectedCountry || ''}
          onChange={(e) => setSelectedCountry(e.target.value)}
        >
          <option value="">Select a country</option>
          {countries.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </div>
      {selectedCountry && (
        <div className="visualization-container">
          <h2>Music Characteristics for {selectedCountry}</h2>
          <svg ref={svgRef} width="960" height="500"></svg>
        </div>
      )}
    </div>
  )
}

export default CountryStatistics 