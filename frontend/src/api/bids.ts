import { request } from './client'

export interface ActiveBid {
  seller_email: string
  listing_id: number
  auction_title: string
  your_bid: number
  highest_bid: number
  bids_remaining: number
  leading: boolean
}

export function getMyActiveBids(bidderEmail: string): Promise<ActiveBid[]> {
  return request<ActiveBid[]>(`/bids/bidder/${encodeURIComponent(bidderEmail)}`)
}

export function placeBid(
  bidderEmail: string,
  sellerEmail: string,
  listingId: number,
  bidPrice: number
): Promise<{ success: boolean; highest_bid?: number; bids_remaining?: number; auction_complete?: boolean; error?: string }> {
  return request('/bids', 'POST', {
    bidder_email: bidderEmail,
    seller_email: sellerEmail,
    listing_id: listingId,
    bid_price: bidPrice,
  })
}