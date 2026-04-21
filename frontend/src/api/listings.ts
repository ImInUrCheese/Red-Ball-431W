import { request } from './client'

export interface Listing {
  seller_email: string
  listing_id: number
  category: string
  auction_title: string
  product_name: string
  product_description: string
  quantity: number
  reserve_price: number
  max_bids: number
  status: number
  image_url: string
  highest_bid?: number
  bid_count?: number
  bids_remaining?: number
}

export function getListingsByCategory(category: string): Promise<Listing[]> {
  return request<Listing[]>(`/listings/category/${encodeURIComponent(category)}`)
}

export function searchListings(keyword?: string, minPrice?: number, maxPrice?: number): Promise<Listing[]> {
  const params = new URLSearchParams()
  if (keyword)  params.set('keyword', keyword)
  if (minPrice != null) params.set('min_price', String(minPrice))
  if (maxPrice != null) params.set('max_price', String(maxPrice))
  const qs = params.toString()
  return request<Listing[]>(`/listings/search${qs ? `?${qs}` : ''}`)
}

export function getTopLevelCategories(): Promise<string[]> {
  return request<string[]>('/categories/Root')
}