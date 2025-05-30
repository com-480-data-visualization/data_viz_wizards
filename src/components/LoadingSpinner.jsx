import { ClipLoader } from 'react-spinners'

const LoadingSpinner = ({ message = "Loading Data..." }) => {
  return (
    <div style={{ 
      position: 'absolute', 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px'
    }}>
      <ClipLoader
        color="#1ED760"
        loading={true}
        size={40}
      />
      <div style={{ 
        color: '#333', 
        fontSize: '1.1rem' 
      }}>
        {message}
      </div>
    </div>
  )
}

export default LoadingSpinner