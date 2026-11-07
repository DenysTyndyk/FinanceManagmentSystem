import { useState } from 'react'
import { IconCheck, IconEye, IconLogo } from './Icons'

export default function AuthLayout({ children }) {
  return (
    <div className="reg-page">
      <section className="reg-panel" aria-labelledby="auth-title">
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
            {['Wydatki z kategoriami i limitem', 'Grupy i podział procentowy', 'Kursy walut i rozliczenia'].map(
              (point) => (
                <li key={point}>
                  <span className="point-icon">
                    <IconCheck />
                  </span>
                  {point}
                </li>
              ),
            )}
          </ul>
        </aside>
        {children}
      </section>
    </div>
  )
}

export function Field({ id, label, error, hint, children }) {
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

export function PasswordInput({ id, value, onChange, error, autoComplete = 'new-password' }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="field-control">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        className="ghost-icon"
        aria-label={visible ? 'Ukryj hasło' : 'Pokaż hasło'}
        onClick={() => setVisible((current) => !current)}
      >
        <IconEye off={visible} />
      </button>
    </div>
  )
}

export function FormMessage({ kind = 'error', children }) {
  if (!children) return null
  return (
    <p className={kind === 'success' ? 'form-notice' : 'form-alert'} role={kind === 'success' ? 'status' : 'alert'}>
      {children}
    </p>
  )
}
