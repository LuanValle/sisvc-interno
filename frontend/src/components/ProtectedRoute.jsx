import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }) {
  const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true'

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

export default ProtectedRoute
