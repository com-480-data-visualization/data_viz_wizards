// src/components/DatasetOverview.jsx
import React, { useMemo } from 'react'
import { useMusicData } from '../context/MusicDataContext'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'
import LoadingSpinner from './LoadingSpinner'
import '../css/CountryStatistics.css'

export default function DatasetOverview() {
  const { processedData, loading, error } = useMusicData()

  if (loading || !processedData) return <LoadingSpinner />
  if (error) return <div>Error loading data: {error.message}</div>

  const { dataByCountry, genres, artists, songs, genresNew } = processedData

  const totalRecords = Object.values(dataByCountry).reduce((sum, c) => sum + c.count, 0)

  const top10 = key => {
    const sums = {}
    Object.values(dataByCountry).forEach(country => {
      country.songs.forEach(s => {
        const k = key === 'Genre_new' ? s.genre_new : (s[key.toLowerCase()] || s[key])
        sums[k] = (sums[k] || 0) + s.popularity
      })
    })
    return Object.entries(sums)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }

  const topArtists = top10('artists')
  const topSongs = top10('title')
  const topGenres = top10('genre')
  const topGenresNew = top10('genre_new')

  const tooltipStyle = {
    wrapperStyle: { background: '#222', border: 'none' },
    itemStyle: { color: '#1DB954' },
  }

  const axisStyle = { stroke: '#555', tick: { fill: '#fff', fontSize: 12 } }

  return (
    <div className="music-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dataset Overview</h1>
          <p className="dashboard-subtitle">📊 Explore the Spotify Charts dataset with top-10 breakdowns and summary stats.</p>
        </div>
      </div>


      <section className="section-description" style={{ margin: '40px 40px', maxWidth: 800 }}>
        <h2 style={{ color: '#1ED760', textAlign: 'left' }}>Dataset</h2>
        <p style={{ color: '#ccc', lineHeight: 1.5, textAlign: 'left' }}>
          This project uses the{' '}
          <a
            href="https://www.kaggle.com/datasets/pepepython/spotify-huge-database-daily-charts-over-3-years?select=Final+database.csv"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#fff' }}
          >
            Spotify Chart Dataset
          </a>{' '}
          from Kaggle. It contains daily Top-200 positions for songs across 34 countries from 2017–2020.
        </p>
      </section>

      <section className="section-description" style={{ margin: '40px 40px', maxWidth: 800 }}>
        <h2 style={{ color: '#1ED760', textAlign: 'left' }}>Popularity</h2>
        <p style={{ color: '#ccc', lineHeight: 1.5, textAlign: 'left' }}>
          Popularity is computed by summing each track's daily chart positions (weighted toward higher ranks)
          over all days and countries. Higher totals indicate consistently top-ranked tracks. 
          As different countries have different songs on differrent Chart positions, the average
          popularity score differs from country to country. This can be seen on the globe visualization
          when not filtering for an attribute.
        </p>
      </section>

      <section className="section-description" style={{ margin: '40px 40px', maxWidth: 800 }}>
        <h2 style={{ color: '#1ED760', textAlign: 'left' }}>Top 10s</h2>
        <p style={{ color: '#ccc', lineHeight: 1.5, textAlign: 'left' }}>
          The charts below show the top 10 Artists, Songs, Genres, and Simplified Genres
          ranked by total popularity score over the entire dataset.
        </p>
      </section>

      {/* 2×2 Bar chart grid */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridGap: 24,
        margin: '0 auto 40px',
        maxWidth: 1200,
        padding: '0 40px'
      }}>
        {[
          ['Top 10 Artists', topArtists],
          ['Top 10 Songs', topSongs],
          ['Top 10 Genres', topGenres],
          ['Top 10 New Genres', topGenresNew]
        ].map(([title, data]) => (
          <div key={title} style={{
            background: '#111',
            borderRadius: 8,
            padding: 16,
            height: 380
          }}>
            <h3 style={{ color: '#fff', textAlign: 'center', marginBottom: 12 }}>{title}</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ left: 20, right: 10, top: 5, bottom: 5 }}
              >
                <CartesianGrid stroke="#333" />
                <XAxis type="number" {...axisStyle} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  {...axisStyle}
                />
                <Bar
                  dataKey="value"
                  fill="#1ED760"
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </section>

      <section className="section-description" style={{ margin: '40px 40px', maxWidth: 800 }}>
        <h2 style={{ color: '#1ED760', textAlign: 'left' }}>Dataset Summary</h2>
        <p style={{ color: '#ccc', lineHeight: 1.5, textAlign: 'left' }}>
          A quick overview of record and category counts in our dataset.
        </p>
      </section>
      <section style={{ maxWidth: 400, margin: '0 auto' }}>
        <table style={{
          width: '100%',
          color: '#fff', 
          borderCollapse: 'collapse',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <tbody>
            {[
              ['Total Records', totalRecords],
              ['Distinct Genres', genres.length],
              ['Distinct Songs', songs.length],
              ['Distinct Artists', artists.length],
              ['Distinct New Genres', genresNew.length]
            ].map(([label, val]) => (
              <tr key={label}>
                <td style={{ padding: '6px 8px' }}>{label}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
