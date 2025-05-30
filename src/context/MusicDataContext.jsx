import { createContext, useContext, useState, useEffect, useRef } from 'react'
import * as d3 from 'd3'

const MusicDataContext = createContext()

export const useMusicData = () => {
  const context = useContext(MusicDataContext)
  if (!context) {
    throw new Error('useMusicData must be used within a MusicDataProvider')
  }
  return context
}

const titleCase = str =>
  str
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')

  
const parseArtistString = (artistStr) => {
  try {
    // Remove the outer square brackets and split by comma
    const cleanStr = artistStr.replace(/[\[\]]/g, '')
    // Split by comma and clean up each artist name
    return cleanStr.split(',')
      .map(artist => {
        // First trim whitespace
        let cleanArtist = artist.trim()
        // Remove single quotes at the start and end
        cleanArtist = cleanArtist.replace(/^'|'$/g, '')
        // Remove double quotes at the start and end
        cleanArtist = cleanArtist.replace(/^"|"$/g, '')
        return cleanArtist
      })
      .filter(artist => artist) // Remove empty strings
  } catch (error) {
    console.error('Error parsing artist string:', artistStr, error)
    return []
  }
}

const calculateArtistStats = (artistStatsData, artist) => {
  if (!artist || !artistStatsData) return null;
  
  const artistData = artistStatsData.find(data => data.Artist === artist);
  if (!artistData) return null;
  
  // Helper function to safely parse JSON strings
  const parseJsonField = (field, fieldName) => {
    if (!field) return [];
    try {
      return JSON.parse(field);
    } catch (error) {
      console.error(`Error parsing ${fieldName} for artist`, artist, ':', field, error);
      return [];
    }
  };


  return {
    attributes: {
      danceability: parseFloat(artistData.danceability) || 0,
      energy: parseFloat(artistData.energy) || 0,
      speechiness: parseFloat(artistData.speechiness) || 0,
      acoustics: parseFloat(artistData.acoustics) || 0,
      liveliness: parseFloat(artistData.liveliness) || 0,
      valence: parseFloat(artistData.valence) || 0,
      tempo: parseFloat(artistData.tempo) || 0
    },
    songCount: parseInt(artistData.songCount) || 0,
    trackCount: parseInt(artistData.track_count) || 0,
    top50Count: parseInt(artistData.top50_count) || 0,
    top10Count: parseInt(artistData.top10_count) || 0,
    popuMaxList: parseJsonField(artistData.popu_max_list, 'popu_max_list'),
    title: parseJsonField(artistData.title, 'title'),
    uri: parseJsonField(artistData.uri, 'uri')
  }
}

const calculateGlobalThresholds = (data) => {
  const calculatePercentiles = (values, p33, p67) => {
    const sorted = values.filter(v => !isNaN(v)).sort((a, b) => a - b)
    const len = sorted.length
    return {
      p33: sorted[Math.floor(len * p33)],
      p67: sorted[Math.floor(len * p67)]
    }
  }

  // Extract values for each feature
  const tempoValues = data.map(song => parseFloat(song.tempo)).filter(v => !isNaN(v))
  const energyValues = data.map(song => parseFloat(song.energy)).filter(v => !isNaN(v))
  const danceabilityValues = data.map(song => parseFloat(song.danceability)).filter(v => !isNaN(v))
  const valenceValues = data.map(song => parseFloat(song.valence)).filter(v => !isNaN(v))
  const acousticsValues = data.map(song => parseFloat(song.acoustics)).filter(v => !isNaN(v))
  const livelinessValues = data.map(song => parseFloat(song.liveliness)).filter(v => !isNaN(v))

  return {
    tempo: calculatePercentiles(tempoValues, 0.33, 0.67),
    energy: calculatePercentiles(energyValues, 0.33, 0.67),
    danceability: calculatePercentiles(danceabilityValues, 0.33, 0.67),
    valence: calculatePercentiles(valenceValues, 0.33, 0.67),
    acoustics: calculatePercentiles(acousticsValues, 0.33, 0.67),
    liveliness: calculatePercentiles(livelinessValues, 0.33, 0.67)
  }
}

const calculateCountryStats = (data, country, thresholds) => {
  const countryData = data.filter(d => d.Country?.trim() === country)
  const totalSongs = countryData.length
  
  const genreCounts = {}
  countryData.forEach(song => {
    const genre = song.Genre ? song.Genre.charAt(0).toUpperCase() + song.Genre.slice(1).toLowerCase() : 'Unknown'
    genreCounts[genre] = (genreCounts[genre] || 0) + 1
  })
  
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
  
  // Artist distribution based on popularity
  const artistPopularity = {}
  const artistSongCounts = {}
  countryData.forEach(song => {
    let artistName = 'Unknown'
    if (song.Artist) {
      try {
        const artistList = JSON.parse(song.Artist.replace(/'/g, '"'))
        if (Array.isArray(artistList) && artistList.length > 0) {
          artistName = artistList[0] 
        }
      } catch (e) {
        artistName = song.Artist
      }
    }
    
    const popularity = parseFloat(song.Popularity) || 0
    if (!artistPopularity[artistName]) {
      artistPopularity[artistName] = 0
      artistSongCounts[artistName] = 0
    }
    artistPopularity[artistName] += popularity
    artistSongCounts[artistName] += 1
  })
  
  // Calculate total popularity for each artist and get top artists (sorted by total popularity)
  const topArtists = Object.entries(artistPopularity)
    .map(([artist, totalPopularity]) => ({
      artist,
      totalPopularity: Math.round(totalPopularity),
      avgPopularity: totalPopularity / artistSongCounts[artist],
      songCount: artistSongCounts[artist]
    }))
    .sort((a, b) => b.totalPopularity - a.totalPopularity)
    .slice(0, 5)
  
  const songPopularity = {}
  const songDetails = {}
  countryData.forEach(song => {
    const songTitle = song.Title || 'Unknown'
    const songUri = song.Uri || ''
    let artistName = 'Unknown'
    
    if (song.Artist) {
      try {
        const artistList = JSON.parse(song.Artist.replace(/'/g, '"'))
        if (Array.isArray(artistList) && artistList.length > 0) {
          artistName = artistList[0]
        }
      } catch (e) {
        artistName = song.Artist
      }
    }
    
    const popularity = parseFloat(song.Popularity) || 0
    const songKey = `${songTitle} - ${artistName}`
    
    if (!songPopularity[songKey]) {
      songPopularity[songKey] = 0
      songDetails[songKey] = {
        title: songTitle,
        artist: artistName,
        uri: songUri,
        count: 0
      }
    }
    songPopularity[songKey] += popularity
    songDetails[songKey].count += 1
  })
  
  const topSongs = Object.entries(songPopularity)
    .map(([songKey, totalPopularity]) => ({
      title: songDetails[songKey].title,
      artist: songDetails[songKey].artist,
      uri: songDetails[songKey].uri,
      totalPopularity: Math.round(totalPopularity),
      count: songDetails[songKey].count
    }))
    .sort((a, b) => b.totalPopularity - a.totalPopularity)
    .slice(0, 5)

  const totalCountryPopularity = Math.round(countryData.reduce((sum, song) => sum + (parseFloat(song.Popularity) || 0), 0))
  
  // Tempo distribution 
  const fastCount = countryData.filter(song => parseFloat(song.tempo) > thresholds.tempo.p67).length
  const mediumCount = countryData.filter(song => {
    const tempo = parseFloat(song.tempo)
    return tempo >= thresholds.tempo.p33 && tempo <= thresholds.tempo.p67
  }).length
  const slowCount = countryData.filter(song => parseFloat(song.tempo) < thresholds.tempo.p33).length
  const tempoDistribution = [
    { category: 'Fast', percentage: (fastCount / totalSongs) * 100 },
    { category: 'Medium', percentage: (mediumCount / totalSongs) * 100 },
    { category: 'Slow', percentage: (slowCount / totalSongs) * 100 }
  ]
  
  // Energy levels 
  const highEnergyCount = countryData.filter(song => parseFloat(song.energy) > thresholds.energy.p67).length
  const mediumEnergyCount = countryData.filter(song => {
    const energy = parseFloat(song.energy)
    return energy >= thresholds.energy.p33 && energy <= thresholds.energy.p67
  }).length
  const lowEnergyCount = countryData.filter(song => parseFloat(song.energy) < thresholds.energy.p33).length
  const energyDistribution = [
    { category: 'High', percentage: (highEnergyCount / totalSongs) * 100 },
    { category: 'Medium', percentage: (mediumEnergyCount / totalSongs) * 100 },
    { category: 'Low', percentage: (lowEnergyCount / totalSongs) * 100 }
  ]
  
  // Danceability levels 
  const highDanceCount = countryData.filter(song => parseFloat(song.danceability) > thresholds.danceability.p67).length
  const mediumDanceCount = countryData.filter(song => {
    const danceability = parseFloat(song.danceability)
    return danceability >= thresholds.danceability.p33 && danceability <= thresholds.danceability.p67
  }).length
  const lowDanceCount = countryData.filter(song => parseFloat(song.danceability) < thresholds.danceability.p33).length
  const danceDistribution = [
    { category: 'High', percentage: (highDanceCount / totalSongs) * 100 },
    { category: 'Medium', percentage: (mediumDanceCount / totalSongs) * 100 },
    { category: 'Low', percentage: (lowDanceCount / totalSongs) * 100 }
  ]
  
  // Valence (happiness) levels 
  const highValenceCount = countryData.filter(song => parseFloat(song.valence) > thresholds.valence.p67).length
  const mediumValenceCount = countryData.filter(song => {
    const valence = parseFloat(song.valence)
    return valence >= thresholds.valence.p33 && valence <= thresholds.valence.p67
  }).length
  const lowValenceCount = countryData.filter(song => parseFloat(song.valence) < thresholds.valence.p33).length
  const valenceDistribution = [
    { category: 'Happy', percentage: (highValenceCount / totalSongs) * 100 },
    { category: 'Neutral', percentage: (mediumValenceCount / totalSongs) * 100 },
    { category: 'Sad', percentage: (lowValenceCount / totalSongs) * 100 }
  ]
  
  // Acoustics levels
  const highAcousticsCount = countryData.filter(song => parseFloat(song.acoustics) > thresholds.acoustics.p67).length
  const mediumAcousticsCount = countryData.filter(song => {
    const acoustics = parseFloat(song.acoustics)
    return acoustics >= thresholds.acoustics.p33 && acoustics <= thresholds.acoustics.p67
  }).length
  const lowAcousticsCount = countryData.filter(song => parseFloat(song.acoustics) < thresholds.acoustics.p33).length
  const acousticsDistribution = [
    { category: 'Acoustic', percentage: (highAcousticsCount / totalSongs) * 100 },
    { category: 'Mixed', percentage: (mediumAcousticsCount / totalSongs) * 100 },
    { category: 'Electronic', percentage: (lowAcousticsCount / totalSongs) * 100 }
  ]
  
  // Liveliness levels
  const highLivelinessCount = countryData.filter(song => parseFloat(song.liveliness) > thresholds.liveliness.p67).length
  const mediumLivelinessCount = countryData.filter(song => {
    const liveliness = parseFloat(song.liveliness)
    return liveliness >= thresholds.liveliness.p33 && liveliness <= thresholds.liveliness.p67
  }).length
  const lowLivelinessCount = countryData.filter(song => parseFloat(song.liveliness) < thresholds.liveliness.p33).length
  const livelinessDistribution = [
    { category: 'Live', percentage: (highLivelinessCount / totalSongs) * 100 },
    { category: 'Mixed', percentage: (mediumLivelinessCount / totalSongs) * 100 },
    { category: 'Studio', percentage: (lowLivelinessCount / totalSongs) * 100 }
  ]
  
  return {
    totalSongs,
    topGenres,
    topArtists,
    topSongs,
    totalCountryPopularity,
    tempoDistribution,
    energyDistribution,
    danceDistribution,
    valenceDistribution,
    acousticsDistribution,
    livelinessDistribution
  }
}

const processData = (musicData) => {
  console.log('Processing music data...')
  const newDataByCountry = {}
  const genres = new Set()
  const songs = new Set()
  const genresNew  = new Set() 
  const artists = new Set()

  musicData.forEach((row, index) => {
    if (index % 10000 === 0) {
      console.log(`Processing row ${index} of ${musicData.length}...`)
    }
    const raw = row.Artist.replace(/[\[\]']+/g, '')
    const country = row.Country.trim()
    const genre = titleCase(row.Genre)
    const artistList = raw
      .split(',')
      .map(a => titleCase(a.trim()))
      .filter(a => a !== '')
    artistList.forEach(a => artists.add(a))
    const song = titleCase(row.Title)
    const genreNew = titleCase(row.Genre_new || '')
    genres.add(genre)
    songs.add(song)
    genresNew.add(genreNew)

    if (!newDataByCountry[country]) {
      newDataByCountry[country] = {
        songs: [],
        popularity: 0,
        count: 0
      }
    }

    newDataByCountry[country].songs.push({
      title: song,
      artists: artistList,
      genre: genre,
      genre_new: genreNew,
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

  Object.keys(newDataByCountry).forEach(country => {
    if (newDataByCountry[country].count > 0) {
      newDataByCountry[country].popularity /= newDataByCountry[country].count
    }
  })

  console.log('Data processing complete:', {
    totalCountries: Object.keys(newDataByCountry).length,
    totalGenres: genres.size,
    totalSongs: songs.size
  })

  return {
    dataByCountry: newDataByCountry,
    genres: Array.from(genres),
    artists: Array.from(artists),
    songs: Array.from(songs),
    genresNew: Array.from(genresNew),
  }
}

export const MusicDataProvider = ({ children }) => {
  const [musicData, setMusicData] = useState(null)
  const [processedData, setProcessedData] = useState(null)
  const [artists, setArtists] = useState([])
  const [artistStatsData, setArtistStatsData] = useState(null)
  const [globalThresholds, setGlobalThresholds] = useState(null)
  const [genres, setGenres] = useState([])
  const [validCountries, setValidCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const hasLoadedData = useRef(false)
  const countryStatsCacheRef = useRef({})

  useEffect(() => {
    const loadData = async () => {
      // Prevent double loading in StrictMode
      if (hasLoadedData.current) {
        return
      }
      hasLoadedData.current = true

      try {
        console.log('Loading music and artist stats data...')
        const [musicDataResponse, artistStatsResponse] = await Promise.all([
          d3.csv("https://dl.dropboxusercontent.com/scl/fi/g5ldnl5g5fai6o5twc587/cleaned_data.csv?rlkey=nlhzlwfwymp7ma7497xw8kqdh&st=xr4zrmns&dl=0"),
          d3.csv("https://dl.dropboxusercontent.com/scl/fi/vyj0f7mq9xodz5yn5naep/artist_attributes_info_joined2.csv?rlkey=540an69xs9i30x59ho95gbgw4&st=f9ces8ay&dl=0")
        ]);

        console.log('Music data loaded successfully:', {
          totalRecords: musicDataResponse.length,
          sampleRecord: musicDataResponse[0],
          columns: Object.keys(musicDataResponse[0])
        })

        console.log('Artist stats data loaded successfully:', {
          totalArtists: artistStatsResponse.length,
          sampleRecord: artistStatsResponse[0],
          columns: Object.keys(artistStatsResponse[0])
        })

        setMusicData(musicDataResponse)
        setArtistStatsData(artistStatsResponse)
        
        const processed = processData(musicDataResponse)
        setProcessedData(processed)
        
        // Calculate global thresholds once
        const thresholds = calculateGlobalThresholds(musicDataResponse)
        setGlobalThresholds(thresholds)
        
        // Get artists from the precomputed stats data and sort them alphabetically
        const artistList = artistStatsResponse
          .map(data => data.Artist)
          .sort((a, b) => a.localeCompare(b));
        setArtists(artistList)
        
        // Add genres processing here
        setGenres(processed.genres)
        
        // Get valid countries (with at least 30 songs) but don't pre-calculate all stats
        const countryCounts = {}
        musicDataResponse.forEach(song => {
          const country = song.Country?.trim()
          if (country) {
            countryCounts[country] = (countryCounts[country] || 0) + 1
          }
        })
        
        const validCountriesList = Object.entries(countryCounts)
          .filter(([_, count]) => count >= 30)
          .map(([country]) => country)
          .sort()
        
        setValidCountries(validCountriesList)
        console.log('Valid countries loaded:', validCountriesList.length)
      } catch (err) {
        console.error('Error loading data:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const value = {
    musicData,
    processedData,
    artists,
    artistStatsData,
    globalThresholds,
    genres,
    validCountries,
    countryStatsCache: countryStatsCacheRef.current,
    getCountryStats: (country) => {
      // Calculate on-demand and cache the result
      if (!countryStatsCacheRef.current[country] && musicData && globalThresholds) {
        const stats = calculateCountryStats(musicData, country, globalThresholds)
        countryStatsCacheRef.current[country] = stats
        return stats
      }
      return countryStatsCacheRef.current[country] || null
    },
    calculateArtistStats: (artist) => calculateArtistStats(artistStatsData, artist),
    calculateCountryStats: (country) => calculateCountryStats(musicData, country, globalThresholds),
    loading,
    error
  }

  return (
    <MusicDataContext.Provider value={value}>
      {children}
    </MusicDataContext.Provider>
  )
} 