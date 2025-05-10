import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { useMusicData } from '../context/MusicDataContext'

const MapPlot = () => {
  const svgRef = useRef(null)
  const { musicData, loading, error } = useMusicData()
  const [worldData, setWorldData] = useState(null)
  const [filterType, setFilterType] = useState('genre')
  const [filterValue, setFilterValue] = useState('all')
  const [filterOptions, setFilterOptions] = useState([])
  const [dataByCountry, setDataByCountry] = useState({})
  const [title, setTitle] = useState('Music Popularity by Country')

  const countryNameMapping = {
    "United States of America": "USA",
    "United States": "USA"
  }

  useEffect(() => {
    const loadMapData = async () => {
      const mapData = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      setWorldData(mapData)
    }

    loadMapData()
  }, [])

  useEffect(() => {
    if (musicData) {
      processData(musicData)
    }
  }, [musicData])

  useEffect(() => {
    if (musicData && worldData) {
      const svg = d3.select(svgRef.current)
      const svgWidth = 960
      const svgHeight = 500

      const projection = d3.geoNaturalEarth1()
        .scale(170)
        .translate([svgWidth / 2, svgHeight / 2])
        .precision(.1)

      const pathGenerator = d3.geoPath().projection(projection)

      const colorScale = d3.scaleLinear()
        .range(["hsl(62,100%,90%)", "hsl(228,30%,20%)"])
        .interpolate(d3.interpolateHcl)

      const countries = topojson.feature(worldData, worldData.objects.countries).features
      updateVisualization(countries, pathGenerator, colorScale)
    }
  }, [musicData, worldData, filterType, filterValue])

  const makeColorbar = (svg, colorScale, topLeft, colorbarSize) => {
    const valueToSvg = d3.scaleLinear()
      .domain(colorScale.domain())
      .range([colorbarSize[1], 0])

    const range01ToColor = d3.scaleLinear()
      .domain([0, 1])
      .range(colorScale.range())
      .interpolate(colorScale.interpolate())

    const colorbarAxis = d3.axisLeft(valueToSvg)
      .tickFormat(d3.format(".0f"))

    const colorbarG = svg.append("g")
      .attr("id", "colorbar")
      .attr("transform", `translate(${topLeft[0]}, ${topLeft[1]})`)
      .call(colorbarAxis)

    const range01 = (steps) => Array.from(Array(steps), (_, i) => i / (steps - 1))

    const svgDefs = svg.append("defs")

    const gradient = svgDefs.append('linearGradient')
      .attr('id', 'colorbar-gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%')
      .attr('spreadMethod', 'pad')

    gradient.selectAll('stop')
      .data(range01(10))
      .enter()
      .append('stop')
      .attr('offset', d => `${Math.round(100 * d)}%`)
      .attr('stop-color', d => range01ToColor(d))
      .attr('stop-opacity', 1)

    colorbarG.append('rect')
      .attr('id', 'colorbar-area')
      .attr('width', colorbarSize[0])
      .attr('height', colorbarSize[1])
      .style('fill', 'url(#colorbar-gradient)')
      .style('stroke', 'black')
      .style('stroke-width', '1px')
  }

  const processData = (musicData) => {
    console.log('Processing music data...')
    const newDataByCountry = {}
    const genres = new Set()
    const artists = new Set()
    const songs = new Set()

    musicData.forEach((row, index) => {
      if (index % 1000 === 0) {
        console.log(`Processing row ${index} of ${musicData.length}...`)
      }
      const country = row.Country.trim()
      const genre = row.Genre
      const artist = row.Artist
      const song = row.Title
      
      genres.add(genre)
      artists.add(artist)
      songs.add(song)
      
      if (!newDataByCountry[country]) {
        newDataByCountry[country] = {
          songs: [],
          popularity: 0,
          count: 0
        }
      }
      
      newDataByCountry[country].songs.push({
        title: song,
        artist: artist,
        genre: genre,
        happiness: parseFloat(row.Happiness),
        popularity: parseFloat(row.Popularity),
        danceability: parseFloat(row.danceability),
        energy: parseFloat(row.energy),
        valence: parseFloat(row.valence),
        tempo: parseFloat(row.tempo)
      })
      
      newDataByCountry[country].popularity += parseFloat(row.Popularity)
      newDataByCountry[country].count++
    })
    
    console.log('Calculating average popularity per country...')
    Object.keys(newDataByCountry).forEach(country => {
      if (newDataByCountry[country].count > 0) {
        newDataByCountry[country].popularity /= newDataByCountry[country].count
      }
    })

    console.log('Data processing complete:', {
      totalCountries: Object.keys(newDataByCountry).length,
      totalGenres: genres.size,
      totalArtists: artists.size,
      totalSongs: songs.size
    })

    setDataByCountry(newDataByCountry)
    setFilterOptions(Array.from(genres))
  }

  const updateVisualization = (countries, pathGenerator, colorScale) => {
    console.log('Updating visualization with:', {
      countriesCount: countries.length,
      dataByCountryKeys: Object.keys(dataByCountry),
      filterType,
      filterValue,
      filterOptions
    })

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    // Create a group for the map
    const mapGroup = svg.append("g")

    // Calculate country popularities
    const countryToPopularity = {}
    Object.keys(dataByCountry).forEach(country => {
      let countryData = dataByCountry[country]
      let filteredSongs = countryData.songs

      if (filterValue !== 'all') {
        filteredSongs = filteredSongs.filter(song => {
          if (filterType === 'genre') return song.genre === filterValue
          if (filterType === 'artist') return song.artist === filterValue
          if (filterType === 'song') return song.title === filterValue
          return true
        })
      }

      if (filteredSongs.length > 0) {
        const totalPopularity = filteredSongs.reduce((sum, song) => sum + song.popularity, 0)
        countryToPopularity[country] = totalPopularity / filteredSongs.length
      } else {
        countryToPopularity[country] = 0
      }
    })

    // Update country properties
    countries.forEach(country => {
      let countryName = country.properties.name
      if (countryNameMapping[countryName]) {
        countryName = countryNameMapping[countryName]
      }
      country.properties.popularity = countryToPopularity[countryName] || 0
    })

    // Update color scale domain
    const popularities = Object.values(countryToPopularity).filter(p => p > 0)
    if (popularities.length > 0) {
      colorScale.domain([d3.min(popularities), d3.max(popularities)])
    } else {
      colorScale.domain([0, 100])
    }

    // Draw countries
    mapGroup.selectAll("path")
      .data(countries)
      .enter()
      .append("path")
      .attr("d", pathGenerator)
      .attr("fill", d => d.properties.popularity ? colorScale(d.properties.popularity) : "#ccc")
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .on("mouseover", function(event, d) {
        const popularity = d.properties.popularity ? d.properties.popularity.toFixed(1) : "No data"
        d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "white")
          .style("border", "1px solid black")
          .style("padding", "5px")
          .style("border-radius", "5px")
          .style("pointer-events", "none")
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`)
          .html(`<strong>${d.properties.name}</strong><br>Popularity: ${popularity}`)

        d3.select(this)
          .attr("stroke", "#000")
          .attr("stroke-width", 2)
      })
      .on("mouseout", function() {
        d3.select(".tooltip").remove()
        d3.select(this)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5)
      })
      .on("click", (event, d) => {
        let countryName = d.properties.name
        if (countryNameMapping[countryName]) {
          countryName = countryNameMapping[countryName]
        }
        if (dataByCountry[countryName]) {
          // TODO: Implement country statistics view
          console.log(`Clicked on ${countryName}`)
        }
      })

    // Add colorbar
    makeColorbar(svg, colorScale, [50, 30], [20, 440])

    // Update title
    let newTitle = "Music Popularity by Country"
    if (filterValue !== "all") {
      switch(filterType) {
        case "genre":
          newTitle = `${filterValue} Genre Popularity by Country`
          break
        case "artist":
          newTitle = `${filterValue} Popularity by Country`
          break
        case "song":
          newTitle = `"${filterValue}" Popularity by Country`
          break
      }
    } else {
      switch(filterType) {
        case "genre":
          newTitle = "All Genres Popularity by Country"
          break
        case "artist":
          newTitle = "All Artists Popularity by Country"
          break
        case "song":
          newTitle = "All Songs Popularity by Country"
          break
      }
    }
    setTitle(newTitle)

    // Add title
    svg.append("text")
      .attr("class", "map-title")
      .attr("x", 480)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(newTitle)
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error loading data: {error.message}</div>

  return (
    <div className="map-container">
      <div className="filter-controls">
        <h3>Filter Options</h3>
        <div className="filter-row">
          <label htmlFor="filter-type">Filter by: </label>
          <select
            id="filter-type"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value)
              setFilterValue('all')
            }}
          >
            <option value="genre">Genre</option>
            <option value="artist">Artist</option>
            <option value="song">Song</option>
          </select>
        </div>
        <div className="filter-row">
          <label htmlFor="filter-value">Value: </label>
          <select
            id="filter-value"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
          >
            <option value="all">All</option>
            {filterOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
      <svg ref={svgRef} width="960" height="500" viewBox="0 0 960 500"></svg>
    </div>
  )
}

export default MapPlot 