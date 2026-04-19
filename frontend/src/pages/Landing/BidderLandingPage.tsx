 import { useState } from 'react'
import Header from './LandingPageHeader'
import type { Notification } from './LandingPageHeader'
import type { UserRole } from '../../api/auth'
import './BidderLandingPage.css'

// ── Types ────────────────────────────────────────────────────

interface Listing {
  id: string
  title: string
  category: string
  seller: string
  topBid: number
  numBids: number
  endsAt: string
  imageUrl?: string
}

interface ActiveBid {
  listingId: string
  title: string
  yourBid: number
  topBid: number
  endsIn: string
  leading: boolean
}

// ── Mock data ─────────────────────────────────────────────────
// TODO: Replace with API calls to productService and bidService
//
// When implemented:
//   const [listings, setListings] = useState<Listing[]>([])
//   useEffect(() => {
//     productService.getListings({ category: activeCategory, search })
//       .then(setListings)
//       .catch(err => console.error('Failed to load listings:', err))
//   }, [activeCategory, search])
//
//   const [myBids, setMyBids] = useState<ActiveBid[]>([])
//   useEffect(() => {
//     bidService.getMyActiveBids().then(setMyBids)
//   }, [])

const MOCK_LISTINGS: Listing[] = [
  { id: '1', title: 'Calculus: Early Transcendentals 9th Ed.', category: 'Textbooks',   seller: 'mike.j@lsu.edu',          topBid: 38,  numBids: 7,  endsAt: '2h 14m left' },
  { id: '2', title: 'MacBook Pro 2021 — 14 inch, M1 Pro',      category: 'Electronics', seller: 'sarah.k@lsu.edu',         topBid: 920, numBids: 12, endsAt: '5h 2m left'  },
  { id: '3', title: 'Dorm Room Desk Lamp (barely used)',        category: 'Furniture',   seller: 'vendor@statecollege.com', topBid: 18,  numBids: 3,  endsAt: '23h 45m left' },
  { id: '4', title: 'Calculus Based Physics Textbook',          category: 'Textbooks',   seller: 'prof.jones@lsu.edu',      topBid: 25,  numBids: 4,  endsAt: '1h 30m left'  },
  { id: '5', title: 'Standing Desk — Adjustable Height',        category: 'Furniture',   seller: 'vendor@statecollege.com', topBid: 210, numBids: 8,  endsAt: '48h left'     },
  { id: '6', title: 'Mechanical Keyboard — Cherry MX Blue',     category: 'Electronics', seller: 'alex.t@lsu.edu',          topBid: 65,  numBids: 5,  endsAt: '6h left'      },
]

const MOCK_MY_BIDS: ActiveBid[] = [
  { listingId: '1', title: 'Calculus: Early Transcendentals 9th Ed.', yourBid: 38,  topBid: 38,  endsIn: '2h 14m', leading: true  },
  { listingId: '2', title: 'MacBook Pro 2021 — 14 inch, M1 Pro',      yourBid: 870, topBid: 920, endsIn: '5h 2m',  leading: false },
]

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', message: 'You won the auction for "Desk Chair — Ergonomic" at $145!', won: true,  seen: false },
  { id: 'n2', message: 'You were outbid on "Organic Chemistry Textbook".',           won: false, seen: false },
]

const CATEGORIES = ['All', 'Textbooks', 'Electronics', 'Furniture', 'Clothing', 'Lab Supplies', 'Sports']

// ── Props ────────────────────────────────────────────────────

interface BidderPageProps {
  userName: string
  role: UserRole
  onNavigate: (page: 'home' | 'account' | 'helpdesk') => void
  onLogout: () => void
}

// ── Component ────────────────────────────────────────────────

export default function BidderPage({ userName, role, onNavigate, onLogout }: BidderPageProps) {
  const [search, setSearch]               = useState('')
  const [activeCategory, setCategory]     = useState('All')
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)

  function dismissNotification(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, seen: true } : n))
  }

  // TODO: Replace with server-side filtering via productService.getListings()
  //
  // When implemented, remove this filter and pass params to the API instead:
  //   productService.getListings({ category: activeCategory, search }).then(setListings)
  const filtered = MOCK_LISTINGS.filter(l => {
    const matchCat    = activeCategory === 'All' || l.category === activeCategory
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase()) ||
                        l.seller.toLowerCase().includes(search.toLowerCase()) ||
                        l.category.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

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

      {/* ── Search bar ── */}
      <div className="bidder-toolbar">
        <div className="search-wrap">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          {/* TODO: Debounce search and wire to productService.getListings()
              When implemented:
              import { useDebouncedCallback } from 'use-debounce'
              const debouncedSearch = useDebouncedCallback((val: string) => {
                productService.getListings({ search: val, category: activeCategory }).then(setListings)
              }, 300)
              Then add to onChange: debouncedSearch(e.target.value)
          */}
          <input
            className="search-input"
            type="text"
            placeholder="Search listings by title, category, seller..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Category filter pills ── */}
      <div className="category-bar">
        {CATEGORIES.map(cat => (
          // TODO: On category change, trigger productService.getListings({ category: cat })
          <button
            key={cat}
            className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
        <span className="listings-count">{filtered.length} listing{filtered.length !== 1 ? 's' : ''} found</span>
      </div>

      {/* ── Two-column layout ── */}
      <div className="bidder-content">

        {/* ── Left: Listings ── */}
        <main className="listings-col">
          {filtered.length === 0 && (
            <div className="empty-state">No listings match your search.</div>
          )}

          {filtered.map(listing => (
            <div
              key={listing.id}
              className="listing-card"
              // TODO: Navigate to bidding page on click
              // onClick={() => onNavigate(`/listing/${listing.id}`)}
            >
              <div className="listing-img">
                {listing.imageUrl
                  ? <img src={listing.imageUrl} alt={listing.title}/>
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
                  <span className="listing-timer">⏱ {listing.endsAt}</span>
                </div>
                <p className="listing-title">{listing.title}</p>
                <p className="listing-seller">Listed by <span>{listing.seller}</span></p>
              </div>

              <div className="listing-bid">
                <p className="bid-label">Top Bid</p>
                <p className="bid-amount">${listing.topBid}</p>
                <p className="bid-count">{listing.numBids} bids</p>
                <button
                  className="bid-now-btn"
                  onClick={e => {
                    e.stopPropagation()
                    // TODO: Navigate to bidding page
                    // onNavigate(`/listing/${listing.id}`)
                  }}
                >
                  Bid Now →
                </button>
              </div>
            </div>
          ))}
        </main>

        {/* ── Right: My Active Bids ── */}
        <aside className="my-bids-col">
          <h2 className="section-heading">My Active Bids</h2>

          {/* TODO: Replace MOCK_MY_BIDS with bidService.getMyActiveBids()
              When implemented:
              const [myBids, setMyBids] = useState<ActiveBid[]>([])
              useEffect(() => {
                bidService.getMyActiveBids().then(setMyBids)
              }, [])
          */}
          {MOCK_MY_BIDS.length === 0 ? (
            <p className="my-bids-empty">You haven't placed any bids yet.</p>
          ) : (
            MOCK_MY_BIDS.map(bid => (
              <div key={bid.listingId} className="bid-card">
                <div className="bid-card-top">
                  <p className="bid-card-title">{bid.title}</p>
                  <span className={`bid-status ${bid.leading ? 'leading' : 'outbid'}`}>
                    {bid.leading ? 'Leading' : 'Outbid'}
                  </span>
                </div>

                <div className="bid-card-row">
                  <span className="bid-card-label">Your bid</span>
                  <span className="bid-card-value">${bid.yourBid}</span>
                </div>

                {!bid.leading && (
                  <div className="bid-card-row">
                    <span className="bid-card-label">Top bid</span>
                    <span className="bid-card-value top">${bid.topBid}</span>
                  </div>
                )}

                <div className="bid-card-row">
                  <span className="bid-card-label">Ends in</span>
                  <span className="bid-card-value">{bid.endsIn}</span>
                </div>

                {!bid.leading && (
                  <button
                    className="bid-again-btn"
                    // TODO: Navigate to listing page to raise bid
                    // onClick={() => onNavigate(`/listing/${bid.listingId}`)}
                  >
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