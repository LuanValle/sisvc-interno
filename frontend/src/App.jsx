import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import SiteFooter from './components/SiteFooter'
import AdminDashboard from './pages/AdminDashboard'
import AdminLayout from './pages/AdminLayout'
import AdminLogin from './pages/AdminLogin'
import AuditPage from './pages/AuditPage'
import AllRequests from './pages/AllRequests'
import ApprovedAgenda from './pages/ApprovedAgenda'
import ConferenceRegistration from './pages/ConferenceRegistration'
import HomePage from './pages/HomePage'
import NotFound from './pages/NotFound'
import PendingRequests from './pages/PendingRequests'
import RejectedRequests from './pages/RejectedRequests'
import SolicitationPage from './pages/SolicitationPage'

/**
 * Arquivo central de rotas do sistema.
 *
 * Ele define quais telas aparecem para cada URL:
 * - rotas publicas: inicio, solicitacao e login;
 * - rotas administrativas: ficam dentro do ProtectedRoute;
 * - rota coringa: mostra uma pagina de erro quando a URL nao existe.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/solicitar" element={<SolicitationPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="solicitacoes" element={<PendingRequests />} />
          <Route path="cadastro" element={<ConferenceRegistration />} />
          <Route path="cadastro/:id" element={<ConferenceRegistration />} />
          <Route path="agenda" element={<ApprovedAgenda />} />
          <Route path="auditoria" element={<AuditPage />} />
          <Route path="rejeitadas" element={<RejectedRequests />} />
          <Route path="todas" element={<AllRequests />} />
        </Route>

        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <SiteFooter />
    </BrowserRouter>
  )
}

export default App
