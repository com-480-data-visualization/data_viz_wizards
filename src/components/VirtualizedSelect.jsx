import Select, { components } from 'react-select'
import { FixedSizeList as List } from 'react-window'
import './VirtualizedSelect.css'

// Custom virtualized menu component
const MenuList = (props) => {
  const { options, children, maxHeight, getValue } = props
  const [value] = getValue()
  const initialOffset = options.indexOf(value) * 35

  return (
    <List
      height={Math.min(maxHeight, 200)}
      itemCount={children.length}
      itemSize={35}
      initialScrollOffset={initialOffset}
    >
      {({ index, style }) => <div style={style}>{children[index]}</div>}
    </List>
  )
}

const VirtualizedSelect = ({
  options = [],
  value,
  onChange,
  placeholder = "Search...",
  isMulti = false,
  isSearchable = true,
  isDisabled = false,
  closeMenuOnSelect = true,
  hideSelectedOptions = false,
  maxSelections = null,
  noOptionsMessage,
  formatOptionLabel,
  filterOption,
  className = "",
  ...props
}) => {
  // Convert simple array to options format if needed
  const formattedOptions = Array.isArray(options) && options.length > 0
    ? (typeof options[0] === 'string' 
        ? options.map(option => ({ value: option, label: option }))
        : options)
    : []

  // Convert value to proper format if needed
  const formattedValue = isMulti
    ? (Array.isArray(value) 
        ? value.map(v => typeof v === 'string' ? { value: v, label: v } : v)
        : [])
    : (typeof value === 'string' ? { value, label: value } : value)

  const handleChange = (selectedOptions) => {
    if (isMulti) {
      const values = selectedOptions ? selectedOptions.map(option => option.value) : []
      onChange(values)
    } else {
      const singleValue = selectedOptions ? selectedOptions.value : null
      onChange(singleValue)
    }
  }

  const defaultStyles = {
    menuPortal: (base) => ({ 
      ...base, 
      zIndex: 9999 
    }),
    control: (base, state) => ({
      ...base,
      minHeight: '48px',
      fontSize: '16px',
      borderRadius: '8px',
      border: `2px solid ${state.isFocused ? '#1DB954' : '#404040'}`,
      background: '#121212',
      color: '#FFFFFF',
      boxShadow: state.isFocused 
        ? '0 0 0 2px rgba(29, 185, 84, 0.2)' 
        : '0 4px 8px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.3s ease',
      '&:hover': {
        border: '2px solid #1DB954',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }
    }),
    input: (base) => ({
      ...base,
      color: '#FFFFFF'
    }),
    placeholder: (base) => ({
      ...base,
      color: '#B3B3B3'
    }),
    singleValue: (base) => ({
      ...base,
      color: '#FFFFFF',
      fontWeight: '500'
    }),
    menu: (base) => ({
      ...base,
      background: '#181818',
      border: '1px solid #282828',
      borderRadius: '8px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
      overflow: 'hidden'
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? '#1DB954' 
        : state.isFocused 
          ? '#282828' 
          : 'transparent',
      color: state.isSelected ? '#FFFFFF' : '#FFFFFF',
      fontSize: '14px',
      padding: '12px 16px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: state.isSelected ? '#1DB954' : '#333333'
      }
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#1DB954',
      borderRadius: '6px',
      color: 'white',
      border: '1px solid rgba(29, 185, 84, 0.3)'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: 'white',
      fontWeight: '500',
      fontSize: '14px'
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: 'white',
      borderRadius: '0 6px 6px 0',
      '&:hover': {
        backgroundColor: '#16A64A',
        color: 'white'
      }
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: '#B3B3B3',
      '&:hover': {
        color: '#1DB954'
      }
    }),
    clearIndicator: (base) => ({
      ...base,
      color: '#B3B3B3',
      '&:hover': {
        color: '#ff6b6b'
      }
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: '#404040'
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color: '#B3B3B3',
      fontSize: '14px',
      fontStyle: 'italic'
    }),
    loadingMessage: (base) => ({
      ...base,
      color: '#B3B3B3',
      fontSize: '14px'
    })
  }

  const defaultNoOptionsMessage = ({ inputValue }) =>
    inputValue ? `No options found matching "${inputValue}"` : 'No options available'

  const defaultFilterOption = (option, inputValue) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())

  const isOptionDisabled = (option) => {
    if (maxSelections && isMulti && Array.isArray(formattedValue)) {
      return formattedValue.length >= maxSelections && 
             !formattedValue.some(v => v.value === option.value)
    }
    return false
  }

  return (
    <div className={`virtualized-select-container ${className}`}>
      <Select
        components={{ MenuList }}
        options={formattedOptions}
        value={formattedValue}
        onChange={handleChange}
        placeholder={placeholder}
        isMulti={isMulti}
        isSearchable={isSearchable}
        isDisabled={isDisabled}
        closeMenuOnSelect={closeMenuOnSelect}
        hideSelectedOptions={hideSelectedOptions}
        menuPortalTarget={document.body}
        styles={defaultStyles}
        formatOptionLabel={formatOptionLabel}
        filterOption={filterOption || defaultFilterOption}
        isOptionDisabled={isOptionDisabled}
        noOptionsMessage={noOptionsMessage || defaultNoOptionsMessage}
        {...props}
      />
    </div>
  )
}

export default VirtualizedSelect 