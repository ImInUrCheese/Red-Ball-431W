import { request } from './client'

export interface RatingAverage {
  average_rating: number | null
}

export function getSellerRatingAverage(sellerEmail: string): Promise<RatingAverage> {
  return request<RatingAverage>(`/ratings/seller/${encodeURIComponent(sellerEmail)}/average`)
}

export interface CanRateResult {
  eligible: boolean
  reason?: string
}

export function checkCanRate(
  bidderEmail: string,
  sellerEmail: string,
  transactionId: number,
): Promise<CanRateResult> {
  const params = new URLSearchParams({
    bidder_email: bidderEmail,
    seller_email: sellerEmail,
    transaction_id: String(transactionId),
  })
  return request<CanRateResult>(`/ratings/check?${params}`)
}

export function submitRating(
  bidderEmail: string,
  sellerEmail: string,
  transactionId: number,
  rating: number,
  ratingDesc?: string,
): Promise<{ success: boolean; error?: string }> {
  return request('/ratings', 'POST', {
    bidder_email: bidderEmail,
    seller_email: sellerEmail,
    transaction_id: transactionId,
    rating,
    rating_desc: ratingDesc ?? null,
  })
}