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

const calculateArtistStats = (artistStatsData, artist) => {
  if (!artist || !artistStatsData) return null;
  
  const artistData = artistStatsData.find(data => data.Artist === artist);
  if (!artistData) return null;
  
  // Parse the popu_max_list string to an actual array
  let popuMaxList = [];
  if (artistData.popu_max_list) {
    try {
      // Remove any surrounding whitespace and parse as JSON
      const cleanString = artistData.popu_max_list.trim();
      if (cleanString.startsWith('[') && cleanString.endsWith(']')) {
        popuMaxList = JSON.parse(cleanString);
      } else {
        // If it's just a single number without brackets, wrap it in an array
        const num = parseInt(cleanString);
        if (!isNaN(num)) {
          popuMaxList = [num];
        }
      }
    } catch (error) {
      console.error('Error parsing popu_max_list for artist', artist, ':', artistData.popu_max_list, error);
      popuMaxList = [];
    }
  }
  
  return {
    attributes: {
      danceability: parseFloat(artistData.danceability) || 0,
      energy: parseFloat(artistData.energy) || 0,
      speechiness: parseFloat(artistData.speechiness) || 0,
      acoustics: parseFloat(artistData.acoustics) || 0,
      instrumentalness: parseFloat(artistData.instrumentalness) || 0,
      liveliness: parseFloat(artistData.liveliness) || 0,
      valence: parseFloat(artistData.valence) || 0,
      tempo: parseFloat(artistData.tempo) || 0
    },
    songCount: parseInt(artistData.songCount) || 0,
    trackCount: parseInt(artistData.track_count) || 0,
    top50Count: parseInt(artistData.top50_count) || 0,
    top10Count: parseInt(artistData.top10_count) || 0,
    popuMaxList: popuMaxList,
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
    songs: Array.from(songs)
  }
}

export const MusicDataProvider = ({ children }) => {
  const [musicData, setMusicData] = useState(null)
  const [processedData, setProcessedData] = useState(null)
  const [artists, setArtists] = useState([])
  const [artistStatsData, setArtistStatsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading music and artist stats data...')
        const [musicDataResponse, artistStatsResponse] = await Promise.all([
          d3.csv("https://dl.dropboxusercontent.com/scl/fi/g5ldnl5g5fai6o5twc587/cleaned_data.csv?rlkey=nlhzlwfwymp7ma7497xw8kqdh&st=xr4zrmns&dl=0"),
          d3.csv("https://dl.dropboxusercontent.com/scl/fi/hu15n5a40o698hx8dg7mq/artist_attributes_info_joined.csv?rlkey=5cpmwhrc5e5y05rncvnjnessh&st=lshqavpo&dl=0")
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
        
        // Get artists from the precomputed stats data and sort them alphabetically
        const artistList = artistStatsResponse
          .map(data => data.Artist)
          .sort((a, b) => a.localeCompare(b));
        setArtists(artistList)
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
    calculateArtistStats: (artist) => calculateArtistStats(artistStatsData, artist),
    loading,
    error
  }

  return (
    <MusicDataContext.Provider value={value}>
      {children}
    </MusicDataContext.Provider>
  )
} 