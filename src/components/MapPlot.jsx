import { useEffect, useRef, useState, useMemo } from 'react'
import { useMusicData } from '../context/MusicDataContext'
import Globe from 'react-globe.gl'
import { interpolateViridis } from 'd3-scale-chromatic'
import Select from 'react-select'

const MapPlot = ({ currentView, setCurrentView, setSelectedCountry }) => {
  const { processedData, loading, error } = useMusicData();
  const [filterType, setFilterType] = useState('genre');
  const [filterValue, setFilterValue] = useState('all');
  const [filterOptions, setFilterOptions] = useState([]);
  const [title, setTitle] = useState('Music Popularity by Country');
  //const [countryData, setCountryData] = useState([]);
  const [basePolygons, setBasePolygons] = useState([]);
  const [coloredPolygons, setColoredPolygons] = useState([]);
  const globeRef = useRef();

  const countryNameMapping = {
    "United States of America": "USA",
    "United States": "USA",
    "United Kingdom": "UK",
    "Great Britain": "UK",
    "England": "UK",
    "Scotland": "UK",
    "Wales": "UK",
    "Northern Ireland": "UK"
  }

  const typeOptions = useMemo(() => [
    { value: 'genre',  label: 'Genre'  },
    { value: 'artist', label: 'Artist' },
    { value: 'song',   label: 'Song'   }
  ], [])

  const valueOptions = useMemo(() => {
    if (!processedData) return []
    const raw =
      filterType === 'genre'  ? processedData.genres  :
      filterType === 'artist' ? processedData.artists :
      filterType === 'song'   ? processedData.songs   :
      []
    return [
      { value: 'all', label: 'All' },
      ...raw.map(opt => ({
        value: opt,
        label: opt.length > 40
          ? opt.slice(0,40) + '…'
          : opt
      }))
    ]
  }, [processedData, filterType])

  useEffect(() => {
    if (processedData?.dataByCountry) {
      switch (filterType) {
        case 'genre':
          setFilterOptions(processedData.genres);
          break;
        case 'artist':
          setFilterOptions(processedData.artists);
          break;
        case 'song':
          setFilterOptions(processedData.songs);
          break;
        default:
          setFilterOptions([]);
      }
    }
  }, [processedData, filterType]);

  useEffect(() => {
    // Only run once both music data and raw polygons exist
    if (!processedData?.dataByCountry || basePolygons.length === 0) return;
  
    // 1) Compute per-country average popularity + min/max
    const countryToPopularity = {};
    let min = Infinity, max = 0;
  
    Object.entries(processedData.dataByCountry).forEach(([country, info]) => {
      let songs = info.songs;
      if (filterValue !== 'all') {
        songs = songs.filter(s => {
          if (filterType === 'genre')  return s.genre === filterValue;
          if (filterType === 'artist') return s.artist === filterValue;
          if (filterType === 'song')   return s.title === filterValue;
        });
      }
      if (songs.length) {
        const avg = songs.reduce((sum, s) => sum + s.popularity, 0) / songs.length;
        countryToPopularity[country] = avg;
        min = Math.min(min, avg);
        max = Math.max(max, avg);
      }
    });
  
    // 2) Map raw polygons → colored based on popularity
    const updated = basePolygons.map(poly => {
      const name = poly.properties.NAME || poly.properties.ADMIN;
      const pop  = countryToPopularity[name] || 0;
      return {
        ...poly,
        properties: {
          ...poly.properties,
          popularity: pop,
          color: pop > 0
            ? interpolateViridis((pop - min) / (max - min))
            : '#ccc'
        }
      };
    });
  
    setColoredPolygons(updated);
  
    // 3) Update your title
    setTitle(
      filterValue === 'all'
        ? 'Overall Average Popularity'
        : `Popularity of ${filterValue}`
    );
  }, [processedData, basePolygons, filterType, filterValue]);

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
        setBasePolygons(countries)
      });
  }, []);

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
      dataByCountryKeys: Object.keys(processedData.dataByCountry),
      filterType,
      filterValue,
      filterOptions
    })

    // Calculate country popularities
    const countryToPopularity = {}
    let maxPopularity = 0;
    let minPopularity = Infinity;
    Object.keys(processedData.dataByCountry).forEach(country => {
      let countryData = processedData.dataByCountry[country]
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
    // Grey for no data
    if (!popularity) return '#ccc';

    // Normalize to [0,1] and clamp
    const t = Math.max(0, Math.min(1, (popularity - minPopularity) / (maxPopularity - minPopularity)));

    return interpolateViridis(t);
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

  // Color legend gradient
  const legendGradient = `linear-gradient(to right, 
  ${interpolateViridis(0)}, 
  ${interpolateViridis(0.25)}, 
  ${interpolateViridis(0.5)}, 
  ${interpolateViridis(0.75)}, 
  ${interpolateViridis(1)}
  )`

  const selectStyles = {
    container: base => ({
      ...base,
      width: '300px',
      marginBottom: '10px'
    }),
    control: base => ({
      ...base,
      minHeight: '38px',
      fontSize: '0.9rem'
    }),
    menu: base => ({
      ...base,
      maxHeight: '280px',
      overflowY: 'auto'
    }),
    menuList: base => ({
      ...base,
      padding: 0
    })
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error loading data: {error.message}</div>

  return (
    <div
      className="map-container"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      {/* Title */}
      <h1
        style={{
          position: 'absolute',
          top: '20px',
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
          <label style={{ marginRight: '8px' }}>Filter by:</label>
          <Select
            styles={selectStyles}
            options={[
              { value: 'genre', label: 'Genre' },
              { value: 'artist', label: 'Artist' },
              { value: 'song', label: 'Song' }
            ]}
            value={{ value: filterType, label: capitalize(filterType) }}
            onChange={opt => {
              const newType = opt.value
              setFilterType(newType)
              setFilterValue('all')
            }}
            isSearchable
            placeholder="Select type…"
            menuPlacement="auto"
          />
        </div>

        {/* Filter by value */}
        <div className="filter-row">
          <label style={{ marginRight: '8px' }}>Value:</label>
          <Select
            styles={selectStyles}
            options={[
              { value: 'all', label: 'All' },
              ...filterOptions.map(opt => ({
                value: opt,
                label: capitalize(opt.length > 40 ? opt.slice(0, 40) + '…' : opt)
              }))
            ]}
            value={{ value: filterValue, label: capitalize(filterValue) }}
            onChange={opt => setFilterValue(opt.value)}
            isSearchable
            placeholder="Select value…"
            menuPlacement="auto"
          />
        </div>
      </div>

      {/* Globe */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {coloredPolygons.length > 0 && (
          <Globe
            ref={globeRef}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            polygonsData={coloredPolygons}
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
            key={JSON.stringify(coloredPolygons)}
          />
        )}
      </div>

      {/* Color Legend */}
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
            background: legendGradient,
            height: '12px',
            width: '200px',
            borderRadius: '6px',
            margin: '0 auto'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  )

}

export default MapPlot 