// Te same zasady co w backendzie (validate_password_strength); lista popularnych haseł tylko na serwerze
export function passwordError(password, email = '') {
  if (password.length < 10) return 'Hasło musi mieć co najmniej 10 znaków.'
  if (new TextEncoder().encode(password).length > 72) return 'Hasło jest za długie (maksymalnie 72 bajty).'
  if (!/\p{L}/u.test(password) || !/\d/.test(password)) {
    return 'Hasło musi zawierać co najmniej jedną literę i jedną cyfrę.'
  }
  const localPart = email.split('@')[0].toLowerCase()
  if (localPart.length >= 3 && password.toLowerCase().includes(localPart)) {
    return 'Hasło nie może zawierać adresu e-mail.'
  }
  return null
}
