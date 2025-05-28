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
    songs: Array.from(songs)
  }
}

export const MusicDataProvider = ({ children }) => {
  const [musicData, setMusicData] = useState(null)
  const [processedData, setProcessedData] = useState(null)
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
    loading,
    error
  }

  return (
    <MusicDataContext.Provider value={value}>
      {children}
    </MusicDataContext.Provider>
  )
} 