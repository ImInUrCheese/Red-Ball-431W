import { useState } from 'react'
import type { CSSProperties } from 'react'

type Bid = {
  bidder: string
  amount: number
  time: string
  leading?: boolean
}

const bids: Bid[] = [
  { bidder: 'You', amount: 38, time: '2 min ago', leading: true },
  { bidder: 'jordan.t@lsu.edu', amount: 35, time: '11 min ago' },
  { bidder: 'priya.m@lsu.edu', amount: 31, time: '28 min ago' },
  { bidder: 'jordan.t@lsu.edu', amount: 27, time: '1h 4m ago' },
  { bidder: 'carlos.v@lsu.edu', amount: 23, time: '1h 52m ago' },
]

export default function BiddingPage() {
  const [bidAmount, setBidAmount] = useState('')
  const [message, setMessage] = useState('')

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <span style={styles.logoAccent}>Nittany</span>Auction
        </div>
      </nav>

      <main style={styles.main}>
        <p style={styles.breadcrumb}>Browse → Textbooks → Calculus: Early Transcendentals 9th Ed.</p>

        <section style={styles.layout}>
          <div style={styles.leftColumn}>
            <article style={styles.itemCard}>
              <div style={styles.imageFrame} aria-hidden="true">
                <div style={styles.imageSky} />
                <div style={styles.imageMountainLarge} />
                <div style={styles.imageMountainSmall} />
                <div style={styles.imageSun} />
              </div>

              <div style={styles.itemInfo}>
                <div style={styles.badgeRow}>
                  <span style={styles.badge}>Textbooks</span>
                  <span style={styles.status}>Active</span>
                </div>
                <h1 style={styles.title}>Calculus: Early Transcendentals 9th Ed.</h1>
                <p style={styles.meta}>
                  Listed by <span style={styles.seller}>mike.j@lsu.edu</span>
                </p>

                <div style={styles.divider} />

                <p style={styles.description}>
                  <strong>Description:</strong> Item is in good condition with minimal wear.
                  Original packaging included. Pick up available on campus or shipping arranged
                  after payment. All sales are final once auction closes.
                </p>
              </div>
            </article>

            <section style={styles.historyCard}>
              <div style={styles.historyHeader}>
                <h2 style={styles.sectionTitle}>Bid History</h2>
                <span style={styles.muted}>6 bids placed</span>
              </div>

              <div style={styles.bidList}>
                {bids.map((bid) => (
                  <article key={`${bid.bidder}-${bid.amount}`} style={styles.bidRow}>
                    <div style={styles.avatar}>{bid.bidder.charAt(0)}</div>
                    <div style={styles.bidderInfo}>
                      <strong style={styles.bidder}>{bid.bidder}</strong>
                      <span style={styles.bidTime}>{bid.time}</span>
                    </div>
                    <div style={styles.bidAmount}>
                      <strong>${bid.amount}</strong>
                      {bid.leading && <span style={styles.leading}>Leading</span>}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside style={styles.rightColumn}>
            <section style={styles.bidPanel}>
              <div style={styles.timerBox}>
                <span style={styles.timerLabel}>Auction Ends In</span>
                <strong style={styles.timer}>2:14:38</strong>
              </div>

              <div style={styles.stats}>
                <div>
                  <span style={styles.statLabel}>Current Top Bid</span>
                  <strong style={styles.topBid}>$38</strong>
                </div>
                <div style={styles.statRight}>
                  <span style={styles.statLabel}>Total Bids</span>
                  <strong style={styles.totalBids}>7</strong>
                </div>
              </div>

              <p style={styles.minimumBid}>Minimum next bid: <strong>$39</strong></p>

              <label style={styles.inputGroup}>
                <span style={styles.inputLabel}>Your Bid Amount ($)</span>
                <input
                  style={styles.input}
                  type="number"
                  min="39"
                  placeholder="39+"
                  value={bidAmount}
                  onChange={(event) => setBidAmount(event.target.value)}
                />
              </label>

              <button style={styles.primaryButton}>Place Bid →</button>
            </section>

            <section style={styles.sellerCard}>
              <h2 style={styles.panelTitle}>Seller Info</h2>
              <div style={styles.sellerRow}>
                <div style={styles.sellerAvatar}>M</div>
                <div>
                  <strong style={styles.sellerEmail}>mike.j@lsu.edu</strong>
                  <p style={styles.rating}>★ ★ ★ ★ ☆ 4.0 (14 ratings)</p>
                </div>
              </div>

              <div style={styles.divider} />

              <label style={styles.inputGroup}>
                <span style={styles.inputLabel}>Ask The Seller</span>
                <div style={styles.askRow}>
                  <input
                    style={styles.askInput}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                  />
                  <button style={styles.sendButton}>Send</button>
                </div>
              </label>
            </section>
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
  leftColumn: {
    display: 'grid',
    gap: '1rem',
  },
  rightColumn: {
    display: 'grid',
    gap: '1rem',
  },
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
    background:
      'linear-gradient(45deg, rgba(255,255,255,.08) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,.08) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,.08) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,.08) 75%)',
    backgroundColor: '#26364b',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
    backgroundSize: '20px 20px',
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
  itemInfo: {
    minWidth: 0,
  },
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
  status: {
    padding: '.28rem .7rem',
    background: 'rgba(111, 207, 151, .12)',
    borderRadius: '8px',
    color: '#6fcf97',
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
  seller: {
    color: '#7dbde8',
  },
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
  bidList: {
    display: 'grid',
    gap: '.35rem',
  },
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
  bidderInfo: {
    display: 'grid',
    minWidth: 0,
  },
  bidder: {
    overflow: 'hidden',
    color: '#e8edf4',
    fontSize: '.83rem',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  bidTime: {
    color: '#7a8fa8',
    fontSize: '.72rem',
    fontWeight: 700,
  },
  bidAmount: {
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
  timerBox: {
    display: 'grid',
    justifyItems: 'center',
    gap: '.55rem',
    padding: '1.2rem',
    background: '#242d43',
    border: '1px solid #2a3d58',
    borderRadius: '8px',
  },
  timerLabel: {
    color: '#7a8fa8',
    fontSize: '.72rem',
    fontWeight: 900,
    letterSpacing: '.12em',
    textTransform: 'uppercase',
  },
  timer: {
    color: '#d66a5f',
    fontFamily: "'Playfair Display', serif",
    fontSize: '2rem',
    letterSpacing: '.16em',
    lineHeight: 1,
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginTop: '1.25rem',
  },
  statRight: {
    textAlign: 'right',
  },
  statLabel: {
    display: 'block',
    color: '#7a8fa8',
    fontSize: '.72rem',
    fontWeight: 800,
    marginBottom: '.25rem',
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
  inputGroup: {
    display: 'grid',
    gap: '.55rem',
  },
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
  rating: {
    margin: '.2rem 0 0',
    color: '#7dbde8',
    fontSize: '.76rem',
    fontWeight: 700,
  },
  askRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 62px',
    gap: '.5rem',
  },
  askInput: {
    minWidth: 0,
    height: '42px',
    boxSizing: 'border-box',
    background: '#1e2f47',
    border: '1px solid #2a3d58',
    borderRadius: '8px',
    color: '#e8edf4',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    outline: 'none',
    padding: '0 .85rem',
  },
  sendButton: {
    background: 'transparent',
    color: '#7dbde8',
    border: '1px solid #5ba4d4',
    borderRadius: '8px',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: '.8rem',
    fontWeight: 900,
    cursor: 'pointer',
  },
}
