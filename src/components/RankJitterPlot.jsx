import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as d3 from 'd3'
import './RankJitterPlot.css'

const RankJitterPlot = ({ selectedArtists, artistStats }) => {
  const [chartData, setChartData] = useState([])
  const [selectedArtist, setSelectedArtist] = useState(null)
  const svgRef = useRef(null)
  
  // Color palette matching the radar chart
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', 
    '#ff00ff', '#00ffff', '#ff0000', '#0000ff', '#ffff00'
  ]
  
  // Chart dimensions
  const margin = { top: 60, right: 60, bottom: 60, left: 60 }
  const width = 800 - margin.left - margin.right
  const height = 400 - margin.top - margin.bottom
  
  // Memoize artist color mapping to prevent recalculation
  const artistColorMap = useMemo(() => {
    const colorMap = {}
    selectedArtists.forEach((artist, index) => {
      colorMap[artist] = colors[index % colors.length]
    })
    return colorMap
  }, [selectedArtists])

  // Process data when artistStats changes
  useEffect(() => {
    if (!artistStats) return
    
    // Convert artistStats to flat array of data points
    const data = []
    Object.entries(artistStats).forEach(([artistName, stats]) => {
      if (stats.popuMaxList) {
        stats.popuMaxList.forEach((rank, index) => {
          data.push({
            artist: artistName,
            rank: rank,
            id: `${artistName}-${rank}-${index}` // Use index instead of random for consistency
          })
        })
      }
    })
    
    setChartData(data)
  }, [artistStats])
  
  // Create/update D3 chart
  useEffect(() => {
    if (!chartData.length || !svgRef.current) return
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove()
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
    
    // Create scales
    const xScale = d3.scaleLinear()
      .domain([1, d3.max(chartData, d => d.rank)])
      .range([width, 0])
    
    // Add x-axis with dark theme styling
    g.append('g')
      .attr('transform', `translate(0,${height/2})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('fill', '#FFFFFF')
      .style('font-family', 'Circular Std, Helvetica Neue, Arial, sans-serif')
    
    // Style axis lines
    g.selectAll('.domain, .tick line')
      .style('stroke', '#282828')
    
    // Add axis label
    g.append('text')
      .attr('class', 'axis-label')
      .attr('x', width / 2)
      .attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .text('Chart Rank')
      .style('fill', '#B3B3B3')
      .style('font-family', 'Circular Std, Helvetica Neue, Arial, sans-serif')
    
    // Add vertical guide lines at ranks 10 and 50
    const guidelines = [10, 50, 200]
    
    g.selectAll('.guideline')
      .data(guidelines)
      .enter()
      .append('line')
      .attr('class', 'guideline')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', height / 2)
      .style('stroke', '#535353')
      .style('stroke-width', '1.5')
      .style('stroke-dasharray', '5,5')
      .style('opacity', 0)
    
    // Add labels for guidelines (initially hidden)
    g.selectAll('.guideline-label')
      .data(guidelines)
      .enter()
      .append('text')
      .attr('class', 'guideline-label')
      .attr('x', d => {
        const x = xScale(d)
        return d === 200 ? x + 10 : x - 10  // Position rank 200 label to the right, others to the left
      })
      .attr('y', 20)
      .attr('text-anchor', d => d === 200 ? 'start' : 'end')  // Left-align text for rank 200, right-align for others
      .style('fill', '#B3B3B3')
      .style('font-family', 'Circular Std, Helvetica Neue, Arial, sans-serif')
      .style('font-size', '13px')
      .style('opacity', 0)
    
  }, [chartData, width, height])

  // Calculate stats for selected artist
  const getArtistStats = (artist) => {
    if (!artist || !artistStats[artist]) return { top10: 0, top50: 0, total: 0, bestRank: null }
    
    const ranks = artistStats[artist].popuMaxList || []
    const top10 = ranks.filter(r => r <= 10).length
    const top50 = ranks.filter(r => r <= 50).length
    const total = ranks.length
    const bestRank = ranks.length > 0 ? Math.min(...ranks) : null
    
    return { top10, top50, total, bestRank }
  }
  
  // Update guidelines when artist is selected
  useEffect(() => {
    if (!svgRef.current) return
    
    const svg = d3.select(svgRef.current)
    const stats = getArtistStats(selectedArtist)
    
    // Create dynamic guidelines array
    const staticGuidelines = [10, 50, 200]
    const dynamicGuidelines = selectedArtist && stats.bestRank ? [...staticGuidelines, stats.bestRank] : staticGuidelines
    
    // Update static guidelines visibility
    svg.selectAll('.guideline')
      .transition()
      .duration(200)
      .style('opacity', selectedArtist ? 0.7 : 0)
    
    // Handle best rank guideline
    const bestRankLine = svg.select('.best-rank-guideline')
    
    if (selectedArtist && stats.bestRank) {
      const xScale = d3.scaleLinear()
        .domain([1, d3.max(chartData, d => d.rank)])
        .range([width, 0])
      
      if (bestRankLine.empty()) {
        // Create new best rank guideline
        svg.select('g').append('line')
          .attr('class', 'best-rank-guideline')
          .attr('x1', xScale(stats.bestRank))
          .attr('x2', xScale(stats.bestRank))
          .attr('y1', height / 2)
          .attr('y2', height)
          .style('stroke', '#1DB954')
          .style('stroke-width', '2')
          .style('stroke-dasharray', '3,3')
          .style('opacity', 0)
          .transition()
          .duration(200)
          .style('opacity', 0.8)
      } else {
        // Update existing best rank guideline
        bestRankLine
          .transition()
          .duration(200)
          .attr('x1', xScale(stats.bestRank))
          .attr('x2', xScale(stats.bestRank))
          .style('opacity', 0.8)
      }
    } else {
      // Remove best rank guideline
      bestRankLine
        .transition()
        .duration(200)
        .style('opacity', 0)
        .remove()
    }
    
    // Update static labels
    const xScale = d3.scaleLinear()
      .domain([1, d3.max(chartData, d => d.rank)])
      .range([width, 0])
    
    svg.selectAll('.guideline-label')
      .data([10, 50, 200])
      .each(function(d) {
        if (!selectedArtist) {
          d3.select(this).selectAll('*').remove()
          return
        }
        
        const count = d === 10 ? stats.top10 : d === 50 ? stats.top50 : stats.total
        const topText = `${count}`
        const bottomText = d === 200 ? 'tracks in top 200' : `tracks in top ${d}`
        
        // Clear existing content
        d3.select(this).selectAll('*').remove()
        
        // Add first line (count)
        d3.select(this).append('tspan')
          .attr('x', d === 200 ? xScale(d) + 10 : xScale(d) - 10)
          .attr('dy', '0')
          .style('font-weight', '700')
          .style('font-size', '16px')
          .text(topText)
        
        // Add second line (description)
        d3.select(this).append('tspan')
          .attr('x', d === 200 ? xScale(d) + 10 : xScale(d) - 10)
          .attr('dy', '1.2em')
          .style('font-weight', '400')
          .text(bottomText)
      })
      .transition()
      .duration(200)
      .style('opacity', selectedArtist ? 1 : 0)
    
    // Handle best rank label
    const bestRankLabel = svg.select('.best-rank-label')
    
    if (selectedArtist && stats.bestRank) {
      const xScale = d3.scaleLinear()
        .domain([1, d3.max(chartData, d => d.rank)])
        .range([width, 0])
      
      if (bestRankLabel.empty()) {
        // Create new best rank label
        svg.select('g').append('text')
          .attr('class', 'best-rank-label')
          .attr('x', xScale(stats.bestRank) - 10)
          .attr('y', height - 40)
          .attr('text-anchor', 'end')
          .style('fill', '#1DB954')
          .style('font-family', 'Circular Std, Helvetica Neue, Arial, sans-serif')
          .style('font-size', '13px')
          .style('font-weight', '600')
          .style('opacity', 0)
          .call(function(selection) {
            selection.append('tspan')
              .attr('x', xScale(stats.bestRank) - 10)
              .attr('dy', '0')
              .style('font-weight', '700')
              .style('font-size', '16px')
              .text(`${stats.bestRank}`)
            
            selection.append('tspan')
              .attr('x', xScale(stats.bestRank) - 10)
              .attr('dy', '1.2em')
              .style('font-weight', '400')
              .text('best track rank')
          })
          .transition()
          .duration(200)
          .style('opacity', 1)
      } else {
        // Update existing best rank label
        const tspans = bestRankLabel.selectAll('tspan')
        
        if (tspans.size() === 0) {
          // If no tspans exist, create them
          bestRankLabel.append('tspan')
            .attr('x', xScale(stats.bestRank) - 10)
            .attr('dy', '0')
            .style('font-weight', '700')
            .style('font-size', '16px')
            .text(`${stats.bestRank}`)
          
          bestRankLabel.append('tspan')
            .attr('x', xScale(stats.bestRank) - 10)
            .attr('dy', '1.2em')
            .style('font-weight', '400')
            .text('best track rank')
        } else {
          // Update existing tspans
          tspans.nodes()[0] && d3.select(tspans.nodes()[0])
            .text(`${stats.bestRank}`)
          
          tspans.nodes()[1] && d3.select(tspans.nodes()[1])
            .text('best track rank')
        }
        
        bestRankLabel
          .transition()
          .duration(200)
          .attr('x', xScale(stats.bestRank) - 10)
          .style('opacity', 1)
        
        // Transition the tspan positions
        bestRankLabel.selectAll('tspan')
          .transition()
          .duration(200)
          .attr('x', xScale(stats.bestRank) - 10)
      }
    } else {
      // Remove best rank label
      bestRankLabel
        .transition()
        .duration(200)
        .style('opacity', 0)
        .remove()
    }
  }, [selectedArtist, artistStats, chartData, width, height])
  
  // Calculate dot positions with consistent jitter
  const getDotPosition = (item) => {
    const xScale = d3.scaleLinear()
      .domain([1, d3.max(chartData, d => d.rank)])
      .range([width, 0])
    
    const x = xScale(item.rank) + margin.left
    let y = height / 2 + margin.top
    
    // If this artist is selected, add consistent vertical offset based on item ID
    if (selectedArtist === item.artist) {
      // Use a deterministic pseudo-random based on item ID for consistent positioning
      const hash = item.id.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0)
      const jitter = (Math.abs(hash) % 100 - 50) * 1.5 // Consistent offset between -75 and 75
      y += jitter
    }
    
    return { x, y }
  }

  // Handle hover events for artist selection
  const handleArtistHover = (artist) => {
    setSelectedArtist(artist)
  }

  // Handle scatter plot hover
  const handleScatterHover = (artist) => {
    setSelectedArtist(artist)
  }
  
  return (
    <div className="rank-jitter-plot">
      <div className="card-header">
        <h3 className="card-title">Artist Song Rankings Distribution</h3>
        <div className="card-icon">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
      </div>
      
      <div className="card-body">
        <div className="artist-buttons">
          <button
            onMouseEnter={() => handleArtistHover(null)}
            className={`artist-button all-artists ${!selectedArtist ? 'active' : ''}`}
          >
            All Artists
          </button>
          {selectedArtists.map(artist => (
            <button
              key={artist}
              onMouseEnter={() => handleArtistHover(artist)}
              className={`artist-button ${selectedArtist === artist ? 'active' : ''}`}
              style={{
                '--artist-color': artistColorMap[artist]
              }}
            >
              {artist}
            </button>
          ))}
        </div>
        
        <div className="chart-container">
          <svg ref={svgRef}></svg>
          
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: width + margin.left + margin.right,
              height: height + margin.top + margin.bottom,
              pointerEvents: 'none'
            }}
          >
            <AnimatePresence>
              {chartData.map(item => {
                const { x, y } = getDotPosition(item)
                const isSelected = selectedArtist === item.artist
                const isOtherArtist = selectedArtist && !isSelected
                const artistColor = artistColorMap[item.artist] || '#B3B3B3'
                
                return (
                  <motion.circle
                    key={item.id}
                    initial={{ cx: x, cy: height / 2 + margin.top, opacity: 1 }}
                    animate={{
                      cx: x,
                      cy: y,
                      opacity: isOtherArtist ? 0.15 : 1,
                    }}
                    transition={{
                      duration: 0.3, // Simplified transition
                      ease: "easeOut"
                    }}
                    r={isSelected ? 4 : 2.5}
                    fill={artistColor}
                    stroke="none"
                    strokeWidth={0}
                    style={{
                      cursor: 'pointer',
                      pointerEvents: 'all'
                    }}
                    whileHover={{ 
                      scale: 1.3,
                      transition: { duration: 0.1 } // Quick hover animation
                    }}
                    onMouseEnter={() => handleScatterHover(item.artist)}
                  />
                )
              })}
            </AnimatePresence>
          </svg>
        </div>
      </div>
      
      <div className="card-footer">
        Hover over artist buttons or data points to explore distributions
      </div>
    </div>
  )
}

export default RankJitterPlot 