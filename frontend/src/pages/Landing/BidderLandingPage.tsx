import { useState, useEffect, useCallback } from 'react'
import Header from './LandingPageHeader'
import type { Notification } from './LandingPageHeader'
import type { UserRole } from '../../api/auth'
import { searchListings, getListingsByCategory, getSubcategories } from '../../api/listings'
import type { Listing } from '../../api/listings'
import { getMyActiveBids } from '../../api/bids'
import type { ActiveBid } from '../../api/bids'
import { getNotifications, markNotificationRead } from '../../api/notifications'
import type { ApiNotification } from '../../api/notifications'
import './BidderLandingPage.css'

interface BidderPageProps {
  userName: string
  role: UserRole
  onNavigate: (page: 'home' | 'account' | 'helpdesk') => void
  onLogout: () => void
  onBidNow: (sellerEmail: string, listingId: number) => void
  refreshKey: number
}

function apiNotifToHeader(n: ApiNotification): Notification {
  return {
    id: String(n.notification_id),
    message: n.message,
    won: n.notification_type === 'auction_won',
    seen: n.is_read === 1,
  }
}

export default function BidderPage({ userName, role, onNavigate, onLogout, onBidNow, refreshKey }: BidderPageProps) {
  const [search, setSearch]               = useState('')
  const [minPrice, setMinPrice]           = useState('')
  const [maxPrice, setMaxPrice]           = useState('')
  const [categoryPath, setCategoryPath]   = useState<string[]>(['All'])
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [listings, setListings]           = useState<Listing[]>([])
  const [myBids, setMyBids]               = useState<ActiveBid[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loadingListings, setLoadingListings] = useState(true)
  const [currentPage, setCurrentPage]     = useState(1)

  const currentCategory = categoryPath[categoryPath.length - 1]

  const LISTINGS_PER_PAGE = 25
  const totalPages = Math.ceil(listings.length / LISTINGS_PER_PAGE)
  const visibleListings = listings.slice(
    (currentPage - 1) * LISTINGS_PER_PAGE,
    currentPage * LISTINGS_PER_PAGE
  )

  //  result paging buttons 
  function renderPageButtons() {
    const delta = 2
    const left  = Math.max(1, currentPage - delta)
    const right = Math.min(totalPages, currentPage + delta)
    const pages = Array.from({ length: right - left + 1 }, (_, i) => left + i)

    return (
      <>
        {left > 1 && (
          <>
            <button className="page-btn" onClick={() => setCurrentPage(1)}>1</button>
            {left > 2 && <span className="page-ellipsis">…</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            className={`page-btn ${page === currentPage ? 'active' : ''}`}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </button>
        ))}

        {right < totalPages && (
          <>
            {right < totalPages - 1 && <span className="page-ellipsis">…</span>}
            <button className="page-btn" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
          </>
        )}
      </>
    )
  }

  //  get subcategories  
  useEffect(() => {
    getSubcategories(currentCategory)
      .then(setSubcategories)
      .catch(() => setSubcategories([]))
  }, [currentCategory])

  //  get listings 
  const fetchListings = useCallback(async () => {
    setLoadingListings(true)
    try {
      let data: Listing[]
      const min = minPrice !== '' ? parseFloat(minPrice) : undefined
      const max = maxPrice !== '' ? parseFloat(maxPrice) : undefined
      const hasFilters = search.trim() || min != null || max != null
      if (hasFilters) {
        data = await searchListings(search.trim() || undefined, min, max)
      } else if (currentCategory === 'All') {
        data = await searchListings()
      } else {
        data = await getListingsByCategory(currentCategory)
      }
      setListings(data)
    } catch (err) {
      console.error('Failed to load listings:', err)
    } finally {
      setLoadingListings(false)
    }
  }, [search, minPrice, maxPrice, currentCategory, refreshKey])

  useEffect(() => {
    const timer = setTimeout(fetchListings, 300)
    return () => clearTimeout(timer)
  }, [fetchListings])

  //  get my active bids 
  useEffect(() => {
    getMyActiveBids(userName)
      .then(setMyBids)
      .catch(err => console.error('Failed to load bids:', err))
  }, [userName])

  //  get notifications 
  useEffect(() => {
    getNotifications(userName)
      .then(data => setNotifications(data.map(apiNotifToHeader)))
      .catch(err => console.error('Failed to load notifications:', err))
  }, [userName])

  //  dismis notification 
  async function dismissNotification(id: string) {
    try {
      await markNotificationRead(Number(id))
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, seen: true } : n))
    } catch (err) {
      console.error('Failed to mark notification read:', err)
    }
  }

  //  category navigation 
  function drillInto(cat: string) {
    setCategoryPath(prev => [...prev, cat])
    setSearch('')
    setMinPrice('')
    setMaxPrice('')
    setCurrentPage(1)
  }

  function navigateTo(index: number) {
    setCategoryPath(prev => prev.slice(0, index + 1))
    setSearch('')
    setMinPrice('')
    setMaxPrice('')
    setCurrentPage(1)
  }

  return (
    <div className="bidder-page">
      <Header
        userName={userName}
        role={role}
        notifications={notifications}
        onDismissNotification={dismissNotification}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />


      <div className="bidder-toolbar">
        <div className="search-wrap">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder="Search listings by title, category, seller..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
          />
        </div>
        <div className="price-range-wrap">
          <input
            className="price-input"
            type="number"
            min="0"
            placeholder="Min $"
            value={minPrice}
            onChange={e => { setMinPrice(e.target.value); setCurrentPage(1) }}
          />
          <span className="price-sep">–</span>
          <input
            className="price-input"
            type="number"
            min="0"
            placeholder="Max $"
            value={maxPrice}
            onChange={e => { setMaxPrice(e.target.value); setCurrentPage(1) }}
          />
        </div>
      </div>

      <div className="category-nav">
        <div className="cat-breadcrumb">
          {categoryPath.map((cat, i) => (
            <span key={i} className="cat-crumb-item">
              {i > 0 && <span className="cat-crumb-sep">›</span>}
              <button
                className={`cat-crumb ${i === categoryPath.length - 1 ? 'current' : ''}`}
                onClick={() => i < categoryPath.length - 1 ? navigateTo(i) : undefined}
                disabled={i === categoryPath.length - 1}
              >
                {cat}
              </button>
            </span>
          ))}
          <span className="listings-count" style={{ marginLeft: 'auto' }}>
            {loadingListings ? 'Loading...' : `${listings.length} listing${listings.length !== 1 ? 's' : ''} found`}
          </span>
        </div>

        {subcategories.length > 0 && (
          <div className="subcat-pills">
            {subcategories.map(cat => (
              <button
                key={cat}
                className="cat-pill"
                onClick={() => drillInto(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bidder-content">

        <main className="listings-col">
          {!loadingListings && listings.length === 0 && (
            <div className="empty-state">No listings match your search.</div>
          )}

          {visibleListings.map(listing => (
            <div key={`${listing.seller_email}-${listing.listing_id}`} className="listing-card">
              <div className="listing-img">
                {listing.image_url
                  ? <img src={listing.image_url} alt={listing.auction_title} />
                  : <div className="listing-img-placeholder">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                }
              </div>

              <div className="listing-info">
                <div className="listing-meta">
                  <span className="cat-tag">{listing.category}</span>
                  <span className="listing-timer"> {listing.bids_remaining ?? listing.max_bids} bids left</span>
                </div>
                <p className="listing-title">{listing.auction_title}</p>
                <p className="listing-seller">Listed by <span>{listing.seller_email}</span></p>
              </div>

              <div className="listing-bid">
                <p className="bid-label">Top Bid</p>
                <p className="bid-amount">
                  {listing.highest_bid != null ? `$${listing.highest_bid}` : '$0'}
                </p>
                <p className="bid-count">{listing.bid_count ?? 0} bids</p>
                <button
                  className="bid-now-btn"
                  onClick={e => {
                    e.stopPropagation()
                    onBidNow(listing.seller_email, listing.listing_id)
                  }}
                >
                  Bid Now →
                </button>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                ← Prev
              </button>

              {renderPageButtons()}

              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </main>

        <aside className="my-bids-col">
          <h2 className="section-heading">My Active Bids</h2>

          {myBids.length === 0 ? (
            <p className="my-bids-empty">You haven't placed any bids yet.</p>
          ) : (
            myBids.map(bid => (
              <div key={`${bid.seller_email}-${bid.listing_id}`} className="bid-card">
                <div className="bid-card-top">
                  <p className="bid-card-title">{bid.auction_title}</p>
                  <span className={`bid-status ${bid.leading ? 'leading' : 'outbid'}`}>
                    {bid.leading ? 'Leading' : 'Outbid'}
                  </span>
                </div>

                <div className="bid-card-row">
                  <span className="bid-card-label">Your bid</span>
                  <span className="bid-card-value">${bid.your_bid}</span>
                </div>

                {!bid.leading && (
                  <div className="bid-card-row">
                    <span className="bid-card-label">Top bid</span>
                    <span className="bid-card-value top">${bid.highest_bid}</span>
                  </div>
                )}

                <div className="bid-card-row">
                  <span className="bid-card-label">Bids left</span>
                  <span className="bid-card-value">{bid.bids_remaining}</span>
                </div>

                {!bid.leading && (
                  <button className="bid-again-btn" onClick={() => onBidNow(bid.seller_email, bid.listing_id)}>
                    Raise Bid →
                  </button>
                )}
              </div>
            ))
          )}
        </aside>
      </div>
    </div>
  )
}
