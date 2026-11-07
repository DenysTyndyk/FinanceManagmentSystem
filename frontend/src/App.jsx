import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { api, refreshSession } from './api'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import Login from './pages/Login'
import Register from './pages/Register'
import Reports from './pages/Reports'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'

function App() {
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Odtworzenie sesji z ciasteczka httpOnly po przeładowaniu strony
    refreshSession()
      .then(async (result) => {
        if (!result.ok) return
        const me = await api.me()
        if (me.ok) setUser(me.data)
      })
      .finally(() => setCheckingSession(false))
  }, [])

  async function handleLogout() {
    await api.logout()
    setUser(null)
    navigate('/logowanie')
  }

  if (checkingSession) return null

  const privatePage = (page) => (user ? page : <Navigate to="/logowanie" replace />)
  const guestPage = (page) => (user ? <Navigate to="/" replace /> : page)

  return (
    <Routes>
      <Route path="/" element={privatePage(<Dashboard firstName={user?.firstName} onLogout={handleLogout} />)} />
      <Route path="/raporty" element={privatePage(<Reports />)} />
      <Route path="/logowanie" element={guestPage(<Login onLogin={setUser} />)} />
      <Route path="/rejestracja" element={guestPage(<Register />)} />
      <Route path="/zapomniane-haslo" element={guestPage(<ForgotPassword />)} />
      <Route path="/reset-hasla" element={<ResetPassword />} />
      <Route path="/weryfikacja" element={<VerifyEmail />} />
    </Routes>
  )
}

export default App
