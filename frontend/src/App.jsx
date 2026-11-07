import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import Register from './pages/Register'

function App() {
  const [firstName, setFirstName] = useState('Viktoria')

  return (
    <Routes>
      <Route path="/" element={<Dashboard firstName={firstName} />} />
      <Route path="/raporty" element={<Reports firstName={firstName} />} />
      <Route path="/rejestracja" element={<Register onDone={setFirstName} />} />
    </Routes>
  )
}

export default App
