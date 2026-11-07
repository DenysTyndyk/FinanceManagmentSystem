import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage } from '../api'
import AuthLayout, { Field, FormMessage, PasswordInput } from '../components/AuthLayout'
import { passwordError } from '../passwordPolicy'

const EMPTY = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  passwordRepeat: '',
  birthDate: '',
  consentPersonal: false,
  consentMarketing: false,
}

function yearsOld(isoDate) {
  const born = new Date(`${isoDate}T00:00:00`)
  const today = new Date()
  let age = today.getFullYear() - born.getFullYear()
  const month = today.getMonth() - born.getMonth()
  if (month < 0 || (month === 0 && today.getDate() < born.getDate())) age -= 1
  return age
}

function validate(values) {
  const errors = {}
  if (!values.firstName.trim()) errors.firstName = 'To pole jest wymagane.'
  if (!values.lastName.trim()) errors.lastName = 'To pole jest wymagane.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Podaj poprawny adres e-mail.'
  }
  const passwordProblem = passwordError(values.password, values.email.trim())
  if (passwordProblem) errors.password = passwordProblem
  if (values.passwordRepeat !== values.password) {
    errors.passwordRepeat = 'Hasła nie są takie same.'
  }
  if (values.birthDate && yearsOld(values.birthDate) < 16) {
    errors.birthDate = 'Konto mogą założyć osoby, które ukończyły 16 lat.'
  }
  if (!values.consentPersonal) {
    errors.consentPersonal = 'Zgoda jest potrzebna, aby utworzyć konto.'
  }
  return errors
}

export default function Register() {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [resendMessage, setResendMessage] = useState('')

  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitError('')
    setSubmitting(true)
    const email = values.email.trim()
    const result = await api.register({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email,
      password: values.password,
      birthDate: values.birthDate || null,
      consentPersonal: values.consentPersonal,
      consentMarketing: values.consentMarketing,
    })
    setSubmitting(false)
    if (!result.ok) {
      setSubmitError(errorMessage(result.data, 'Nie udało się utworzyć konta.'))
      return
    }
    setRegisteredEmail(email)
  }

  async function resend() {
    const result = await api.resendVerification(registeredEmail)
    setResendMessage(result.ok ? result.data.message : errorMessage(result.data))
  }

  if (registeredEmail) {
    return (
      <AuthLayout>
        <div className="reg-form">
          <h1 id="auth-title">Sprawdź skrzynkę</h1>
          <p className="reg-lead">
            Wysłaliśmy link aktywacyjny na adres <strong>{registeredEmail}</strong>. Kliknij go, aby
            potwierdzić konto, a potem się zaloguj.
          </p>
          <FormMessage kind="success">{resendMessage}</FormMessage>
          <Link to="/logowanie" className="btn-primary btn-block">
            Przejdź do logowania
          </Link>
          <p className="reg-switch">
            Nie dostałeś wiadomości?{' '}
            <button type="button" className="linkish" onClick={resend}>
              Wyślij ponownie
            </button>
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <form className="reg-form" onSubmit={handleSubmit} noValidate>
        <h1 id="auth-title">Utwórz konto</h1>
        <p className="reg-lead">Załóż konto i zacznij śledzić wydatki od dzisiejszego dnia.</p>

        <div className="name-row">
          <Field id="reg-first" label="Imię" error={errors.firstName}>
            <input
              id="reg-first"
              autoComplete="given-name"
              value={values.firstName}
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={errors.firstName ? 'reg-first-error' : undefined}
              onChange={(event) => update('firstName', event.target.value)}
            />
          </Field>
          <Field id="reg-last" label="Nazwisko" error={errors.lastName}>
            <input
              id="reg-last"
              autoComplete="family-name"
              value={values.lastName}
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={errors.lastName ? 'reg-last-error' : undefined}
              onChange={(event) => update('lastName', event.target.value)}
            />
          </Field>
        </div>

        <Field id="reg-email" label="Adres e-mail" error={errors.email}>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={values.email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'reg-email-error' : undefined}
            onChange={(event) => update('email', event.target.value)}
          />
        </Field>

        <Field
          id="reg-password"
          label="Hasło"
          error={errors.password}
          hint="Co najmniej 10 znaków, w tym litera i cyfra."
        >
          <PasswordInput
            id="reg-password"
            value={values.password}
            error={errors.password}
            onChange={(value) => update('password', value)}
          />
        </Field>

        <Field id="reg-repeat" label="Powtórz hasło" error={errors.passwordRepeat}>
          <PasswordInput
            id="reg-repeat"
            value={values.passwordRepeat}
            error={errors.passwordRepeat}
            onChange={(value) => update('passwordRepeat', value)}
          />
        </Field>

        <Field
          id="reg-birth"
          label="Data urodzenia"
          error={errors.birthDate}
          hint="Pole opcjonalne. Konto jest dostępne od 16. roku życia."
        >
          <input
            id="reg-birth"
            type="date"
            autoComplete="bday"
            value={values.birthDate}
            aria-invalid={Boolean(errors.birthDate)}
            aria-describedby={errors.birthDate ? 'reg-birth-error' : undefined}
            onChange={(event) => update('birthDate', event.target.value)}
          />
        </Field>

        <div className="checks">
          <label className="check">
            <input
              type="checkbox"
              checked={values.consentPersonal}
              onChange={(event) => update('consentPersonal', event.target.checked)}
            />
            <span>Wyrażam zgodę na przetwarzanie danych osobowych.</span>
          </label>
          {errors.consentPersonal ? <p className="field-error">{errors.consentPersonal}</p> : null}

          <label className="check">
            <input
              type="checkbox"
              checked={values.consentMarketing}
              onChange={(event) => update('consentMarketing', event.target.checked)}
            />
            <span>Chcę otrzymywać informacje o nowościach i promocjach.</span>
          </label>
        </div>

        <FormMessage>{submitError}</FormMessage>

        <button type="submit" className="btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Tworzenie konta...' : 'Utwórz konto'}
        </button>

        <p className="reg-switch">
          Masz już konto? <Link to="/logowanie" className="linkish">Zaloguj się</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
