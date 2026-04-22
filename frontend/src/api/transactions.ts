import { request } from './client'

export interface TransactionRecord {
  transaction_id: number
  seller_email: string
  listing_id: number
  buyer_email: string
  date: string
  payment: number
}

export function getListingTransaction(
  sellerEmail: string,
  listingId: number,
): Promise<TransactionRecord> {
  return request<TransactionRecord>(`/transactions/listing/${encodeURIComponent(sellerEmail)}/${listingId}`)
}

export function confirmPayment(
  sellerEmail: string,
  listingId: number,
  payment: number,
): Promise<{ success: boolean; transaction_id?: number; error?: string }> {
  return request('/transactions', 'POST', {
    seller_email: sellerEmail,
    listing_id: listingId,
    payment,
  })
}
