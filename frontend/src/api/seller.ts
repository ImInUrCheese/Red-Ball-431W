import { request } from './client'

export interface ActiveListing {
  seller_email: string
  listing_id: number
  auction_title: string
  category: string
  reserve_price: number
  max_bids: number
  highest_bid: number | null
  bid_count: number
  bids_remaining: number
  image_url: string
}

export interface SaleRecord {
  listing_id: number
  auction_title: string
  category: string
  final_payment: number | null
  date: string | null
  status: 'sold' | 'unsold'
}

export function getActiveListings(sellerEmail: string): Promise<ActiveListing[]> {
  return request<ActiveListing[]>(`/seller/${encodeURIComponent(sellerEmail)}/active-listings`)
}

export function getSalesHistory(sellerEmail: string): Promise<SaleRecord[]> {
  return request<SaleRecord[]>(`/seller/${encodeURIComponent(sellerEmail)}/sales-history`)
}