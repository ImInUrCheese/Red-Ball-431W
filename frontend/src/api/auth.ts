async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export type UserRole = 'bidder' | 'seller' | 'helpdesk'

export interface LoginResponse {
  success: boolean
  role?: UserRole
  error?: string
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const password_hash = await hashPassword(password)
  console.log(password_hash)
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password_hash })
  })
  return res.json()
}