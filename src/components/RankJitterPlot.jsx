import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as d3 from 'd3'
import '../css/RankJitterPlot.css'

const RankJitterPlot = ({ selectedArtists, artistStats }) => {
  const [chartData, setChartData] = useState([])
  const [selectedArtist, setSelectedArtist] = useState(null)
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' })
  const [closestDot, setClosestDot] = useState(null)
  const [containerWidth, setContainerWidth] = useState(1200)
  const svgRef = useRef(null)
  const chartContainerRef = useRef(null)

  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', 
    '#ff00ff', '#00ffff', '#ff0000', '#0000ff', '#ffff00'
  ]

  const margin = { top: 60, right: 60, bottom: 60, left: 60 }
  const width = Math.max(containerWidth - margin.left - margin.right, 400)
  const height = 400 - margin.top - margin.bottom

  useEffect(() => {
    const handleResize = () => {
      if (chartContainerRef.current) {
        const rect = chartContainerRef.current.getBoundingClientRect()
        const newWidth = rect.width
        if (newWidth > 0) {
          setContainerWidth(newWidth)
        }
      }
    }

    let resizeObserver
    if (chartContainerRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const newWidth = entry.contentRect.width
          if (newWidth > 0) {
            setContainerWidth(newWidth)
          }
        }
      })
      resizeObserver.observe(chartContainerRef.current)
    }

    const timeout = setTimeout(() => {
      handleResize()
    }, 100)
    
    window.addEventListener('resize', handleResize)
    
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('resize', handleResize)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [])

  const artistColorMap = useMemo(() => {
    const colorMap = {}
    selectedArtists.forEach((artist, index) => {
      colorMap[artist] = colors[index % colors.length]
    })
    return colorMap
  }, [selectedArtists])

  useEffect(() => {
    if (!artistStats) return
    
    const data = []
    Object.entries(artistStats).forEach(([artistName, stats]) => {
      if (stats && stats.popuMaxList) {
        stats.popuMaxList.forEach((rank, index) => {
          data.push({
            artist: artistName,
            rank: rank,
            id: `${artistName}-${rank}-${index}`
          })
        })
      }
    })
    
    setChartData(data)
  }, [artistStats])

  useEffect(() => {
    if (!chartData.length || !svgRef.current || containerWidth <= 0) return
    
    d3.select(svgRef.current).selectAll('*').remove()
    
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
    
    const defs = svg.append('defs')
    
    const gradient = defs.append('linearGradient')
      .attr('id', 'guidelineGradient')
      .attr('x1', '0%')
      .attr('x2', '100%')
      .attr('y1', '0%')
      .attr('y2', '0%')
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#535353')
      .attr('stop-opacity', '0.3')
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#535353')
      .attr('stop-opacity', '0')
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
    
    const xScale = d3.scaleLinear()
      .domain([1, d3.max(chartData, d => d.rank)])
      .range([width, 0])
    
    const maxRank = d3.max(chartData, d => d.rank)
    const tickValues = [1, 10, 50, 100, 200, 500, 1000]
      .filter(tick => tick <= maxRank)
    
    g.append('g')
      .attr('transform', `translate(0,${height/2})`)
      .call(d3.axisBottom(xScale).tickValues(tickValues))
      .selectAll('text')
      .style('fill', '#FFFFFF')
      .style('font-family', 'Circular Std, Helvetica Neue, Arial, sans-serif')
      .style('font-size', '14px')
    
    g.selectAll('.domain, .tick line')
      .style('stroke', '#282828')
    
    g.append('text')
      .attr('class', 'axis-label')
      .attr('x', width / 2)
      .attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .text('Best rank in global singles chart')
      .style('fill', '#B3B3B3')
      .style('font-family', 'Circular Std, Helvetica Neue, Arial, sans-serif')
    
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
    
    g.selectAll('.guideline-label')
      .data(guidelines)
      .enter()
      .append('text')
      .attr('class', 'guideline-label')
      .attr('x', d => {
        const x = xScale(d)
        return x + 10
      })
      .attr('y', 20)
      .attr('text-anchor', 'start')
      .style('fill', '#B3B3B3')
      .style('font-family', 'Circular Std, Helvetica Neue, Arial, sans-serif')
      .style('font-size', '13px')
      .style('opacity', 0)
    
    g.selectAll('.guideline-gradient')
      .data(guidelines)
      .enter()
      .append('rect')
      .attr('class', 'guideline-gradient')
      .attr('x', d => xScale(d))
      .attr('y', 0)
      .attr('width', 50)
      .attr('height', height / 2)
      .attr('fill', 'url(#guidelineGradient)')
      .style('opacity', 0)
    
  }, [chartData, width, height, containerWidth])

  const getArtistStats = (artist) => {
    if (!artist || !artistStats[artist]) return { top10: 0, top50: 0, total: 0, bestRank: null }
    
    const ranks = artistStats[artist].popuMaxList || []
    const top10 = ranks.filter(r => r <= 10).length
    const top50 = ranks.filter(r => r <= 50).length
    const total = ranks.length
    const bestRank = ranks.length > 0 ? Math.min(...ranks) : null
    
    return { top10, top50, total, bestRank }
  }

  useEffect(() => {
    if (!svgRef.current) return
    
    const svg = d3.select(svgRef.current)
    const stats = getArtistStats(selectedArtist)
    
    const staticGuidelines = [10, 50, 200]
    const dynamicGuidelines = selectedArtist && stats.bestRank ? [...staticGuidelines, stats.bestRank] : staticGuidelines
    
    svg.selectAll('.guideline')
      .transition()
      .duration(200)
      .style('opacity', selectedArtist ? 0.7 : 0)
    
    svg.selectAll('.guideline-gradient')
      .transition()
      .duration(200)
      .style('opacity', selectedArtist ? 1 : 0)
    
    const bestRankLine = svg.select('.best-rank-guideline')
    
    if (selectedArtist && stats.bestRank) {
      const xScale = d3.scaleLinear()
        .domain([1, d3.max(chartData, d => d.rank)])
        .range([width, 0])
      
      if (bestRankLine.empty()) {
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
        bestRankLine
          .transition()
          .duration(200)
          .attr('x1', xScale(stats.bestRank))
          .attr('x2', xScale(stats.bestRank))
          .style('opacity', 0.8)
      }
    } else {
      bestRankLine
        .transition()
        .duration(200)
        .style('opacity', 0)
        .remove()
    }
    
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
        
        d3.select(this).selectAll('*').remove()
        
        d3.select(this).append('tspan')
          .attr('x', xScale(d) + 10)
          .attr('dy', '0')
          .style('font-weight', '700')
          .style('font-size', '16px')
          .text(topText)
        
        d3.select(this).append('tspan')
          .attr('x', xScale(d) + 10)
          .attr('dy', '1.2em')
          .style('font-weight', '400')
          .text(bottomText)
      })
      .transition()
      .duration(200)
      .style('opacity', selectedArtist ? 1 : 0)
    
    const bestRankLabel = svg.select('.best-rank-label')
    
    if (selectedArtist && stats.bestRank) {
      const xScale = d3.scaleLinear()
        .domain([1, d3.max(chartData, d => d.rank)])
        .range([width, 0])
      
      if (bestRankLabel.empty()) {
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
        const tspans = bestRankLabel.selectAll('tspan')
        
        if (tspans.size() === 0) {
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
        
        bestRankLabel.selectAll('tspan')
          .transition()
          .duration(200)
          .attr('x', xScale(stats.bestRank) - 10)
      }
    } else {
      bestRankLabel
        .transition()
        .duration(200)
        .style('opacity', 0)
        .remove()
    }
  }, [selectedArtist, artistStats, chartData, width, height])

  useEffect(() => {
    if (!svgRef.current) return
    
    const svg = d3.select(svgRef.current)
    const closestDotLabel = svg.select('.closest-dot-label')
    const closestDotLine = svg.select('.closest-dot-line')
    
    if (closestDot) {
      const xScale = d3.scaleLinear()
        .domain([1, d3.max(chartData, d => d.rank)])
        .range([width, 0])
      
      const dotPosition = getDotPosition(closestDot)
      const lineX = xScale(closestDot.rank)
      
      const pointY = dotPosition.y - margin.top
      const axisY = height / 2
      const labelY = pointY < axisY ? axisY + 25 : axisY - 15
      
      if (closestDotLabel.empty()) {
        svg.select('g').append('text')
          .attr('class', 'closest-dot-label')
          .attr('x', lineX)
          .attr('y', labelY)
          .attr('text-anchor', 'middle')
          .style('fill', '#1DB954')
          .style('font-family', 'Circular Std, Helvetica Neue, Arial, sans-serif')
          .style('font-size', '14px')
          .style('font-weight', '600')
          .style('opacity', 0)
          .text(closestDot.rank)
          .transition()
          .duration(150)
          .style('opacity', 1)
      } else {
        closestDotLabel
          .transition()
          .duration(150)
          .attr('x', lineX)
          .attr('y', labelY)
          .text(closestDot.rank)
          .style('opacity', 1)
      }
      
      if (closestDotLine.empty()) {
        svg.select('g').append('line')
          .attr('class', 'closest-dot-line')
          .attr('x1', lineX)
          .attr('x2', lineX)
          .attr('y1', dotPosition.y - margin.top)
          .attr('y2', height / 2)
          .style('stroke', '#1DB954')
          .style('stroke-width', '2')
          .style('stroke-dasharray', '4,4')
          .style('opacity', 0)
          .transition()
          .duration(150)
          .style('opacity', 0.8)
      } else {
        closestDotLine
          .transition()
          .duration(150)
          .attr('x1', lineX)
          .attr('x2', lineX)
          .attr('y1', dotPosition.y - margin.top)
          .attr('y2', height / 2)
          .style('opacity', 0.8)
      }
    } else {
      closestDotLabel
        .transition()
        .duration(150)
        .style('opacity', 0)
        .remove()
        
      closestDotLine
        .transition()
        .duration(150)
        .style('opacity', 0)
        .remove()
    }
  }, [closestDot, chartData, width, height])

  const getDotPosition = (item) => {
    const xScale = d3.scaleLinear()
      .domain([1, d3.max(chartData, d => d.rank)])
      .range([width, 0])
    
    const x = xScale(item.rank) + margin.left
    let y = height / 2 + margin.top
    
    if (selectedArtist === item.artist) {
      const hash = item.id.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0)
      
      const rawJitter = (Math.abs(hash) % 100 - 50) * 2
      const minDistance = 30
      
      let jitter = rawJitter
      if (Math.abs(jitter) < minDistance) {
        jitter = jitter >= 0 ? minDistance : -minDistance
      }
      
      y += jitter
    }
    
    return { x, y }
  }

  const handleMouseMove = (event) => {
    if (!chartContainerRef.current || !chartData.length) return

    const rect = chartContainerRef.current.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    let closestDistance = Infinity
    let closest = null

    chartData.forEach(item => {
      const isSelected = selectedArtist === item.artist
      const isOtherArtist = selectedArtist && !isSelected
      
      if (isOtherArtist) return

      const { x, y } = getDotPosition(item)
      const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2)
      
      if (distance < closestDistance) {
        closestDistance = distance
        closest = item
      }
    })

    if (closest && closestDistance < 80) {
      setClosestDot(closest)
      
      const parts = closest.id.split('-')
      const index = parseInt(parts[parts.length - 1])
      
      const trackTitle = artistStats[closest.artist]?.title?.[index] || `Track ${index}`
      
      setTooltip({
        visible: true,
        x: mouseX,
        y: mouseY - 8,
        content: `${trackTitle}`
      })
    } else {
      setClosestDot(null)
      setTooltip({ visible: false, x: 0, y: 0, content: '' })
    }
  }

  const handleMouseLeave = () => {
    setClosestDot(null)
    setTooltip({ visible: false, x: 0, y: 0, content: '' })
  }

  const handleArtistHover = (artist) => {
    setSelectedArtist(artist)
  }

  const handleDotClick = (item) => {
    const parts = item.id.split('-')
    const index = parseInt(parts[parts.length - 1])
    
    const uri = artistStats[item.artist]?.uri?.[index]
    if (uri) {
      window.open(uri, '_blank')
    }
  }

  const handleChartClick = () => {
    if (closestDot) {
      handleDotClick(closestDot)
    }
  }
  
  return (
    <div className="rank-jitter-plot">
      <div className="card-header">
        <div className="card-header-content">
          <h3 className="card-title">Artist Song Rankings Distribution</h3>
          <p className="card-description">Each dot is a track—see how many songs cracked the Top 10, Top 50 or Top 200 on the global singles chart. Click on it to listen to it on Spotify.</p>
        </div>
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
        
        <div className="chart-container" 
             ref={chartContainerRef}
             onMouseMove={handleMouseMove}
             onMouseLeave={handleMouseLeave}
             onClick={handleChartClick}
             style={{ position: 'relative', cursor: closestDot ? 'pointer' : 'default' }}>
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
                const isClosest = closestDot?.id === item.id
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
                      duration: 0.3,
                      ease: "easeOut"
                    }}
                    r={isClosest ? 5 : (isSelected ? 4 : 2.5)}
                    fill={artistColor}
                    stroke={isClosest ? '#FFFFFF' : 'none'}
                    strokeWidth={isClosest ? 2 : 0}
                    style={{
                      pointerEvents: 'none'
                    }}
                  />
                )
              })}
            </AnimatePresence>
          </svg>

          <AnimatePresence>
            {tooltip.visible && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="dot-tooltip"
                style={{
                  position: 'absolute',
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: 'translate(-50%, -100%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  color: '#FFFFFF',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'Circular Std, Helvetica Neue, Arial, sans-serif',
                  whiteSpace: 'pre-line',
                  pointerEvents: 'none',
                  zIndex: 1000,
                  border: '1px solid #535353',
                  lineHeight: '1.4',
                  maxWidth: '250px',
                  textAlign: 'center'
                }}
              >
                {tooltip.content}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default RankJitterPlot 