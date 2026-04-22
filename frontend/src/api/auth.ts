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
  roles?: UserRole[]
  error?: string
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const password_hash = await hashPassword(password)
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password_hash })
  })
  return res.json()
}

export async function selectRole(role: UserRole): Promise<{ success: boolean; role?: UserRole; error?: string }> {
  const res = await fetch('/api/select-role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  })
  return res.json()
}

export async function getMe(): Promise<{ success: boolean; email?: string; role?: UserRole }> {
  const res = await fetch('/api/me')
  return res.json()
}

export async function logout(): Promise<void> {
  await fetch('/api/logout', { method: 'POST' })
}

export interface RegisterPayload {
  role: UserRole
  email: string
  password: string
  // bidder
  first_name?: string
  last_name?: string
  age?: number
  major?: string
  // seller
  bank_routing_number?: string
  bank_account_number?: string
  // helpdesk
  position?: string
}

export interface RegisterResponse {
  success: boolean
  role?: UserRole
  error?: string
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const { password, ...rest } = payload
  const password_hash = await hashPassword(password)
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...rest, email: rest.email.trim().toLowerCase(), password_hash }),
  })
  return res.json()
}