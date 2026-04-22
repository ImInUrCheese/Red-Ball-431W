import { request } from './client'

export interface UserProfile {
  email: string
  first_name?: string
  last_name?: string
  age?: number
  major?: string
  bank_routing_number?: string
  bank_account_number?: string
  position?: string
}

export function getProfile(): Promise<UserProfile> {
  return request<UserProfile>('/profile')
}

export interface PaymentInfo {
  card_type: string
  last_four: string
  expire_month: number
  expire_year: number
}

export function getPaymentInfo(): Promise<PaymentInfo> {
  return request<PaymentInfo>('/payment')
}

export interface UpdateProfilePayload {
  first_name?: string
  last_name?: string
  age?: number
  major?: string
  bank_routing_number?: string
  bank_account_number?: string
}

export function updateProfile(payload: UpdateProfilePayload): Promise<{ success: boolean; error?: string }> {
  return request('/profile', 'PATCH', payload)
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const buf  = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function changePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  const new_password_hash = await hashPassword(newPassword)
  return request('/change-password', 'POST', { new_password_hash })
}
