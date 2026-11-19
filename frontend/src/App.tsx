import './i18n'
import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './hooks/AuthContext'
import { MainLayout } from './layouts/MainLayout'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { DashboardPage } from './pages/DashboardPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PlantDetailPage } from './pages/PlantDetailPage'
import { PlantsPage } from './pages/PlantsPage'
import { RegisterPage } from './pages/RegisterPage'
import { SettingsPage } from './pages/SettingsPage'
import { TasksPage } from './pages/TasksPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* The landing page has its own navigation inside the hero (Vazon Plant Care design). */}
        <Route index element={<LandingPage />} />
        <Route element={<MainLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="auth/callback" element={<AuthCallbackPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="plants" element={<PlantsPage />} />
            <Route path="plants/new" element={<PlantsPage adding />} />
            <Route path="plants/:id" element={<PlantDetailPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
