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
        const data = await d3.csv("https://dl.dropboxusercontent.com/scl/fi/j0yasupjf1nln4jhh40hd/final_database.csv?rlkey=gxa8cqm23y9owq1lcuuzgvub4")
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