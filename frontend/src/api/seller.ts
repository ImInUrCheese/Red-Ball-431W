import { request } from './client'

export interface ActiveListing {
  seller_email: string
  listing_id: number
  auction_title: string
  category: string
  product_name: string
  product_description: string
  quantity: number
  reserve_price: number
  max_bids: number
  highest_bid: number | null
  bid_count: number
  bids_remaining: number
  image_url: string
}

export interface InactiveListing {
  seller_email: string
  listing_id: number
  auction_title: string
  category: string
  product_name: string
  reserve_price: number
  max_bids: number
  status: number
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

export function getSellerAllListings(sellerEmail: string): Promise<{ active: InactiveListing[]; inactive: InactiveListing[]; sold: InactiveListing[] }> {
  return request(`/listings/seller/${encodeURIComponent(sellerEmail)}`)
}

export interface UpdateListingPayload {
  auction_title?: string
  product_name?: string
  product_description?: string
  category?: string
  quantity?: number
  reserve_price?: number
  max_bids?: number
}

export function updateListing(
  sellerEmail: string,
  listingId: number,
  payload: UpdateListingPayload,
): Promise<{ success: boolean; error?: string }> {
  return request(`/listings/${encodeURIComponent(sellerEmail)}/${listingId}`, 'PATCH', payload)
}

export function deactivateListing(
  sellerEmail: string,
  listingId: number,
  removalReason: string,
): Promise<{ success: boolean; error?: string }> {
  return request(`/listings/${encodeURIComponent(sellerEmail)}/${listingId}/deactivate`, 'POST', {
    removal_reason: removalReason,
  })
}