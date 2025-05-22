import { useEffect, useRef, useState } from 'react'
import { useMusicData } from '../context/MusicDataContext'
import Globe from 'react-globe.gl'

const MapPlot = () => {
  const { musicData, loading, error } = useMusicData()
  const [filterType, setFilterType] = useState('genre')
  const [filterValue, setFilterValue] = useState('all')
  const [filterOptions, setFilterOptions] = useState([])
  const [dataByCountry, setDataByCountry] = useState({})
  const [title, setTitle] = useState('Music Popularity by Country')
  const [countryData, setCountryData] = useState([])
  const globeRef = useRef()

  const countryNameMapping = {
    "United States of America": "USA",
    "United States": "USA",
    "United Kingdom": "UK",
    "Great Britain": "UK",
    "England": "UK",
    "Scotland": "UK",
    "Wales": "UK",
    "Northern Ireland": "UK",
    "Czech Republic": "Czechia",
    "Republic of Korea": "South Korea",
    "Korea, Republic of": "South Korea",
    "Korea, South": "South Korea",
    "Russian Federation": "Russia",
    "Iran, Islamic Republic of": "Iran",
    "Syrian Arab Republic": "Syria",
    "Lao People's Democratic Republic": "Laos",
    "Democratic People's Republic of Korea": "North Korea",
    "Korea, North": "North Korea",
    "Brunei Darussalam": "Brunei",
    "Congo, Democratic Republic of the": "Democratic Republic of the Congo",
    "Congo, Republic of the": "Republic of the Congo",
    "Côte d'Ivoire": "Ivory Coast",
    "Timor-Leste": "East Timor",
    "Macedonia, the former Yugoslav Republic of": "North Macedonia",
    "Moldova, Republic of": "Moldova",
    "Tanzania, United Republic of": "Tanzania",
    "Venezuela, Bolivarian Republic of": "Venezuela",
    "Viet Nam": "Vietnam"
  }

  useEffect(() => {
    if (musicData && Object.keys(dataByCountry).length > 0) {
      updateVisualization()
    }
  }, [musicData, filterType, filterValue, dataByCountry])

  useEffect(() => {
    if (musicData) {
      updateVisualization()
    }
  }, [musicData, filterType, filterValue])

  useEffect(() => {
    // Load GeoJSON data for the globe
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(geoJson => {
        const countries = geoJson.features.map(d => ({
          ...d,
          properties: {
            ...d.properties,
            color: '#ccc'
          }
        }));
        setCountryData(countries);
      });
  }, []);

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
    
    // Set filter options based on filter type
    updateFilterOptions(filterType, { genres, artists, songs })
  }

  useEffect(() => {
    if (musicData && musicData.length > 0) {
      processData(musicData)
    }
  }, [musicData])

  const updateFilterOptions = (type, { genres, artists, songs }) => {
    switch(type) {
      case 'genre':
        setFilterOptions(Array.from(genres))
        break
      case 'artist':
        setFilterOptions(Array.from(artists))
        break
      case 'song':
        setFilterOptions(Array.from(songs))
        break
      default:
        setFilterOptions([])
    }
  }

  const updateVisualization = () => {
    console.log('Updating visualization with:', {
      dataByCountryKeys: Object.keys(dataByCountry),
      filterType,
      filterValue,
      filterOptions
    })

    // Calculate country popularities
    const countryToPopularity = {}
    let maxPopularity = 0;
    let minPopularity = Infinity;
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
        const avgPopularity = totalPopularity / filteredSongs.length
        countryToPopularity[country] = avgPopularity

        if (avgPopularity > maxPopularity) maxPopularity = avgPopularity
        if (avgPopularity < minPopularity) minPopularity = avgPopularity
      } else {
        countryToPopularity[country] = 0
      }
    })

    // Update globe colors based on popularity
    if (countryData.length > 0) {
      const updatedCountries = countryData.map(country => {
        const countryName = country.properties.NAME || country.properties.ADMIN;
        const mappedName = countryNameMapping[countryName] || countryName;
        const popularity = countryToPopularity[mappedName] || 0;
        
        // Add debug logging
        if (popularity > 0) {
          console.log(`Country ${mappedName} has popularity ${popularity}`);
        }
        
        return {
          ...country,
          properties: {
            ...country.properties,
            //color: getColorForPopularity(popularity),
            popularity: popularity,
            color: popularity != null
              ? getColorForPopularity(popularity, minPopularity, maxPopularity)
              : '#ccc'
          }
        };
      });
      
      setCountryData(updatedCountries);
    }

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
  }

  const getColorForPopularity = (popularity) => {
    if (!popularity) return "#ccc";
    
    // Simple linear interpolation between yellow and blue
    const minPopularity = 0;
    const maxPopularity = 100;
    const normalizedValue = (popularity - minPopularity) / (maxPopularity - minPopularity);
    
    // RGB values for yellow (hsl(62,100%,90%)) and blue (hsl(228,30%,20%))
    const startColor = [255, 255, 230]; // Light yellow
    const endColor = [41, 51, 92];      // Dark blue
    
    const r = Math.round(startColor[0] + normalizedValue * (endColor[0] - startColor[0]));
    const g = Math.round(startColor[1] + normalizedValue * (endColor[1] - startColor[1]));
    const b = Math.round(startColor[2] + normalizedValue * (endColor[2] - startColor[2]));
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  const handleCountryClick = (country) => {
    const countryName = country.properties.NAME || country.properties.ADMIN;
    const mappedName = countryNameMapping[countryName] || countryName;
    
    if (dataByCountry[mappedName]) {
      // TODO: Implement country statistics view
      console.log(`Clicked on ${mappedName}`);
    }
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
              const newFilterType = e.target.value;
              setFilterType(newFilterType);
              setFilterValue('all');
              
              // Update filter options based on the new filter type
              if (musicData) {
                const genres = new Set();
                const artists = new Set();
                const songs = new Set();
                
                musicData.forEach(row => {
                  genres.add(row.Genre);
                  artists.add(row.Artist);
                  songs.add(row.Title);
                });
                
                updateFilterOptions(newFilterType, { genres, artists, songs });
              }
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
      
      <div className="map-visualization">
        <h2>{title}</h2>
        <div style={{ height: '500px', width: '100%' }}>
          {countryData.length > 0 && (
            <Globe
              ref={globeRef}
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
              backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
              polygonsData={countryData}
              polygonCapColor={d => d.properties.color}
              polygonSideColor={() => 'rgba(0, 0, 0, 0.15)'}
              polygonStrokeColor={() => '#111'}
              polygonLabel={({ properties: d }) => `
                <div style="padding: 10px; background: rgba(0, 0, 0, 0.7); border-radius: 5px;">
                  <div><b>${d.NAME || d.ADMIN}</b></div>
                  <div>Popularity: ${d.popularity ? d.popularity.toFixed(2) : 'No data'}</div>
                </div>
              `}
              onPolygonClick={handleCountryClick}
              polygonsTransitionDuration={300}
              width={800}
              height={500}
              key={JSON.stringify(countryData)}
            />
          )}
        </div>
        
        <div className="color-legend">
          <h4>Popularity Scale</h4>
          <div className="color-gradient">
            <div style={{ background: 'linear-gradient(to right, rgb(255, 255, 230), rgb(41, 51, 92))', height: '20px', width: '200px' }}></div>
            
            <div className="color-labels">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapPlot 