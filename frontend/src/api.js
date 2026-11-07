const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

// Token dostępowy trzymamy tylko w pamięci (nie w localStorage) — odporniejsze na XSS.
// Sesję po odświeżeniu strony odtwarza ciasteczko httpOnly z tokenem odświeżającym.
let accessToken = null
let refreshPromise = null

export function errorMessage(data, fallback = 'Coś poszło nie tak. Spróbuj ponownie.') {
  const detail = data?.detail
  if (typeof detail === 'string') return detail
  if (detail?.message) return detail.message
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg.replace(/^Value error, /, '')
  return fallback
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await response.json().catch(() => ({}))
    return { ok: response.ok, status: response.status, data }
  } catch {
    return { ok: false, status: 0, data: { detail: 'Brak połączenia z serwerem.' } }
  }
}

export function refreshSession() {
  // Jedno wspólne żądanie, gdy kilka miejsc odświeża sesję naraz (np. StrictMode)
  if (!refreshPromise) {
    refreshPromise = request('/auth/refresh', { method: 'POST' })
      .then((result) => {
        accessToken = result.ok ? result.data.access_token : null
        return result
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

async function authed(path, options = {}) {
  let result = await request(path, { ...options, auth: true })
  if (result.status === 401 && (await refreshSession()).ok) {
    result = await request(path, { ...options, auth: true })
  }
  return result
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body }),
  async login(email, password) {
    const result = await request('/auth/login', { method: 'POST', body: { email, password } })
    if (result.ok) accessToken = result.data.access_token
    return result
  },
  async logout() {
    await request('/auth/logout', { method: 'POST' })
    accessToken = null
  },
  me: () => authed('/auth/me'),
  verifyEmail: (token) => request('/auth/verify-email', { method: 'POST', body: { token } }),
  resendVerification: (email) => request('/auth/resend-verification', { method: 'POST', body: { email } }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, password) =>
    request('/auth/reset-password', { method: 'POST', body: { token, password } }),
}
