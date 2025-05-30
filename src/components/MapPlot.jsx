import { useEffect, useRef, useState, useMemo } from 'react'
import { useMusicData } from '../context/MusicDataContext'
import Globe from 'react-globe.gl'
import { interpolateViridis } from 'd3-scale-chromatic'
import Select from 'react-select'
import LoadingSpinner from './LoadingSpinner'
import { motion } from 'framer-motion'

const MapPlot = ({ currentView, setCurrentView, setSelectedCountry }) => {
  const { processedData, loading, error } = useMusicData();
  const [filterType, setFilterType] = useState('genre');
  const [filterValue, setFilterValue] = useState('all');
  const [filterOptions, setFilterOptions] = useState([]);
  const [title, setTitle] = useState('Music Popularity by Country');
  const [basePolygons, setBasePolygons] = useState([]);
  const [coloredPolygons, setColoredPolygons] = useState([]);
  const [showOverlay, setShowOverlay] = useState(() => {
    const hasSeenOverlay = localStorage.getItem('hasSeenMapOverlay');
    return hasSeenOverlay !== 'true';
  });
  const globeRef = useRef();

  const countryNameMapping = {
    "GBR": "UK",
    "USA": "USA",
  }

  const titleCase = (str) =>
    str
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  const typeOptions = useMemo(() => {
    const arr = ['genre', 'artist', 'song']
    return arr
      .map(v => ({ value: v, label: titleCase(v) }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [])

  const valueOptions = useMemo(() => {
    if (!processedData) return []
    let raw =
      filterType === 'genre' ? processedData.genres :
        filterType === 'artist' ? processedData.artists :
          filterType === 'song' ? processedData.songs :
            []

    raw = Array.from(new Set(raw))
    raw.sort((a, b) => a.localeCompare(b))

    return [
      { value: 'all', label: 'All' },
      ...raw.map(opt => ({
        value: opt,
        label: titleCase(
          opt.length > 40
            ? opt.slice(0, 40) + '…'
            : opt
        )
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
    if (!processedData?.dataByCountry || basePolygons.length === 0) return;

    const countryToPopularity = {};
    let min = Infinity, max = 0;

    Object.entries(processedData.dataByCountry).forEach(([country, info]) => {
      let songs = info.songs;
      if (filterValue !== 'all') {
        songs = songs.filter(s => {
          if (filterType === 'genre') return s.genre === filterValue;
          if (filterType === 'artist') return s.artists.includes(filterValue);
          if (filterType === 'song') return s.title === filterValue;
        });
      }
      if (songs.length) {
        const avg = songs.reduce((sum, s) => sum + s.popularity, 0) / songs.length;
        countryToPopularity[country] = avg;
        min = Math.min(min, avg);
        max = Math.max(max, avg);
      }
    });

    const updated = basePolygons.map(poly => {
      const name = poly.properties.NAME || poly.properties.ADMIN;

      const iso3 = poly.properties.ADM0_A3;

      const key = countryNameMapping[name]
           || countryNameMapping[iso3]
           || name;

      const pop = countryToPopularity[key] || 0;

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

    setTitle(
      filterValue === 'all'
        ? 'Overall Average Popularity'
        : `Popularity of ${filterValue}`
    );
  }, [processedData, basePolygons, filterType, filterValue]);

  useEffect(() => {
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


  const handleCountryClick = (country) => {
    const name = country.properties.NAME || country.properties.ADMIN
    const iso3 = country.properties.ADM0_A3
  
    const mappedName =
      countryNameMapping[name]  || 
      countryNameMapping[iso3]  || 
      name
  
    if (processedData.dataByCountry?.[mappedName]) {
      setSelectedCountry(mappedName)
      setCurrentView('country-stats')
      console.log(`Navigating to statistics for: ${mappedName}`)
    }
  }

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

  if (loading) return <LoadingSpinner message="Loading Data..." />
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

      <button
        onClick={() => setShowOverlay(true)}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 12,
          background: 'rgba(0,0,0,0.6)',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          cursor: 'pointer',
          fontSize: '1.2rem'
        }}
      >
        ℹ️
      </button>
      {showOverlay && (
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 11,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            textAlign: 'center',
            padding: '20px'
          }}
        >
          <div style={{ maxWidth: '600px', marginBottom: '20px', fontSize: '1.2rem' }}>
            Welcome to Spotify in Data!<br />
            Music plays an important role in most peoples lives. It motivates, helps in difficult times and
            makes the best moments even more beautiful.
            This project analyzes Spotify Chart Data to
            dive deep into the world of music and discovers how the popularity of genres, songs
            and artists as well as music attributes differ between countries. Start discovering the popularity of
            your favorite genres, artists and songs across the world by using the filters below. Interact with the globe to explore
            the data and whenever you are ready, click on a country to see the statistics for that country.
            To compare your favorite artists, click on the "Artist Comparison" button in the navigation bar.
          </div>
          <button
            onClick={() => {
              setShowOverlay(false);
              localStorage.setItem('hasSeenMapOverlay', 'true');
            }}
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              background: '#1ED760',
              color: '#fff'
            }}
          >
            Explore the world of music
          </button>
        </div>
      )}
      <h1
        style={{
          position: 'absolute',
          top: '5px',
          left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
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
        <h2 style={{ fontSize: '1.4rem', margin: '0 0 0.75rem' }}>
          {title}
        </h2>

        <div className="filter-row" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
          <label style={{ marginRight: '8px' }}>Filter by:</label>
          <Select
            styles={selectStyles}
            options={typeOptions}
            value={typeOptions.find(o => o.value === filterType)}
            onChange={opt => {
              setFilterType(opt.value)
              setFilterValue('all')
            }}
            isSearchable
            placeholder="Select type…"
            menuPlacement="auto"
          />
        </div>

        <div className="filter-row" style={{ display: 'flex', alignItems: 'center' }}>
          <label style={{ marginRight: '8px' }}>Value:</label>
          <Select
            styles={selectStyles}
            options={valueOptions}
            value={valueOptions.find(o => o.value === filterValue)}
            onChange={opt => setFilterValue(opt.value)}
            isSearchable
            placeholder="Select value…"
            menuPlacement="auto"
          />
        </div>
      </div>

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
          />
        )}
      </div>

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