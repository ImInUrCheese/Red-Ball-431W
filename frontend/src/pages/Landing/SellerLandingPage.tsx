import { useState, useEffect } from 'react'
import Header from './LandingPageHeader'
import type { Notification } from './LandingPageHeader'
import type { UserRole } from '../../api/auth'
import { getActiveListings, getSalesHistory } from '../../api/seller'
import type { ActiveListing, SaleRecord } from '../../api/seller'
import { getSellerRatingAverage } from '../../api/ratings'
import { getNotifications, markNotificationRead } from '../../api/notifications'
import type { ApiNotification } from '../../api/notifications'
import './SellerLandingPage.css'

interface SellerPageProps {
  userName: string
  role: UserRole
  onNavigate: (page: 'home' | 'account' | 'helpdesk') => void
  onLogout: () => void
}

function apiNotifToHeader(n: ApiNotification): Notification {
  return {
    id: String(n.notification_id),
    message: n.message,
    won: n.notification_type === 'auction_won',
    seen: n.is_read === 1,
  }
}

const STATUS_LABEL: Record<SaleRecord['status'], string> = {
  sold:   'Sold',
  unsold: 'Not Sold',
}

export default function SellerPage({ userName, role, onNavigate, onLogout }: SellerPageProps) {
  const [notifications, setNotifications]   = useState<Notification[]>([])
  const [activeListings, setActiveListings] = useState<ActiveListing[]>([])
  const [salesHistory, setSalesHistory]     = useState<SaleRecord[]>([])
  const [averageRating, setAverageRating]   = useState<number | null>(null)
  const [ratingCount, setRatingCount]       = useState<number>(0)

  // ── Fetch notifications ─────────────────────────────────────
  useEffect(() => {
    getNotifications(userName)
      .then(data => setNotifications(data.map(apiNotifToHeader)))
      .catch(err => console.error('Failed to load notifications:', err))
  }, [userName])

  // ── Fetch active listings ───────────────────────────────────
  useEffect(() => {
    getActiveListings(userName)
      .then(setActiveListings)
      .catch(err => console.error('Failed to load active listings:', err))
  }, [userName])

  // ── Fetch sales history ─────────────────────────────────────
  useEffect(() => {
    getSalesHistory(userName)
      .then(setSalesHistory)
      .catch(err => console.error('Failed to load sales history:', err))
  }, [userName])

  // ── Fetch rating ────────────────────────────────────────────
  useEffect(() => {
    getSellerRatingAverage(userName)
      .then(data => setAverageRating(data.average_rating))
      .catch(err => console.error('Failed to load rating:', err))
  }, [userName])

  // ── Dismiss notification ────────────────────────────────────
  async function dismissNotification(id: string) {
    try {
      await markNotificationRead(Number(id))
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, seen: true } : n))
    } catch (err) {
      console.error('Failed to mark notification read:', err)
    }
  }

  const initials = userName.split('@')[0].slice(0, 2).toUpperCase()

  function renderStars(avg: number | null) {
    if (avg === null) return <span className="stars">No ratings yet</span>
    const full  = Math.floor(avg)
    const half  = avg - full >= 0.5 ? 1 : 0
    const empty = 5 - full - half
    return (
      <span className="stars">
        {'★'.repeat(full)}{'½'.repeat(half)}{'☆'.repeat(empty)}
      </span>
    )
  }

  return (
    <div className="seller-page">
      <Header
        userName={userName}
        role={role}
        notifications={notifications}
        onDismissNotification={dismissNotification}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      {/* ── Seller hero strip ── */}
      <div className="seller-hero">
        <div className="seller-info">
          <div className="seller-avatar">{initials}</div>
          <div className="seller-details">
            <h2>{userName}</h2>
            <div className="seller-rating">
              {renderStars(averageRating)}
              {averageRating !== null && (
                <span>{averageRating.toFixed(1)}</span>
              )}
            </div>
          </div>
        </div>

        <button className="list-item-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          List an Item
        </button>
      </div>

      {/* ── Main layout ── */}
      <div className="seller-content">

        {/* ── Left: Tables ── */}
        <div className="listings-col">

          {/* Active listings */}
          <div>
            <h2 className="section-heading">Active Listings</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Top Bid</th>
                    <th>Bids</th>
                    <th>Bids Left</th>
                    <th>Reserve</th>
                  </tr>
                </thead>
                <tbody>
                  {activeListings.length === 0 && (
                    <tr><td colSpan={6} className="td-empty">No active listings.</td></tr>
                  )}
                  {activeListings.map(listing => (
                    <tr key={`${listing.seller_email}-${listing.listing_id}`} className="table-row-clickable">
                      <td className="td-title">{listing.auction_title}</td>
                      <td>{listing.category}</td>
                      <td className="td-amount">
                        {listing.highest_bid != null ? `$${listing.highest_bid}` : '—'}
                      </td>
                      <td>{listing.bid_count}</td>
                      <td>{listing.bids_remaining}</td>
                      <td>
                        <span className={`status-pill ${listing.highest_bid != null && listing.highest_bid >= listing.reserve_price ? 'status-sold' : 'status-unsold'}`}>
                          {listing.highest_bid != null && listing.highest_bid >= listing.reserve_price ? 'Above Reserve' : 'Below Reserve'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sales history */}
          <div>
            <h2 className="section-heading">Sales History</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Final Payment</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {salesHistory.length === 0 && (
                    <tr><td colSpan={5} className="td-empty">No sales history yet.</td></tr>
                  )}
                  {salesHistory.map(record => (
                    <tr key={record.listing_id}>
                      <td className="td-title">{record.auction_title}</td>
                      <td>{record.category}</td>
                      <td className="td-amount">
                        {record.final_payment != null ? `$${record.final_payment}` : '—'}
                      </td>
                      <td>{record.date ?? '—'}</td>
                      <td>
                        <span className={`status-pill status-${record.status}`}>
                          {STATUS_LABEL[record.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Right: Questions placeholder ── */}
        <aside className="questions-col">
          <h2 className="section-heading">Pending Questions</h2>
          <div className="no-questions">Questions coming soon.</div>
        </aside>
      </div>
    </div>
  )
}