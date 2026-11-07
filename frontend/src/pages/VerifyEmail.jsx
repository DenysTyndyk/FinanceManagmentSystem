import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, errorMessage } from '../api'
import AuthLayout, { FormMessage } from '../components/AuthLayout'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [state, setState] = useState({ status: token ? 'loading' : 'error', message: 'Brak tokena w linku.' })
  const started = useRef(false)

  useEffect(() => {
    // Token jest jednorazowy — w StrictMode efekt uruchamia się dwa razy, więc pilnujemy jednego żądania
    if (!token || started.current) return
    started.current = true
    api.verifyEmail(token).then((result) => {
      setState({
        status: result.ok ? 'success' : 'error',
        message: result.ok ? result.data.message : errorMessage(result.data),
      })
    })
  }, [token])

  return (
    <AuthLayout>
      <div className="reg-form">
        <h1 id="auth-title">Potwierdzenie e-mail</h1>
        {state.status === 'loading' ? <p className="reg-lead">Sprawdzamy link...</p> : null}
        {state.status === 'success' ? <FormMessage kind="success">{state.message}</FormMessage> : null}
        {state.status === 'error' ? <FormMessage>{state.message}</FormMessage> : null}
        <Link to="/logowanie" className="btn-primary btn-block">
          Przejdź do logowania
        </Link>
      </div>
    </AuthLayout>
  )
}
