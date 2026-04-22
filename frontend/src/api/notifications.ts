import { request } from './client'

export interface ApiNotification {
  notification_id: number
  notification_type: 'auction_won' | 'payment_due' | 'auction_lost' | 'auction_ended_no_sale'
  message: string
  seller_email: string | null
  listing_id: number | null
  is_read: number
  created_at: string
}

export function getNotifications(userEmail: string): Promise<ApiNotification[]> {
  return request<ApiNotification[]>(`/notifications/${encodeURIComponent(userEmail)}`)
}

export function markNotificationRead(notificationId: number): Promise<{ success: boolean }> {
  return request(`/notifications/${notificationId}/read`, 'PATCH')
}

export function markAllNotificationsRead(userEmail: string): Promise<{ success: boolean }> {
  return request(`/notifications/${encodeURIComponent(userEmail)}/read-all`, 'PATCH')
}