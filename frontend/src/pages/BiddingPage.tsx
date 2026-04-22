import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { getListingDetail } from '../api/listings'
import type { Listing } from '../api/listings'
import { getBidHistory, placeBid, checkAuctionComplete } from '../api/bids'
import type { BidEntry } from '../api/bids'
import { getPaymentInfo } from '../api/user'
import type { PaymentInfo } from '../api/user'
import { confirmPayment, getListingTransaction } from '../api/transactions'
import { checkCanRate, submitRating } from '../api/ratings'

interface BiddingPageProps {
  sellerEmail: string
  listingId: number
  userName: string
  onBack: () => void
}

export default function BiddingPage({ sellerEmail, listingId, userName, onBack }: BiddingPageProps) {
  const [listing, setListing] = useState<(Listing & { highest_bid: number | null; bid_count: number; bids_remaining: number }) | null>(null)
  const [bidHistory, setBidHistory] = useState<BidEntry[]>([])
  const [bidAmount, setBidAmount] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Auction completion state
  const [auctionComplete, setAuctionComplete] = useState(false)
  const [reserveMet, setReserveMet] = useState(false)
  const [winningBid, setWinningBid] = useState<number | null>(null)
  const [isWinner, setIsWinner] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [paymentPaid, setPaymentPaid] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [payingNow, setPayingNow] = useState(false)

  // Rating state
  const [transactionId, setTransactionId] = useState<number | null>(null)
  const [canRate, setCanRate] = useState(false)
  const [ratingValue, setRatingValue] = useState(0)
  const [ratingDesc, setRatingDesc] = useState('')
  const [ratingSubmitted, setRatingSubmitted] = useState(false)
  const [ratingError, setRatingError] = useState('')
  const [ratingSubmitting, setRatingSubmitting] = useState(false)

  async function resolveAuctionResult() {
    const status = await checkAuctionComplete(sellerEmail, listingId)
    if (!status.complete) return
    setAuctionComplete(true)
    setReserveMet(status.reserve_met)
    setWinningBid(status.highest_bid)
    if (status.winner === userName && status.reserve_met) {
      setIsWinner(true)
      getPaymentInfo().then(setPaymentInfo).catch(() => {})
    }
  }

  useEffect(() => {
    async function load() {
      const [detail, history] = await Promise.all([
        getListingDetail(sellerEmail, listingId),
        getBidHistory(sellerEmail, listingId),
      ])
      setListing(detail)
      setBidHistory(history)
      if (detail.status === 2) {
        setPaymentPaid(true)
        setAuctionComplete(true)
        // Check if current user can still rate this transaction
        try {
          const txn = await getListingTransaction(sellerEmail, listingId)
          if (txn.buyer_email === userName) {
            setTransactionId(txn.transaction_id)
            const eligible = await checkCanRate(userName, sellerEmail, txn.transaction_id)
            setCanRate(eligible.eligible)
          }
        } catch {
          // Not the buyer or no transaction yet
        }
      } else if (detail.status === 0) {
        await resolveAuctionResult()
      }
    }
    load()
  }, [sellerEmail, listingId, userName])

  const minBid = listing ? (listing.highest_bid ?? 0) + 1 : 1
  const isUserLeading = bidHistory.length > 0 && bidHistory[0].bidder_email === userName

  async function handlePlaceBid() {
    if (isUserLeading) {
      setError('You already have the leading bid. Wait for another bidder before bidding again.')
      return
    }
    const amount = parseFloat(bidAmount)
    if (isNaN(amount) || amount < minBid) {
      setError(`Bid too low — minimum next bid is $${minBid}.`)
      return
    }
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const result = await placeBid(userName, sellerEmail, listingId, amount)
      if (result.success) {
        setSuccess('Bid placed successfully!')
        setBidAmount('')
        const [updatedListing, updatedHistory] = await Promise.all([
          getListingDetail(sellerEmail, listingId),
          getBidHistory(sellerEmail, listingId),
        ])
        setListing(updatedListing)
        setBidHistory(updatedHistory)
        if (result.auction_complete) {
          await resolveAuctionResult()
        }
      } else {
        setError(result.error ?? 'Failed to place bid.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirmPayment() {
    if (winningBid == null) return
    setPayingNow(true)
    setPaymentError('')
    try {
      const res = await confirmPayment(sellerEmail, listingId, winningBid)
      if (res.success) {
        setPaymentPaid(true)
        setIsWinner(false)
        if (res.transaction_id) {
          setTransactionId(res.transaction_id)
          setCanRate(true)
        }
      } else {
        setPaymentError(res.error ?? 'Payment failed. Please try again.')
      }
    } catch {
      setPaymentError('Payment failed. Please try again.')
    } finally {
      setPayingNow(false)
    }
  }

  async function handleSubmitRating() {
    if (!transactionId || ratingValue === 0) return
    setRatingSubmitting(true)
    setRatingError('')
    try {
      const res = await submitRating(userName, sellerEmail, transactionId, ratingValue, ratingDesc || undefined)
      if (res.success) {
        setRatingSubmitted(true)
        setCanRate(false)
      } else {
        setRatingError(res.error ?? 'Failed to submit rating.')
      }
    } finally {
      setRatingSubmitting(false)
    }
  }

  if (!listing) {
    return (
      <div style={styles.page}>
        <nav style={styles.nav}>
          <button style={styles.backBtn} onClick={onBack}>← Back</button>
          <div style={styles.logo}><span style={styles.logoAccent}>Nittany</span>Auction</div>
        </nav>
        <main style={styles.main}>
          <p style={{ color: '#7a8fa8' }}>Loading...</p>
        </main>
      </div>
    )
  }

  const sellerInitial = sellerEmail.charAt(0).toUpperCase()
  const isActive = listing.status === 1

  function renderRightPanel() {
    if (!listing) return null
    // Active: show bid input
    if (isActive && listing.bids_remaining > 0) {
      return (
        <>
          {isUserLeading ? (
            <p style={styles.warningMsg}>
              You have the leading bid. Another bidder must bid before you can bid again.
            </p>
          ) : (
            <>
              <label style={styles.inputGroup}>
                <span style={styles.inputLabel}>Your Bid Amount ($)</span>
                <input
                  style={styles.input}
                  type="number"
                  min={minBid}
                  placeholder={`${minBid}+`}
                  value={bidAmount}
                  onChange={e => { setBidAmount(e.target.value); setError(''); setSuccess('') }}
                />
              </label>
              {error && <p style={styles.errorMsg}>{error}</p>}
              {success && <p style={styles.successMsg}>{success}</p>}
              <button
                style={{ ...styles.primaryButton, opacity: submitting ? 0.6 : 1 }}
                disabled={submitting}
                onClick={handlePlaceBid}
              >
                {submitting ? 'Placing...' : 'Place Bid →'}
              </button>
            </>
          )}
        </>
      )
    }

    // Sold — already paid
    if (listing.status === 2 || paymentPaid) {
      return (
        <div style={styles.paymentDonePanel}>
          <p style={styles.paymentDoneTitle}>Auction Complete</p>
          <p style={styles.successMsg}>This item has been sold and payment confirmed.</p>
        </div>
      )
    }

    // Closed — winner needs to pay
    if (auctionComplete && isWinner && reserveMet) {
      return (
        <div style={styles.paymentPanel}>
          <p style={styles.wonTitle}>You won this auction!</p>
          <div style={styles.wonRow}>
            <span style={styles.statLabel}>Winning bid</span>
            <strong style={styles.wonAmount}>${winningBid?.toFixed(2)}</strong>
          </div>
          {paymentInfo ? (
            <div style={styles.cardInfo}>
              <span style={styles.statLabel}>Charge to</span>
              <p style={styles.cardDetail}>
                {paymentInfo.card_type} ending in {paymentInfo.last_four}
                <span style={styles.cardExp}> · exp {paymentInfo.expire_month}/{paymentInfo.expire_year}</span>
              </p>
            </div>
          ) : (
            <p style={styles.noCard}>No payment method on file. Please add a credit card in Account Settings.</p>
          )}
          {paymentError && <p style={styles.errorMsg}>{paymentError}</p>}
          <button
            style={{ ...styles.primaryButton, ...styles.payBtn, opacity: (payingNow || !paymentInfo) ? 0.6 : 1 }}
            disabled={payingNow || !paymentInfo}
            onClick={handleConfirmPayment}
          >
            {payingNow ? 'Processing...' : 'Confirm Payment →'}
          </button>
        </div>
      )
    }

    // Closed — reserve not met
    if (auctionComplete && !reserveMet) {
      return (
        <p style={{ color: '#f7b733', fontWeight: 700, fontSize: '.88rem', marginTop: '1rem', lineHeight: 1.45 }}>
          This auction ended without a sale — the reserve price was not met.
        </p>
      )
    }

    // Deactivated by seller, or auction ended message
    return (
      <p style={{ color: '#d66a5f', fontWeight: 700, fontSize: '.88rem', marginTop: '1rem' }}>
        {listing.bids_remaining === 0 ? 'Auction has ended.' : 'This listing is no longer active.'}
      </p>
    )
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <div style={styles.logo}><span style={styles.logoAccent}>Nittany</span>Auction</div>
      </nav>

      <main style={styles.main}>
        <p style={styles.breadcrumb}>Browse → {listing.category} → {listing.auction_title}</p>

        <section style={styles.layout}>
          <div style={styles.leftColumn}>
            <article style={styles.itemCard}>
              <div style={styles.imageFrame} aria-hidden="true">
                {listing.image_url
                  ? <img src={listing.image_url} alt={listing.auction_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <>
                      <div style={styles.imageSky} />
                      <div style={styles.imageMountainLarge} />
                      <div style={styles.imageMountainSmall} />
                      <div style={styles.imageSun} />
                    </>
                }
              </div>

              <div style={styles.itemInfo}>
                <div style={styles.badgeRow}>
                  <span style={styles.badge}>{listing.category}</span>
                  <span style={isActive ? styles.statusActive : styles.statusClosed}>
                    {isActive ? 'Active' : listing.status === 2 ? 'Sold' : 'Closed'}
                  </span>
                </div>
                <h1 style={styles.title}>{listing.auction_title}</h1>
                <p style={styles.meta}>
                  Listed by <span style={styles.sellerLink}>{sellerEmail}</span>
                </p>
                <div style={styles.divider} />
                <p style={styles.description}>
                  <strong>Description:</strong> {listing.product_description}
                </p>
              </div>
            </article>

            <section style={styles.historyCard}>
              <div style={styles.historyHeader}>
                <h2 style={styles.sectionTitle}>Bid History</h2>
                <span style={styles.muted}>{listing.bid_count} bid{listing.bid_count !== 1 ? 's' : ''} placed</span>
              </div>

              {bidHistory.length === 0 ? (
                <p style={{ color: '#7a8fa8', fontSize: '.85rem', margin: 0 }}>No bids yet. Be the first!</p>
              ) : (
                <div style={styles.bidList}>
                  {bidHistory.map((bid, i) => {
                    const isYou = bid.bidder_email === userName
                    const displayName = isYou ? 'You' : bid.bidder_email
                    return (
                      <article key={i} style={styles.bidRow}>
                        <div style={styles.avatar}>{displayName.charAt(0).toUpperCase()}</div>
                        <div style={styles.bidderInfo}>
                          <strong style={styles.bidder}>{displayName}</strong>
                        </div>
                        <div style={styles.bidAmountCol}>
                          <strong>${bid.bid_price}</strong>
                          {i === 0 && <span style={styles.leading}>Leading</span>}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          <aside style={styles.rightColumn}>
            <section style={styles.bidPanel}>
              <div style={styles.stats}>
                <div>
                  <span style={styles.statLabel}>Current Top Bid</span>
                  <strong style={styles.topBid}>
                    {listing.highest_bid != null ? `$${listing.highest_bid}` : '—'}
                  </strong>
                </div>
                <div style={styles.statRight}>
                  <span style={styles.statLabel}>Bids Left</span>
                  <strong style={styles.totalBids}>{listing.bids_remaining}</strong>
                </div>
              </div>

              {isActive && <p style={styles.minimumBid}>Minimum next bid: <strong>${minBid}</strong></p>}

              {renderRightPanel()}
            </section>

            <section style={styles.sellerCard}>
              <h2 style={styles.panelTitle}>Seller Info</h2>
              <div style={styles.sellerRow}>
                <div style={styles.sellerAvatar}>{sellerInitial}</div>
                <div>
                  <strong style={styles.sellerEmail}>{sellerEmail}</strong>
                </div>
              </div>
            </section>

            {/* Rating card — shown after payment or on revisit if eligible */}
            {canRate && !ratingSubmitted && (
              <section style={styles.ratingCard}>
                <h2 style={styles.panelTitle}>Rate this Seller</h2>
                <div style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      style={n <= ratingValue ? styles.starActive : styles.starInactive}
                      onClick={() => setRatingValue(n)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  style={styles.ratingTextarea}
                  placeholder="Add a comment (optional)"
                  value={ratingDesc}
                  onChange={e => setRatingDesc(e.target.value)}
                />
                {ratingError && <p style={styles.errorMsg}>{ratingError}</p>}
                <button
                  style={{ ...styles.primaryButton, marginTop: '.75rem', opacity: (ratingSubmitting || ratingValue === 0) ? 0.6 : 1 }}
                  disabled={ratingSubmitting || ratingValue === 0}
                  onClick={handleSubmitRating}
                >
                  {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
                </button>
              </section>
            )}
            {ratingSubmitted && (
              <section style={styles.ratingCard}>
                <p style={{ ...styles.successMsg, margin: 0 }}>Rating submitted. Thank you!</p>
              </section>
            )}
          </aside>
        </section>
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
    gap: '1rem',
    padding: '0 clamp(1.2rem, 5vw, 3rem)',
    background: '#0d1522',
    borderBottom: '1px solid #2a3d58',
  },
  backBtn: {
    background: 'transparent',
    border: '1px solid #2a3d58',
    borderRadius: '8px',
    color: '#7dbde8',
    cursor: 'pointer',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: '.85rem',
    fontWeight: 700,
    padding: '.4rem .9rem',
  },
  logo: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.45rem',
    letterSpacing: '.01em',
    color: '#e8edf4',
  },
  logoAccent: { color: '#5ba4d4' },
  main: {
    width: 'min(880px, calc(100% - 2rem))',
    margin: '0 auto',
    padding: '1.8rem 0 4rem',
  },
  breadcrumb: {
    margin: '0 0 1.15rem',
    color: '#7a8fa8',
    fontSize: '.8rem',
    fontWeight: 700,
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, .9fr)',
    gap: '1.2rem',
    alignItems: 'start',
  },
  leftColumn: { display: 'grid', gap: '1rem' },
  rightColumn: { display: 'grid', gap: '1rem' },
  itemCard: {
    display: 'grid',
    gridTemplateColumns: '96px minmax(0, 1fr)',
    gap: '1rem',
    padding: '1.5rem',
    background: '#1a2840',
    border: '1px solid #2a3d58',
    borderRadius: '8px',
  },
  imageFrame: {
    position: 'relative',
    width: '90px',
    height: '90px',
    overflow: 'hidden',
    alignSelf: 'start',
    background: '#26364b',
    border: '1px solid #2a3d58',
    borderRadius: '8px',
  },
  imageSky: {
    position: 'absolute',
    inset: '10px',
    border: '5px solid rgba(232, 237, 244, .28)',
    borderRadius: '3px',
  },
  imageMountainLarge: {
    position: 'absolute',
    left: '12px',
    bottom: '18px',
    width: 0,
    height: 0,
    borderLeft: '30px solid transparent',
    borderRight: '30px solid transparent',
    borderBottom: '42px solid rgba(232, 237, 244, .25)',
  },
  imageMountainSmall: {
    position: 'absolute',
    right: '10px',
    bottom: '18px',
    width: 0,
    height: 0,
    borderLeft: '22px solid transparent',
    borderRight: '22px solid transparent',
    borderBottom: '30px solid rgba(232, 237, 244, .22)',
  },
  imageSun: {
    position: 'absolute',
    top: '16px',
    right: '18px',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    background: 'rgba(232, 237, 244, .4)',
  },
  itemInfo: { minWidth: 0 },
  badgeRow: {
    display: 'flex',
    gap: '.5rem',
    alignItems: 'center',
    marginBottom: '.65rem',
  },
  badge: {
    padding: '.28rem .7rem',
    background: 'rgba(91, 164, 212, .14)',
    border: '1px solid rgba(91, 164, 212, .18)',
    borderRadius: '8px',
    color: '#5ba4d4',
    fontSize: '.7rem',
    fontWeight: 800,
    letterSpacing: '.06em',
    textTransform: 'uppercase',
  },
  statusActive: {
    padding: '.28rem .7rem',
    background: 'rgba(111, 207, 151, .12)',
    borderRadius: '8px',
    color: '#6fcf97',
    fontSize: '.7rem',
    fontWeight: 800,
    letterSpacing: '.06em',
    textTransform: 'uppercase',
  },
  statusClosed: {
    padding: '.28rem .7rem',
    background: 'rgba(214, 106, 95, .12)',
    borderRadius: '8px',
    color: '#d66a5f',
    fontSize: '.7rem',
    fontWeight: 800,
    letterSpacing: '.06em',
    textTransform: 'uppercase',
  },
  title: {
    margin: 0,
    color: '#e8edf4',
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.45rem',
    lineHeight: 1.12,
  },
  meta: {
    margin: '.45rem 0 0',
    color: '#7a8fa8',
    fontSize: '.86rem',
    fontWeight: 700,
  },
  sellerLink: { color: '#7dbde8' },
  divider: {
    height: '1px',
    margin: '1rem 0',
    background: '#2a3d58',
  },
  description: {
    margin: 0,
    color: '#9cafc4',
    fontSize: '.88rem',
    fontWeight: 600,
    lineHeight: 1.55,
  },
  historyCard: {
    padding: '1.4rem 1.5rem',
    background: '#1a2840',
    border: '1px solid #2a3d58',
    borderRadius: '8px',
  },
  historyHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  sectionTitle: {
    margin: 0,
    color: '#e8edf4',
    fontSize: '.98rem',
    fontWeight: 800,
    letterSpacing: '.02em',
  },
  muted: {
    color: '#7a8fa8',
    fontSize: '.82rem',
    fontWeight: 800,
  },
  bidList: { display: 'grid', gap: '.35rem' },
  bidRow: {
    display: 'grid',
    gridTemplateColumns: '32px minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: '.75rem',
    padding: '.75rem',
    background: '#1e2f47',
    border: '1px solid rgba(42, 61, 88, .55)',
    borderRadius: '8px',
  },
  avatar: {
    display: 'grid',
    placeItems: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#5ba4d4',
    color: '#0a1929',
    fontSize: '.78rem',
    fontWeight: 800,
  },
  bidderInfo: { display: 'grid', minWidth: 0 },
  bidder: {
    overflow: 'hidden',
    color: '#e8edf4',
    fontSize: '.83rem',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  bidAmountCol: {
    display: 'grid',
    justifyItems: 'end',
    color: '#e8edf4',
    fontSize: '.92rem',
  },
  leading: {
    color: '#6fcf97',
    fontSize: '.62rem',
    fontWeight: 900,
    textTransform: 'uppercase',
  },
  bidPanel: {
    padding: '1.45rem',
    background: '#1a2840',
    border: '1px solid #2a3d58',
    borderRadius: '8px',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '.5rem',
  },
  statRight: { textAlign: 'right' },
  statLabel: {
    display: 'block',
    color: '#7a8fa8',
    fontSize: '.72rem',
    fontWeight: 800,
    marginBottom: '.25rem',
    textTransform: 'uppercase',
    letterSpacing: '.08em',
  },
  topBid: {
    color: '#7dbde8',
    fontFamily: "'Playfair Display', serif",
    fontSize: '2rem',
    lineHeight: 1,
  },
  totalBids: {
    color: '#e8edf4',
    fontSize: '1.55rem',
  },
  minimumBid: {
    margin: '1rem 0',
    color: '#9cafc4',
    fontSize: '.82rem',
    fontWeight: 700,
  },
  inputGroup: { display: 'grid', gap: '.55rem' },
  inputLabel: {
    color: '#7a8fa8',
    fontSize: '.72rem',
    fontWeight: 900,
    letterSpacing: '.12em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    height: '48px',
    boxSizing: 'border-box',
    background: '#1e2f47',
    border: '1px solid #2a3d58',
    borderRadius: '8px',
    color: '#e8edf4',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: '1rem',
    fontWeight: 700,
    outline: 'none',
    padding: '0 1rem',
    textAlign: 'center',
  },
  errorMsg: {
    margin: '.5rem 0 0',
    color: '#d66a5f',
    fontSize: '.82rem',
    fontWeight: 700,
  },
  successMsg: {
    margin: '.5rem 0 0',
    color: '#6fcf97',
    fontSize: '.82rem',
    fontWeight: 700,
  },
  warningMsg: {
    margin: '.5rem 0 0',
    padding: '.75rem',
    background: 'rgba(247, 183, 51, .1)',
    border: '1px solid rgba(247, 183, 51, .3)',
    borderRadius: '8px',
    color: '#f7b733',
    fontSize: '.82rem',
    fontWeight: 700,
    lineHeight: 1.45,
  },
  primaryButton: {
    width: '100%',
    marginTop: '.85rem',
    padding: '.95rem 1rem',
    background: '#5ba4d4',
    color: '#0a1929',
    border: 'none',
    borderRadius: '8px',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: '.95rem',
    fontWeight: 900,
    cursor: 'pointer',
    boxShadow: '0 4px 18px rgba(91,164,212,.24)',
  },
  // Payment panel styles
  paymentPanel: {
    marginTop: '1rem',
    padding: '1rem',
    background: 'rgba(111,207,151,.06)',
    border: '1px solid rgba(111,207,151,.25)',
    borderRadius: '8px',
  },
  wonTitle: {
    margin: '0 0 .85rem',
    color: '#6fcf97',
    fontSize: '.95rem',
    fontWeight: 900,
    letterSpacing: '.02em',
  },
  wonRow: {
    marginBottom: '.75rem',
  },
  wonAmount: {
    color: '#6fcf97',
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.8rem',
    lineHeight: 1,
  },
  cardInfo: {
    marginBottom: '.75rem',
  },
  cardDetail: {
    margin: '.2rem 0 0',
    color: '#e8edf4',
    fontSize: '.88rem',
    fontWeight: 600,
  },
  cardExp: {
    color: '#7a8fa8',
    fontWeight: 400,
  },
  noCard: {
    margin: '.5rem 0',
    color: '#f7b733',
    fontSize: '.82rem',
    fontWeight: 700,
    lineHeight: 1.45,
  },
  payBtn: {
    background: '#6fcf97',
    boxShadow: '0 4px 18px rgba(111,207,151,.2)',
  },
  paymentDonePanel: {
    marginTop: '1rem',
    padding: '1rem',
    background: 'rgba(111,207,151,.06)',
    border: '1px solid rgba(111,207,151,.2)',
    borderRadius: '8px',
  },
  paymentDoneTitle: {
    margin: '0 0 .4rem',
    color: '#6fcf97',
    fontSize: '.78rem',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '.1em',
  },
  sellerCard: {
    padding: '1.3rem',
    background: '#1a2840',
    border: '1px solid #2a3d58',
    borderRadius: '8px',
  },
  panelTitle: {
    margin: '0 0 1rem',
    color: '#7a8fa8',
    fontSize: '.78rem',
    fontWeight: 900,
    letterSpacing: '.12em',
    textTransform: 'uppercase',
  },
  sellerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '.8rem',
  },
  sellerAvatar: {
    display: 'grid',
    placeItems: 'center',
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    background: '#5ba4d4',
    color: '#e8edf4',
    fontSize: '.82rem',
    fontWeight: 900,
  },
  sellerEmail: {
    color: '#e8edf4',
    fontSize: '.86rem',
  },
  ratingCard: {
    padding: '1.3rem',
    background: '#1a2840',
    border: '1px solid #2a3d58',
    borderRadius: '8px',
  },
  starsRow: {
    display: 'flex',
    gap: '.25rem',
    margin: '.5rem 0 .85rem',
  },
  starActive: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.6rem',
    color: '#f7b733',
    padding: 0,
    lineHeight: 1,
  },
  starInactive: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.6rem',
    color: '#2a3d58',
    padding: 0,
    lineHeight: 1,
  },
  ratingTextarea: {
    width: '100%',
    boxSizing: 'border-box' as const,
    background: '#1e2f47',
    border: '1px solid #2a3d58',
    borderRadius: '8px',
    color: '#e8edf4',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: '.85rem',
    outline: 'none',
    padding: '.6rem .75rem',
    resize: 'vertical' as const,
    minHeight: '72px',
  },
}
