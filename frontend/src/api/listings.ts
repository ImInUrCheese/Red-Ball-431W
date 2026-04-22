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

export function getSubcategories(parent: string): Promise<string[]> {
  return request<string[]>(`/categories/${encodeURIComponent(parent)}`)
}

export function getTopLevelCategories(): Promise<string[]> {
  return request<string[]>('/categories/All')
}

export function getLeafCategories(): Promise<string[]> {
  return request<string[]>('/categories/leaf')
}

export function getListingDetail(sellerEmail: string, listingId: number): Promise<Listing & { highest_bid: number | null; bid_count: number; bids_remaining: number }> {
  return request(`/listings/${encodeURIComponent(sellerEmail)}/${listingId}`)
}

export function createListing(
  sellerEmail: string,
  category: string,
  auctionTitle: string,
  productName: string,
  productDescription: string,
  quantity: number,
  reservePrice: number,
  maxBids: number,
): Promise<{ seller_email: string; listing_id: number }> {
  return request('/listings', 'POST', {
    seller_email: sellerEmail,
    category,
    auction_title: auctionTitle,
    product_name: productName,
    product_description: productDescription,
    quantity,
    reserve_price: reservePrice,
    max_bids: maxBids,
  })
}

export async function uploadListingImage(
  sellerEmail: string,
  listingId: number,
  file: File,
): Promise<{ success: boolean; error?: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`/api/listings/${encodeURIComponent(sellerEmail)}/${listingId}/image`, {
    method: 'POST',
    body: formData,
  })
  return res.json()
}