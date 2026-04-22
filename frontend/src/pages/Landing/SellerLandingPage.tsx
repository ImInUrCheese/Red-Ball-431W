import { useState, useEffect } from 'react'
import Header from './LandingPageHeader'
import type { Notification } from './LandingPageHeader'
import type { UserRole } from '../../api/auth'
import { getActiveListings, getSalesHistory, getSellerAllListings, updateListing, deactivateListing } from '../../api/seller'
import type { ActiveListing, InactiveListing, SaleRecord } from '../../api/seller'
import { getSellerRatingAverage } from '../../api/ratings'
import { getNotifications, markNotificationRead } from '../../api/notifications'
import type { ApiNotification } from '../../api/notifications'
import './SellerLandingPage.css'

interface SellerPageProps {
  userName: string
  role: UserRole
  onNavigate: (page: 'home' | 'account' | 'helpdesk' | 'createListing') => void
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

type ActionKey = `${string}-${number}`

interface EditForm {
  auction_title: string
  product_name: string
  product_description: string
  category: string
  quantity: string
  reserve_price: string
  max_bids: string
}

export default function SellerPage({ userName, role, onNavigate, onLogout }: SellerPageProps) {
  const [notifications, setNotifications]   = useState<Notification[]>([])
  const [activeListings, setActiveListings] = useState<ActiveListing[]>([])
  const [inactiveListings, setInactiveListings] = useState<InactiveListing[]>([])
  const [salesHistory, setSalesHistory]     = useState<SaleRecord[]>([])
  const [averageRating, setAverageRating]   = useState<number | null>(null)

  // Inline action state
  const [editingKey, setEditingKey]         = useState<ActionKey | null>(null)
  const [editForm, setEditForm]             = useState<EditForm | null>(null)
  const [editStatus, setEditStatus]         = useState('')
  const [deactivatingKey, setDeactivatingKey] = useState<ActionKey | null>(null)
  const [deactivateReason, setDeactivateReason] = useState('')
  const [deactivateStatus, setDeactivateStatus] = useState('')
  const [saving, setSaving]                 = useState(false)

  function actionKey(sellerEmail: string, listingId: number): ActionKey {
    return `${sellerEmail}-${listingId}`
  }

  async function loadAll() {
    const [active, all] = await Promise.all([
      getActiveListings(userName),
      getSellerAllListings(userName),
    ])
    setActiveListings(active)
    setInactiveListings(all.inactive)
  }

  useEffect(() => {
    getNotifications(userName)
      .then(data => setNotifications(data.map(apiNotifToHeader)))
      .catch(() => {})
  }, [userName])

  useEffect(() => { loadAll().catch(() => {}) }, [userName])

  useEffect(() => {
    getSalesHistory(userName).then(setSalesHistory).catch(() => {})
  }, [userName])

  useEffect(() => {
    getSellerRatingAverage(userName)
      .then(data => setAverageRating(data.average_rating))
      .catch(() => {})
  }, [userName])

  async function dismissNotification(id: string) {
    await markNotificationRead(Number(id)).catch(() => {})
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, seen: true } : n))
  }

  function startEdit(listing: ActiveListing) {
    const key = actionKey(listing.seller_email, listing.listing_id)
    if (editingKey === key) { setEditingKey(null); return }
    setDeactivatingKey(null)
    setEditingKey(key)
    setEditStatus('')
    setEditForm({
      auction_title:       listing.auction_title,
      product_name:        listing.product_name,
      product_description: listing.product_description ?? '',
      category:            listing.category,
      quantity:            String(listing.max_bids),   // use actual quantity when available
      reserve_price:       String(listing.reserve_price),
      max_bids:            String(listing.max_bids),
    })
  }

  function startDeactivate(listing: ActiveListing) {
    const key = actionKey(listing.seller_email, listing.listing_id)
    if (deactivatingKey === key) { setDeactivatingKey(null); return }
    setEditingKey(null)
    setDeactivatingKey(key)
    setDeactivateReason('')
    setDeactivateStatus('')
  }

  async function handleSaveEdit(listing: ActiveListing) {
    if (!editForm) return
    setSaving(true)
    setEditStatus('')
    const res = await updateListing(listing.seller_email, listing.listing_id, {
      auction_title:       editForm.auction_title,
      product_name:        editForm.product_name,
      product_description: editForm.product_description,
      category:            editForm.category,
      reserve_price:       parseFloat(editForm.reserve_price),
      max_bids:            parseInt(editForm.max_bids, 10),
    })
    setSaving(false)
    if (res.success) {
      setEditingKey(null)
      await loadAll()
    } else {
      setEditStatus(res.error ?? 'Failed to save.')
    }
  }

  async function handleDeactivate(listing: ActiveListing) {
    if (!deactivateReason.trim()) {
      setDeactivateStatus('A reason is required.')
      return
    }
    setSaving(true)
    setDeactivateStatus('')
    const res = await deactivateListing(listing.seller_email, listing.listing_id, deactivateReason.trim())
    setSaving(false)
    if (res.success) {
      setDeactivatingKey(null)
      await loadAll()
    } else {
      setDeactivateStatus(res.error ?? 'Failed to deactivate.')
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

      <div className="seller-hero">
        <div className="seller-info">
          <div className="seller-avatar">{initials}</div>
          <div className="seller-details">
            <h2>{userName}</h2>
            <div className="seller-rating">
              {renderStars(averageRating)}
              {averageRating !== null && <span>{averageRating.toFixed(1)}</span>}
            </div>
          </div>
        </div>
        <button className="list-item-btn" onClick={() => onNavigate('createListing')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          List an Item
        </button>
      </div>

      <div className="seller-content">
        <div className="listings-col">

          {/* ── Active Listings ── */}
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
                    <th>Left</th>
                    <th>Reserve</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeListings.length === 0 && (
                    <tr><td colSpan={7} className="td-empty">No active listings.</td></tr>
                  )}
                  {activeListings.map(listing => {
                    const key = actionKey(listing.seller_email, listing.listing_id)
                    const isEditing     = editingKey === key
                    const isDeactivating = deactivatingKey === key
                    const hasBids = listing.bid_count > 0

                    return (
                      <>
                        <tr key={key}>
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
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                className="action-btn action-btn-edit"
                                onClick={() => startEdit(listing)}
                              >
                                {isEditing ? 'Cancel' : 'Edit'}
                              </button>
                              <button
                                className="action-btn action-btn-deactivate"
                                onClick={() => startDeactivate(listing)}
                              >
                                {isDeactivating ? 'Cancel' : 'Remove'}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* ── Inline edit panel ── */}
                        {isEditing && editForm && (
                          <tr key={`${key}-edit`}>
                            <td colSpan={7} style={{ padding: 0 }}>
                              <div className="inline-panel">
                                {hasBids ? (
                                  <p className="inline-panel-blocked">
                                    This listing cannot be edited because bidding has already started ({listing.bid_count} bid{listing.bid_count !== 1 ? 's' : ''} placed).
                                  </p>
                                ) : (
                                  <>
                                    <div className="inline-panel-grid">
                                      <div className="inline-field">
                                        <label>Auction Title</label>
                                        <input value={editForm.auction_title} onChange={e => setEditForm(f => f && ({ ...f, auction_title: e.target.value }))} />
                                      </div>
                                      <div className="inline-field">
                                        <label>Product Name</label>
                                        <input value={editForm.product_name} onChange={e => setEditForm(f => f && ({ ...f, product_name: e.target.value }))} />
                                      </div>
                                      <div className="inline-field">
                                        <label>Reserve Price ($)</label>
                                        <input type="number" min="0" step="0.01" value={editForm.reserve_price} onChange={e => setEditForm(f => f && ({ ...f, reserve_price: e.target.value }))} />
                                      </div>
                                      <div className="inline-field">
                                        <label>Max Bids</label>
                                        <input type="number" min="1" value={editForm.max_bids} onChange={e => setEditForm(f => f && ({ ...f, max_bids: e.target.value }))} />
                                      </div>
                                      <div className="inline-field inline-field-wide">
                                        <label>Description</label>
                                        <textarea value={editForm.product_description} onChange={e => setEditForm(f => f && ({ ...f, product_description: e.target.value }))} />
                                      </div>
                                    </div>
                                    {editStatus && <p className="inline-panel-error">{editStatus}</p>}
                                    <div className="inline-panel-actions">
                                      <button className="action-btn action-btn-edit" disabled={saving} onClick={() => handleSaveEdit(listing)}>
                                        {saving ? 'Saving…' : 'Save Changes'}
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* ── Inline deactivate panel ── */}
                        {isDeactivating && (
                          <tr key={`${key}-deactivate`}>
                            <td colSpan={7} style={{ padding: 0 }}>
                              <div className="inline-panel inline-panel-danger">
                                <p className="inline-panel-label">Reason for removal</p>
                                <textarea
                                  className="inline-textarea"
                                  placeholder="Explain why you are removing this listing…"
                                  value={deactivateReason}
                                  onChange={e => setDeactivateReason(e.target.value)}
                                />
                                {deactivateStatus && <p className="inline-panel-error">{deactivateStatus}</p>}
                                <div className="inline-panel-actions">
                                  <button
                                    className="action-btn action-btn-deactivate"
                                    disabled={saving}
                                    onClick={() => handleDeactivate(listing)}
                                  >
                                    {saving ? 'Removing…' : 'Confirm Removal'}
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Inactive Listings ── */}
          <div>
            <h2 className="section-heading">Inactive Listings</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Reserve</th>
                    <th>Max Bids</th>
                  </tr>
                </thead>
                <tbody>
                  {inactiveListings.length === 0 && (
                    <tr><td colSpan={4} className="td-empty">No inactive listings.</td></tr>
                  )}
                  {inactiveListings.map(listing => (
                    <tr key={`${listing.seller_email}-${listing.listing_id}`}>
                      <td className="td-title">{listing.auction_title}</td>
                      <td>{listing.category}</td>
                      <td className="td-amount">${listing.reserve_price}</td>
                      <td>{listing.max_bids}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Sales History ── */}
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

        <aside className="questions-col">
          <h2 className="section-heading">Pending Questions</h2>
          <div className="no-questions">Questions coming soon.</div>
        </aside>
      </div>
    </div>
  )
}
