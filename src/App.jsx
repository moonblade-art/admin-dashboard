import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './services/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DonationRecap from './pages/DonationRecap'
import CommunityManagement from './pages/CommunityManagement'
import EmissionManagement from './pages/EmissionManagement'
import Notifications from './pages/Notifications'
import ActivityLog from './pages/ActivityLog'
import MainLayout from './layouts/MainLayout'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route 
        path="/" 
        element={user ? <MainLayout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="donations" element={<DonationRecap />} />
        <Route path="communities" element={<CommunityManagement />} />
        <Route path="emissions" element={<EmissionManagement />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="logs" element={<ActivityLog />} />
      </Route>
    </Routes>
  )
}

export default App