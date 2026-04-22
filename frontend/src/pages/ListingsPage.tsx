import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import SearchBar from '../components/SearchBar'
//raw data coming from backend
type ApiListing = {
  [key: string]: unknown
  id?: number
  listingId?: number
  listing_id?: number
  title?: string
  auction_title?: string
  auctionTitle?: string
  product_name?: string
  productName?: string
  category?: string
  seller_email?: string
  sellerEmail?: string
  seller?: string
  price?: number
  reserve_price?: number
  reservePrice?: number
  top_bid?: number
  topBid?: number
  highest_bid?: number
  highestBid?: number
  bid_count?: number
  bidCount?: number
  bids?: number
  total_bids?: number
  totalBids?: number
  max_bids?: number
  maxBids?: number
  bids_remaining?: number
  bidsRemaining?: number
  ends_in?: string
  endsIn?: string
  time_remaining?: string
  timeRemaining?: string
  status?: number | string
}
//clean and normalized for FE
type Listing = {
  id: number
  title: string
  category: string
  seller: string
  price: number
  bidCount: number
  endsIn: string
}
//returns first vali str
function firstString(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === 'string' && value.trim() !== '')
}
//first walid num and also like handles numbers as strings
function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value.replace('$', '').trim())

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }
}
// calculates bids rmaining 
function formatBidsRemaining(listing: ApiListing): string | undefined {
  const remaining = firstNumber(listing.bids_remaining, listing.bidsRemaining)

  if (remaining !== undefined) {
    return `${remaining} bids left`
  }

  const maxBids = firstNumber(listing.max_bids, listing.maxBids)
  const bidCount = firstNumber(listing.bid_count, listing.bidCount, listing.total_bids, listing.totalBids, listing.bids)

  if (maxBids !== undefined && bidCount !== undefined) {
    return `${Math.max(maxBids - bidCount, 0)} bids left`
  }
}
// converts backend listing to frontend object
function normalizeListing(listing: ApiListing): Listing {
  const bidCount = firstNumber(
    listing.bid_count,
    listing.bidCount,
    listing.total_bids,
    listing.totalBids,
    listing.bids
  )

  return {
    id: firstNumber(listing.id, listing.listing_id, listing.listingId) ?? 0,
    title: firstString(
      listing.title,
      listing.auction_title,
      listing.auctionTitle,
      listing.product_name,
      listing.productName
    ) ?? 'Untitled listing',
    category: firstString(listing.category) ?? 'Textbooks',
    seller: firstString(listing.seller_email, listing.sellerEmail, listing.seller) ?? 'seller@lsu.edu',
    price: firstNumber(
      listing.highest_bid,
      listing.highestBid,
      listing.top_bid,
      listing.topBid,
      listing.price,
      listing.reserve_price,
      listing.reservePrice
    ) ?? 0,
    bidCount: bidCount ?? 0,
    endsIn: firstString(
      listing.ends_in,
      listing.endsIn,
      listing.time_remaining,
      listing.timeRemaining,
      formatBidsRemaining(listing)
    ) ?? '2h 14m',
  }
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
// fetching listing from BE when components munt , everything is normalized before storing
  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch('/api/listings')

        if (!res.ok) {
          throw new Error('Unable to load listings.')
        }

        const data: ApiListing[] = await res.json()
        setListings(data.map(normalizeListing))
      } catch {
        setError('Unable to load listings. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [])
//vfilter listing based on input matches everything like title , category and seller
  const filteredListings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    if (!query) {
      return listings
    }

    return listings.filter((listing) =>
      listing.title.toLowerCase().includes(query) ||
      listing.category.toLowerCase().includes(query) ||
      listing.seller.toLowerCase().includes(query)
    )
  }, [listings, searchTerm])

  const categories = ['All', 'Textbooks', 'Electronics', 'Furniture', 'Clothing', 'Lab Supplies', 'Sports']

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <span style={styles.logoAccent}>Nittany</span>Auction
        </div>
      </nav>

      <main style={styles.main}>
        <section style={styles.toolbar}>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search listings by title, category, seller..."
          />
          <button style={styles.accountButton}>Account</button>
          <p style={styles.count}>
            {filteredListings.length} listing{filteredListings.length === 1 ? '' : 's'} found
          </p>
        </section>

        <section style={styles.categories}>
          {categories.map((category) => (
            <button
              key={category}
              style={{
                ...styles.categoryPill,
                ...(category === 'All' ? styles.categoryPillActive : {}),
              }}
            >
              {category}
            </button>
          ))}
        </section>

        {loading && <p style={styles.message}>Loading listings...</p>}

        {error && !loading && <p style={styles.error}>{error}</p>}

        {!loading && !error && filteredListings.length === 0 && (
          <p style={styles.message}>No listings found.</p>
        )}

        {!loading && !error && filteredListings.length > 0 && (
          <section style={styles.list}>
            {filteredListings.map((listing) => (
              <article key={listing.id} style={styles.listing}>
                <div style={styles.imageFrame} aria-hidden="true">
                  <span style={styles.imagePlaceholder}>Image Table</span>
                </div>
                {/* Listing detail */}
                <div style={styles.listingBody}>
                  <div style={styles.badgeRow}>
                    <span style={styles.badge}>{listing.category}</span>
                    <span style={styles.timer}>⏱ {listing.endsIn}</span>
                  </div>
                  <h2 style={styles.listingTitle}>{listing.title}</h2>
                  <p style={styles.meta}>
                    Listed by <span style={styles.seller}>{listing.seller}</span>
                  </p>
                </div>
                {/* Bidding info section */}
                <div style={styles.bidInfo}>
                  <span style={styles.priceLabel}>Top Bid</span>
                  <strong style={styles.price}>${listing.price.toFixed(2)}</strong>
                  <span style={styles.bidCount}>{listing.bidCount} bids</span>
                  <button style={styles.button}>Bid Now →</button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0d1522',
    color: '#e8edf4',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  nav: {
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 clamp(1.2rem, 5vw, 3rem)',
    background: '#0d1522',
    borderBottom: '1px solid #2a3d58',
  },
  logo: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.45rem',
    letterSpacing: '.01em',
    color: '#e8edf4',
  },
  logoAccent: {
    color: '#5ba4d4',
  },
  main: {
    width: 'min(1120px, calc(100% - 2rem))',
    margin: '0 auto',
    padding: '1.4rem 0 4rem',
  },
  toolbar: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 132px auto',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.1rem',
  },
  accountButton: {
    height: '50px',
    background: 'transparent',
    color: '#7dbde8',
    border: '1px solid #2a3d58',
    borderRadius: '8px',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: '.9rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  count: {
    margin: 0,
    color: '#7a8fa8',
    fontSize: '.9rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  categories: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '.65rem',
    paddingBottom: '1.2rem',
    marginBottom: '.6rem',
    borderBottom: '1px solid #1f3148',
  },
  categoryPill: {
    height: '34px',
    padding: '0 1.15rem',
    background: 'transparent',
    color: '#7a8fa8',
    border: '1px solid #2a3d58',
    borderRadius: '8px',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: '.82rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  categoryPillActive: {
    color: '#7dbde8',
    borderColor: '#5ba4d4',
    background: 'rgba(91, 164, 212, .08)',
  },
  list: {
    display: 'grid',
    gap: '0',
    borderTop: '1px solid #1f3148',
  },
  listing: {
    display: 'grid',
    gridTemplateColumns: '210px minmax(0, 1fr) 140px',
    alignItems: 'center',
    gap: '1.5rem',
    minHeight: '150px',
    padding: '1rem .25rem 1rem 0',
    background: '#0d1522',
    borderBottom: '1px solid #1f3148',
  },
  imageFrame: {
    position: 'relative',
    width: '210px',
    height: '120px',
    overflow: 'hidden',
    background:
      'linear-gradient(45deg, rgba(255,255,255,.08) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,.08) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,.08) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,.08) 75%)',
    backgroundColor: '#1a2840',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
    backgroundSize: '20px 20px',
    border: '1px solid #2a3d58',
    borderRadius: '4px',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#7a8fa8',
    fontSize: '.9rem',
    fontWeight: 600,
    letterSpacing: '.05em',
  },
  
  imageMountainLarge: {
    position: 'absolute',
    left: '26px',
    bottom: '22px',
    width: 0,
    height: 0,
    borderLeft: '64px solid transparent',
    borderRight: '64px solid transparent',
    borderBottom: '84px solid rgba(232, 237, 244, .25)',
  },
  imageMountainSmall: {
    position: 'absolute',
    right: '22px',
    bottom: '22px',
    width: 0,
    height: 0,
    borderLeft: '42px solid transparent',
    borderRight: '42px solid transparent',
    borderBottom: '58px solid rgba(232, 237, 244, .22)',
  },
  imageSun: {
    position: 'absolute',
    top: '22px',
    right: '42px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'rgba(232, 237, 244, .4)',
  },
  listingBody: {
    minWidth: 0,
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '.65rem',
    marginBottom: '.65rem',
  },
  badge: {
    display: 'inline-flex',
    padding: '.25rem .7rem',
    background: 'rgba(91, 164, 212, .14)',
    border: '1px solid rgba(91, 164, 212, .18)',
    borderRadius: '8px',
    color: '#5ba4d4',
    fontSize: '.72rem',
    fontWeight: 700,
    letterSpacing: '.06em',
    textTransform: 'uppercase',
  },
  timer: {
    color: '#d66a5f',
    fontSize: '.82rem',
    fontWeight: 700,
  },
  listingTitle: {
    margin: 0,
    color: '#e8edf4',
    fontSize: '1.16rem',
    fontWeight: 700,
    lineHeight: 1.25,
  },
  meta: {
    margin: '.45rem 0 0',
    color: '#7a8fa8',
    fontSize: '.88rem',
    fontWeight: 600,
  },
  seller: {
    color: '#7dbde8',
  },
  bidInfo: {
    display: 'grid',
    justifyItems: 'end',
    gap: '.25rem',
    minWidth: '140px',
  },
  priceLabel: {
    color: '#7a8fa8',
    fontSize: '.78rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '.08em',
  },
  price: {
    color: '#7dbde8',
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.85rem',
    lineHeight: 1,
  },
  bidCount: {
    color: '#7a8fa8',
    fontSize: '.86rem',
    fontWeight: 700,
  },
  button: {
    marginTop: '.45rem',
    minWidth: '112px',
    padding: '.72rem 1rem',
    background: '#5ba4d4',
    color: '#0a1929',
    border: 'none',
    borderRadius: '8px',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: '.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 18px rgba(91,164,212,.24)',
  },
  message: {
    color: '#7a8fa8',
    textAlign: 'center',
    fontSize: '1rem',
  },
  error: {
    maxWidth: '540px',
    margin: '2rem auto 0',
    padding: '.85rem 1rem',
    background: '#3a1a1a',
    border: '1px solid #6a2a2a',
    borderRadius: '8px',
    color: '#eb5757',
    textAlign: 'center',
  },
  
}
