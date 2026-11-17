import { Route, Routes } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { LandingPage } from './pages/LandingPage'
import { NotFoundPage } from './pages/NotFoundPage'
import {
  DashboardPage,
  LoginPage,
  NewPlantPage,
  PlantsPage,
  RegisterPage,
  TasksPage,
} from './pages/placeholders'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<LandingPage />} />
        {/* Placeholder routes: visibly labelled "Coming soon" until implemented */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="plants" element={<PlantsPage />} />
        <Route path="plants/new" element={<NewPlantPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
