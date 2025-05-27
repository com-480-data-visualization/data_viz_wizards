import { useEffect, useRef, useState } from 'react'
import { useMusicData } from '../context/MusicDataContext'
import Globe from 'react-globe.gl'
import Select from 'react-select';

const MapPlot = ({ currentView, setCurrentView, setSelectedCountry }) => {
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
      if (index % 10000 === 0) {
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
    switch (type) {
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
      switch (filterType) {
        case "genre":
          newTitle = `Popularity of ${filterValue}`
          break
        case "artist":
          newTitle = `Popularity of ${filterValue}`
          break
        case "song":
          newTitle = `Popularity of ${filterValue}`
          break
      }
    } else {
      newTitle = "Overall Average Popularity"
    }
    setTitle(newTitle)
  }

  const getColorForPopularity = (popularity, minPopularity, maxPopularity) => {
    if (!popularity) return '#ccc';

    const normalizedValue = (popularity - minPopularity) / (maxPopularity - minPopularity);

    // RGB values for green and red
    const startColor = [255, 0, 0];
    const endColor = [0, 255, 0];

    const r = Math.round(startColor[0] + normalizedValue * (endColor[0] - startColor[0]));
    const g = Math.round(startColor[1] + normalizedValue * (endColor[1] - startColor[1]));
    const b = Math.round(startColor[2] + normalizedValue * (endColor[2] - startColor[2]));

    return `rgb(${r}, ${g}, ${b})`;
  }

  const handleCountryClick = (country) => {
    const countryName = country.properties.NAME || country.properties.ADMIN;
    const mappedName = countryNameMapping[countryName] || countryName;

    if (dataByCountry[mappedName]) {
      setSelectedCountry(mappedName);
      setCurrentView('country-stats');
      console.log(`Navigating to statistics for: ${mappedName}`);
    }
  };

  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

  const selectStyles = {
    container: (base) => ({
      ...base,
      //width: '100%',
      //marginBottom: '10px'
    }),
    control: (base) => ({
      ...base,
      //minHeight: 38,
      fontSize: '0.9rem'
    }),
    menu: (base) => ({
      ...base,
      //maxHeight: 180,
      overflowY: 'auto',
      //zIndex: 5
    }),
    option: (base) => ({
      ...base,
      fontSize: '0.9rem',
      whiteSpace: 'nowrap',
      //overflow: 'hidden',
      textOverflow: 'ellipsis'
    })
  };

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error loading data: {error.message}</div>

  return (
    <>
      <h1
        style={{
          position: 'absolute',
          top: '70px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          fontSize: '2rem',
          color: '#fff',
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '10px 20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}
      >
        Spotify in Data: Popularity of Genres, Artists, and Songs Across the World
      </h1>

      <div
        className="map-container"
        style={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden'
        }}
      >

        {/* Filter Controls */}
        <div
          className="filter-panel"
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '20px',
            borderRadius: '10px',
            maxWidth: '320px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
          }}
        >
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>
            {title}
          </h2>

          <h3 style={{ marginBottom: '0.5rem' }}>Filter Options</h3>

          <div className="filter-row" style={{ marginBottom: '10px' }}>
            <label htmlFor="filter-type">Filter by: </label>
            <select
              id="filter-type"
              value={filterType}
              onChange={(e) => {
                const newFilterType = e.target.value;
                setFilterType(newFilterType);
                setFilterValue('all');

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
              style={{ width: '100%', padding: '6px', fontSize: '0.9rem' }}
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
              style={{ width: '100%', padding: '6px', fontSize: '0.9rem' }}
            >
              <option value="all">All</option>
              {filterOptions.map(option => (
                <option key={option} value={option}>
                  {capitalize(option.length > 40 ? option.slice(0, 40) + '…' : option)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Globe Container */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
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
              onPolygonClick={(country) => {
                const pop = country.properties.popularity;
                if (typeof pop === 'number' && !isNaN(pop)) {
                  handleCountryClick(country);
                }
              }}
              polygonsTransitionDuration={300}
              width={window.innerWidth}
              height={window.innerHeight}
              key={JSON.stringify(countryData)}
            />
          )}
        </div>

        {/* Color Legend Overlay */}
        <div
          className="color-legend"
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            background: 'rgba(0,0,0,0.6)',
            borderRadius: '8px',
            padding: '10px',
            color: '#fff',
            zIndex: 10
          }}
        >
          <div style={{ marginBottom: '5px' }}>Popularity Scale</div>
          <div
            style={{
              background: 'linear-gradient(to right, red, green)',
              height: '12px',
              width: '200px',
              borderRadius: '6px'
            }}
          ></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Low</span>
            <span>High</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default MapPlot 