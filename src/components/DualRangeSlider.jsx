import { useState, useRef, useEffect } from 'react'
import '../css/DualRangeSlider.css'

const DualRangeSlider = ({ 
  min, 
  max, 
  step = 1, 
  minValue, 
  maxValue, 
  onChange, 
  formatValue = (value) => value,
  label,
  infoText
}) => {
  const [isDragging, setIsDragging] = useState(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const sliderRef = useRef(null)

  const handleMouseDown = (thumb) => (e) => {
    e.preventDefault()
    setIsDragging(thumb)
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const value = min + percentage * (max - min)
    
    // Round to step
    const steppedValue = Math.round(value / step) * step

    if (isDragging === 'min') {
      const newMin = Math.min(steppedValue, maxValue - step)
      onChange(Math.max(min, newMin), maxValue)
    } else {
      const newMax = Math.max(steppedValue, minValue + step)
      onChange(minValue, Math.min(max, newMax))
    }
  }

  const handleMouseUp = () => {
    setIsDragging(null)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, minValue, maxValue])

  // Ensure percentages are properly constrained
  const minPercent = Math.max(0, Math.min(100, ((minValue - min) / (max - min)) * 100))
  const maxPercent = Math.max(0, Math.min(100, ((maxValue - min) / (max - min)) * 100))

  return (
    <div className="dual-range-slider">
      <div className="dual-range-header">
        <div className="range-label-container">
          <span className="range-label">{label}</span>
          {infoText && (
            <div className="info-button-container">
              <button 
                className="info-button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={(e) => e.preventDefault()}
              >
                ℹ️
              </button>
              {showTooltip && (
                <div className="info-tooltip">
                  {infoText}
                </div>
              )}
            </div>
          )}
        </div>
        <span className="range-values">
          {formatValue(minValue)} - {formatValue(maxValue)}
        </span>
      </div>
      <div className="dual-range-container" ref={sliderRef}>
        <div className="dual-range-track">
          <div 
            className="dual-range-track-active"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`
            }}
          />
        </div>
        <div 
          className="dual-range-thumb dual-range-thumb-min"
          style={{ left: `${minPercent}%` }}
          onMouseDown={handleMouseDown('min')}
        />
        <div 
          className="dual-range-thumb dual-range-thumb-max"
          style={{ left: `${maxPercent}%` }}
          onMouseDown={handleMouseDown('max')}
        />
      </div>
    </div>
  )
}

export default DualRangeSlider 