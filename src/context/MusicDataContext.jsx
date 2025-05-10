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

export const MusicDataProvider = ({ children }) => {
  const [musicData, setMusicData] = useState(null)
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
    loading,
    error
  }

  return (
    <MusicDataContext.Provider value={value}>
      {children}
    </MusicDataContext.Provider>
  )
} 