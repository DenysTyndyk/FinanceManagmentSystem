import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Register from './pages/Register'

function App() {
  const [view, setView] = useState('dashboard')
  const [firstName, setFirstName] = useState('Viktoria')

  if (view === 'register') {
    return (
      <Register
        onDone={(name) => {
          setFirstName(name)
          setView('dashboard')
        }}
        onGoDashboard={() => setView('dashboard')}
      />
    )
  }

  return <Dashboard firstName={firstName} onOpenRegister={() => setView('register')} />
}

export default App
