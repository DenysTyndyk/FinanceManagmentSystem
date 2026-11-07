import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, errorMessage } from '../api'
import AuthLayout, { Field, FormMessage, PasswordInput } from '../components/AuthLayout'
import { passwordError } from '../passwordPolicy'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(token ? '' : 'Brak tokena w linku.')
  const [done, setDone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    const problem = passwordError(password)
    if (problem) nextErrors.password = problem
    if (repeat !== password) nextErrors.repeat = 'Hasła nie są takie same.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || !token) return

    setSubmitError('')
    setSubmitting(true)
    const result = await api.resetPassword(token, password)
    setSubmitting(false)
    if (result.ok) setDone(result.data.message)
    else setSubmitError(errorMessage(result.data))
  }

  if (done) {
    return (
      <AuthLayout>
        <div className="reg-form">
          <h1 id="auth-title">Hasło zmienione</h1>
          <FormMessage kind="success">{done}</FormMessage>
          <Link to="/logowanie" className="btn-primary btn-block">
            Przejdź do logowania
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <form className="reg-form" onSubmit={handleSubmit} noValidate>
        <h1 id="auth-title">Ustaw nowe hasło</h1>
        <p className="reg-lead">Po zmianie hasła wylogujemy Cię ze wszystkich urządzeń.</p>

        <Field
          id="reset-password"
          label="Nowe hasło"
          error={errors.password}
          hint="Co najmniej 10 znaków, w tym litera i cyfra."
        >
          <PasswordInput id="reset-password" value={password} error={errors.password} onChange={setPassword} />
        </Field>

        <Field id="reset-repeat" label="Powtórz nowe hasło" error={errors.repeat}>
          <PasswordInput id="reset-repeat" value={repeat} error={errors.repeat} onChange={setRepeat} />
        </Field>

        <FormMessage>{submitError}</FormMessage>

        <button type="submit" className="btn-primary btn-block" disabled={submitting || !token}>
          {submitting ? 'Zapisywanie...' : 'Zmień hasło'}
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
