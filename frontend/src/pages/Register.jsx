import { useState } from 'react'
import { IconCheck, IconEye, IconLogo } from '../components/Icons'

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
  if (values.password.length < 8) errors.password = 'Hasło musi mieć co najmniej 8 znaków.'
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

function Field({ id, label, error, hint, children }) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error ? <p className="hint">{hint}</p> : null}
      {error ? (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default function Register({ onDone, onGoDashboard }) {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeat, setShowRepeat] = useState(false)

  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onDone(values.firstName.trim())
  }

  return (
    <div className="reg-page">
      <section className="reg-panel" aria-labelledby="reg-title">
        <aside className="reg-aside">
          <div className="brand brand-on-dark">
            <span className="logo-mark">
              <IconLogo />
            </span>
            <span className="brand-name">FinManager</span>
          </div>
          <h2>Kontroluj budżet i rozliczaj wspólne wydatki.</h2>
          <p>Własny portfel, paragony w grupie i czytelny bilans — w jednym miejscu.</p>
          <ul className="reg-points">
            <li>
              <span className="point-icon">
                <IconCheck />
              </span>
              Wydatki z kategoriami i limitem
            </li>
            <li>
              <span className="point-icon">
                <IconCheck />
              </span>
              Grupy i podział procentowy
            </li>
            <li>
              <span className="point-icon">
                <IconCheck />
              </span>
              Kursy walut i rozliczenia
            </li>
          </ul>
        </aside>

        <form className="reg-form" onSubmit={handleSubmit} noValidate>
          <h1 id="reg-title">Utwórz konto</h1>
          <p className="reg-lead">Załóż konto i zacznij śledzić wydatki od dzisiejszego dnia.</p>

          <div className="name-row">
            <Field id="reg-first" label="Imię" error={errors.firstName}>
              <input
                id="reg-first"
                name="firstName"
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
                name="lastName"
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
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={values.email}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'reg-email-error' : undefined}
              onChange={(event) => update('email', event.target.value)}
            />
          </Field>

          <Field id="reg-password" label="Hasło" error={errors.password}>
            <div className="field-control">
              <input
                id="reg-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={values.password}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'reg-password-error' : undefined}
                onChange={(event) => update('password', event.target.value)}
              />
              <button
                type="button"
                className="ghost-icon"
                aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                onClick={() => setShowPassword((value) => !value)}
              >
                <IconEye off={showPassword} />
              </button>
            </div>
          </Field>

          <Field id="reg-repeat" label="Powtórz hasło" error={errors.passwordRepeat}>
            <div className="field-control">
              <input
                id="reg-repeat"
                name="passwordRepeat"
                type={showRepeat ? 'text' : 'password'}
                autoComplete="new-password"
                value={values.passwordRepeat}
                aria-invalid={Boolean(errors.passwordRepeat)}
                aria-describedby={errors.passwordRepeat ? 'reg-repeat-error' : undefined}
                onChange={(event) => update('passwordRepeat', event.target.value)}
              />
              <button
                type="button"
                className="ghost-icon"
                aria-label={showRepeat ? 'Ukryj powtórzone hasło' : 'Pokaż powtórzone hasło'}
                onClick={() => setShowRepeat((value) => !value)}
              >
                <IconEye off={showRepeat} />
              </button>
            </div>
          </Field>

          <Field
            id="reg-birth"
            label="Data urodzenia"
            error={errors.birthDate}
            hint="Pole opcjonalne. Konto jest dostępne od 16. roku życia."
          >
            <input
              id="reg-birth"
              name="birthDate"
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

          <button type="submit" className="btn-primary btn-block">
            Utwórz konto
          </button>

          <p className="reg-switch">
            Masz już konto?{' '}
            <button type="button" className="linkish" onClick={onGoDashboard}>
              Przejdź do pulpitu
            </button>
          </p>
        </form>
      </section>
    </div>
  )
}
