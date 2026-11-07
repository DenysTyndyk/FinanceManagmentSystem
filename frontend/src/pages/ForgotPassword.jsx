import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage } from '../api'
import AuthLayout, { Field, FormMessage } from '../components/AuthLayout'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Podaj poprawny adres e-mail.')
      return
    }
    setSubmitting(true)
    const result = await api.forgotPassword(email.trim())
    setSubmitting(false)
    if (result.ok) setNotice(result.data.message)
    else setError(errorMessage(result.data))
  }

  return (
    <AuthLayout>
      <form className="reg-form" onSubmit={handleSubmit} noValidate>
        <h1 id="auth-title">Nie pamiętasz hasła?</h1>
        <p className="reg-lead">Podaj e-mail konta — wyślemy link do ustawienia nowego hasła.</p>

        <Field id="forgot-email" label="Adres e-mail">
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <FormMessage>{error}</FormMessage>
        <FormMessage kind="success">{notice}</FormMessage>

        <button type="submit" className="btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Wysyłanie...' : 'Wyślij link'}
        </button>

        <p className="reg-switch">
          <Link to="/logowanie" className="linkish">
            Wróć do logowania
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
