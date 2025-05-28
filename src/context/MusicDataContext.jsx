import { createContext, useContext, useState, useEffect } from 'react'
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

const processArtistData = (musicData) => {
  console.log('Processing artist data...')
  const allArtists = new Set()
  
  musicData.forEach(song => {
    const songArtists = parseArtistString(song.Artist)
    songArtists.forEach(artist => {
      if (artist) {
        allArtists.add(artist)
      }
    })
  })
  
  // Convert to array and sort
  const uniqueArtists = Array.from(allArtists).sort((a, b) => a.localeCompare(b))
  
  console.log('Artist processing complete:', {
    totalArtists: uniqueArtists.length,
    sampleArtists: uniqueArtists.slice(0, 5)
  })
  
  return uniqueArtists
}

const calculateArtistStats = (musicData, artist) => {
  if (!artist || !musicData) return null;
  
  const artistSongs = musicData.filter(song => {
    const songArtists = parseArtistString(song.Artist)
    return songArtists.includes(artist)
  })
  
  if (artistSongs.length === 0) return null;
  
  const attributes = {
    danceability: 0,
    energy: 0,
    speechiness: 0,
    acoustics: 0,
    instrumentalness: 0,
    liveliness: 0,
    valence: 0,
    tempo: 0
  }
  
  artistSongs.forEach(song => {
    attributes.danceability += parseFloat(song.danceability) || 0
    attributes.energy += parseFloat(song.energy) || 0
    attributes.speechiness += parseFloat(song.speechiness) || 0
    attributes.acoustics += parseFloat(song.acoustics) || 0
    attributes.instrumentalness += parseFloat(song.instrumentalness) || 0
    attributes.liveliness += parseFloat(song.liveliness) || 0
    attributes.valence += parseFloat(song.valence) || 0
    attributes.tempo += parseFloat(song.tempo) || 0
  })
  
  Object.keys(attributes).forEach(key => {
    attributes[key] = attributes[key] / artistSongs.length
  })
  
  return {
    attributes,
    songCount: artistSongs.length
  }
}

const processData = (musicData) => {
  console.log('Processing music data...')
  const newDataByCountry = {}
  const genres = new Set()
  const artists = new Set()
  const songs = new Set()
  const genresNew  = new Set() 

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
    totalArtists: artists.size,
    totalSongs: songs.size
  })

  return {
    dataByCountry: newDataByCountry,
    genres: Array.from(genres),
    artists: Array.from(artists),
    songs: Array.from(songs),
    genresNew: Array.from(genresNew)
  }
}

export const MusicDataProvider = ({ children }) => {
  const [musicData, setMusicData] = useState(null)
  const [processedData, setProcessedData] = useState(null)
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading music data...')
        const data = await d3.csv("https://dl.dropboxusercontent.com/scl/fi/g5ldnl5g5fai6o5twc587/cleaned_data.csv?rlkey=nlhzlwfwymp7ma7497xw8kqdh&st=xr4zrmns&dl=0")
        console.log('Music data loaded successfully:', {
          totalRecords: data.length,
          sampleRecord: data[0],
          columns: Object.keys(data[0])
        })
        setMusicData(data)
        const processed = processData(data)
        setProcessedData(processed)
        const artistList = processArtistData(data)
        setArtists(artistList)
      } catch (err) {
        console.error('Error loading music data:', err)
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
    calculateArtistStats: (artist) => calculateArtistStats(musicData, artist),
    loading,
    error
  }

  return (
    <MusicDataContext.Provider value={value}>
      {children}
    </MusicDataContext.Provider>
  )
} 