import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, errorMessage } from '../api'
import AuthLayout, { Field, FormMessage, PasswordInput } from '../components/AuthLayout'

export default function Login({ onLogin }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setNeedsVerification(false)
    if (!email.trim() || !password) {
      setError('Podaj e-mail i hasło.')
      return
    }

    setSubmitting(true)
    const result = await api.login(email.trim(), password)
    if (!result.ok) {
      setSubmitting(false)
      setNeedsVerification(result.data?.detail?.code === 'email_not_verified')
      setError(errorMessage(result.data, 'Nie udało się zalogować.'))
      return
    }
    const me = await api.me()
    setSubmitting(false)
    if (!me.ok) {
      setError(errorMessage(me.data, 'Nie udało się pobrać profilu.'))
      return
    }
    onLogin(me.data)
    navigate('/')
  }

  async function resend() {
    const result = await api.resendVerification(email.trim())
    setNotice(result.ok ? result.data.message : errorMessage(result.data))
  }

  return (
    <AuthLayout>
      <form className="reg-form" onSubmit={handleSubmit} noValidate>
        <h1 id="auth-title">Zaloguj się</h1>
        <p className="reg-lead">Witaj ponownie! Zaloguj się, aby zobaczyć swoje wydatki.</p>

        <Field id="login-email" label="Adres e-mail">
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <Field id="login-password" label="Hasło">
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
          />
        </Field>

        <p className="form-aside-link">
          <Link to="/zapomniane-haslo" className="linkish">
            Nie pamiętasz hasła?
          </Link>
        </p>

        <FormMessage>{error}</FormMessage>
        {needsVerification ? (
          <p className="reg-switch">
            <button type="button" className="linkish" onClick={resend}>
              Wyślij ponownie link aktywacyjny
            </button>
          </p>
        ) : null}
        <FormMessage kind="success">{notice}</FormMessage>

        <button type="submit" className="btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Logowanie...' : 'Zaloguj się'}
        </button>

        <p className="reg-switch">
          Nie masz konta? <Link to="/rejestracja" className="linkish">Zarejestruj się</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
