import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

type Listing = {
  id: number
  title: string
  price: number
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch('/api/listings')

        if (!res.ok) {
          throw new Error('Unable to load listings.')
        }

        const data: Listing[] = await res.json()
        setListings(data)
      } catch {
        setError('Unable to load listings. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [])

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <span style={styles.logoAccent}>Nittany</span>Auction
        </div>
      </nav>

      <main style={styles.main}>
        <section style={styles.header}>
          <h1 style={styles.title}>Listings</h1>
          <p style={styles.subtitle}>Lion State University Marketplace</p>
        </section>

        {loading && <p style={styles.message}>Loading listings...</p>}

        {error && !loading && <p style={styles.error}>{error}</p>}

        {!loading && !error && listings.length === 0 && (
          <p style={styles.message}>No listings available.</p>
        )}

        {!loading && !error && listings.length > 0 && (
          <div style={styles.grid}>
            {listings.map((listing) => (
              <article key={listing.id} style={styles.card}>
                <div>
                  <h2 style={styles.cardTitle}>{listing.title}</h2>
                  <p style={styles.price}>${listing.price.toFixed(2)}</p>
                </div>
                <button style={styles.button}>View</button>
              </article>
            ))}
          </div>
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
    height: '58px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 2rem',
    background: '#141f30',
    borderBottom: '1px solid #2a3d58',
  },
  logo: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.2rem',
    color: '#e8edf4',
  },
  logoAccent: {
    color: '#5ba4d4',
  },
  main: {
    width: 'min(1120px, calc(100% - 2rem))',
    margin: '0 auto',
    padding: '3rem 0 4rem',
  },
  header: {
    marginBottom: '2rem',
    textAlign: 'center',
  },
  title: {
    margin: 0,
    color: '#e8edf4',
    fontFamily: "'Playfair Display', serif",
    fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
    lineHeight: 1,
  },
  subtitle: {
    marginTop: '.65rem',
    color: '#7a8fa8',
    fontSize: '.85rem',
    fontWeight: 300,
    letterSpacing: '.12em',
    textTransform: 'uppercase',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1rem',
  },
  card: {
    minHeight: '150px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '1.5rem',
    padding: '1.4rem',
    background: '#1a2840',
    border: '1px solid #2a3d58',
    borderRadius: '8px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, .25)',
  },
  cardTitle: {
    margin: 0,
    color: '#e8edf4',
    fontSize: '1.1rem',
    fontWeight: 600,
    lineHeight: 1.25,
  },
  price: {
    marginTop: '.65rem',
    color: '#7dbde8',
    fontSize: '1.25rem',
    fontWeight: 700,
  },
  button: {
    width: '100%',
    padding: '.85rem 1rem',
    background: '#5ba4d4',
    color: '#0a1929',
    border: 'none',
    borderRadius: '8px',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: '.95rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  message: {
    color: '#7a8fa8',
    textAlign: 'center',
    fontSize: '1rem',
  },
  error: {
    maxWidth: '540px',
    margin: '0 auto',
    padding: '.85rem 1rem',
    background: '#3a1a1a',
    border: '1px solid #6a2a2a',
    borderRadius: '8px',
    color: '#eb5757',
    textAlign: 'center',
  },
}
