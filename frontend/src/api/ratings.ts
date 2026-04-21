import { request } from './client'

export interface RatingAverage {
  average_rating: number | null
}

export function getSellerRatingAverage(sellerEmail: string): Promise<RatingAverage> {
  return request<RatingAverage>(`/ratings/seller/${encodeURIComponent(sellerEmail)}/average`)
}