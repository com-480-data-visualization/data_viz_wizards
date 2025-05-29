import { useState, useEffect, useRef } from 'react'
import '../css/SearchableSelect.css'

const SearchableSelect = ({
  options,
  selectedValues,
  onChange,
  placeholder = 'Search...',
  label = 'Select items',
  multiple = true,
  maxSelections = null
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [removingTag, setRemovingTag] = useState(null)
  const dropdownRef = useRef(null)

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (option) => {
    if (multiple) {
      onChange(prev => {
        // If option is already selected, remove it
        if (prev.includes(option)) {
          return prev.filter(item => item !== option)
        } 
        // If maxSelections is set and we've reached the limit, don't add
        else if (maxSelections && prev.length >= maxSelections) {
          return prev
        } 
        // Otherwise add the new option
        else {
          return [...prev, option]
        }
      })
    } else {
      onChange([option])
      setIsOpen(false)
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setRemovingTag(tagToRemove)
    
    // Wait for animation to complete before actually removing
    setTimeout(() => {
      onChange(prev => prev.filter(item => item !== tagToRemove))
      setRemovingTag(null)
    }, 300) // Match the animation duration
  }

  return (
    <div className="searchable-select" ref={dropdownRef}>
      <div className="select-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="selected-items">
          {selectedValues.length > 0 ? (
            <div className="selected-tags">
              {selectedValues.map(value => (
                <span 
                  key={value} 
                  className={`selected-tag ${removingTag === value ? 'removing' : ''}`}
                >
                  {value}
                  {multiple && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveTag(value)
                      }}
                      className="remove-tag"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <span className="placeholder">{placeholder}</span>
          )}
        </div>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </div>

      {isOpen && (
        <div className="dropdown-content">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            onClick={(e) => e.stopPropagation()}
            className="search-input"
            autoFocus
          />
          <div className="options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <div
                  key={option}
                  className={`option ${selectedValues.includes(option) ? 'selected' : ''} ${
                    maxSelections && selectedValues.length >= maxSelections && !selectedValues.includes(option) ? 'disabled' : ''
                  }`}
                  onClick={() => handleSelect(option)}
                >
                  {option}
                  {maxSelections && selectedValues.length >= maxSelections && !selectedValues.includes(option) && (
                    <span className="max-selections-note"> (Max limit reached)</span>
                  )}
                </div>
              ))
            ) : (
              <div className="no-results">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchableSelect 