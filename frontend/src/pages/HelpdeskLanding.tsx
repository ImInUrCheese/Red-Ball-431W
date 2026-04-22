import { useState, useEffect, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { getTickets, claimTicket, completeTicket, getAllCategories, addCategory } from '../api/helpdesk'
import type { Ticket } from '../api/helpdesk'

interface HelpdeskLandingProps {
  userName: string
  onLogout: () => void
}

type Tab = 'requests' | 'add-category'

export default function HelpdeskLanding({ userName, onLogout }: HelpdeskLandingProps) {
  const [tab, setTab] = useState<Tab>('requests')

  // Requests tab state
  const [mine, setMine] = useState<Ticket[]>([])
  const [unclaimed, setUnclaimed] = useState<Ticket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [ticketMsg, setTicketMsg] = useState('')

  // Add category tab state
  const [categories, setCategories] = useState<string[]>([])
  const [parentCat, setParentCat] = useState('')
  const [childCat, setChildCat] = useState('')
  const [catStatus, setCatStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [catMsg, setCatMsg] = useState('')

  const loadTickets = useCallback(async () => {
    setLoadingTickets(true)
    setTicketMsg('')
    const data = await getTickets(userName)
    setMine(data.mine ?? [])
    setUnclaimed(data.unclaimed ?? [])
    setLoadingTickets(false)
  }, [userName])

  useEffect(() => { loadTickets() }, [loadTickets])

  useEffect(() => {
    if (tab === 'add-category') {
      getAllCategories().then(cats => {
        setCategories(cats)
        setParentCat(cats[0] ?? '')
      })
    }
  }, [tab])

  async function handleClaim(request_id: number) {
    const res = await claimTicket(request_id, userName)
    if (res.success) {
      loadTickets()
    } else {
      setTicketMsg(res.error || 'Failed to claim ticket.')
    }
  }

  async function handleComplete(request_id: number) {
    const res = await completeTicket(request_id)
    if (res.success) {
      loadTickets()
    } else {
      setTicketMsg(res.error || 'Failed to complete ticket.')
    }
  }

  async function handleAddCategory() {
    if (!parentCat || !childCat.trim()) {
      setCatMsg('Both fields are required.')
      setCatStatus('error')
      return
    }
    setCatStatus('submitting')
    setCatMsg('')
    const res = await addCategory(parentCat, childCat.trim())
    if (res.success) {
      setCatStatus('success')
      setCatMsg(`Category "${childCat.trim()}" added under "${parentCat}".`)
      setChildCat('')
      // Refresh category list
      getAllCategories().then(cats => { setCategories(cats) })
    } else {
      setCatStatus('error')
      setCatMsg(res.error || 'Failed to add category.')
    }
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <span style={s.logo}><span style={s.logoAccent}>Nittany</span>Auction</span>
        <div style={s.headerRight}>
          <span style={s.headerUser}>{userName}</span>
          <span style={s.badge}>helpdesk</span>
          <button style={s.logoutBtn} onClick={onLogout}>Logout</button>
        </div>
      </header>

      <main style={s.main}>
        <h1 style={s.title}>Helpdesk Dashboard</h1>

        {/* Tab bar */}
        <div style={s.tabBar}>
          <button
            style={{ ...s.tabBtn, ...(tab === 'requests' ? s.tabBtnActive : {}) }}
            onClick={() => setTab('requests')}
          >
            Current Requests
          </button>
          <button
            style={{ ...s.tabBtn, ...(tab === 'add-category' ? s.tabBtnActive : {}) }}
            onClick={() => setTab('add-category')}
          >
            Add Category
          </button>
        </div>

        {/* ── Current Requests tab ── */}
        {tab === 'requests' && (
          <div>
            {ticketMsg && <p style={s.errorText}>{ticketMsg}</p>}
            {loadingTickets ? (
              <p style={s.muted}>Loading tickets…</p>
            ) : (
              <>
                <Section title="My Tickets" count={mine.length}>
                  {mine.length === 0
                    ? <p style={s.muted}>No tickets assigned to you.</p>
                    : mine.map(t => (
                        <TicketCard
                          key={t.request_id}
                          ticket={t}
                          action={t.request_status === 0
                            ? { label: 'Mark Complete', onClick: () => handleComplete(t.request_id) }
                            : undefined}
                        />
                      ))
                  }
                </Section>

                <Section title="Unclaimed Tickets" count={unclaimed.length}>
                  {unclaimed.length === 0
                    ? <p style={s.muted}>No unclaimed tickets.</p>
                    : unclaimed.map(t => (
                        <TicketCard
                          key={t.request_id}
                          ticket={t}
                          action={{ label: 'Claim', onClick: () => handleClaim(t.request_id) }}
                        />
                      ))
                  }
                </Section>
              </>
            )}
          </div>
        )}

        {/* ── Add Category tab ── */}
        {tab === 'add-category' && (
          <div style={s.catCard}>
            <h2 style={s.cardTitle}>Add a New Category</h2>

            <div style={s.field}>
              <label style={s.label} htmlFor="parent-cat">Parent</label>
              <select
                id="parent-cat"
                style={s.input}
                value={parentCat}
                onChange={e => setParentCat(e.target.value)}
                disabled={catStatus === 'submitting'}
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={s.field}>
              <label style={s.label} htmlFor="child-cat">Child Category</label>
              <input
                id="child-cat"
                style={s.input}
                placeholder="New category name"
                value={childCat}
                onChange={e => { setChildCat(e.target.value); setCatStatus('idle'); setCatMsg('') }}
                disabled={catStatus === 'submitting'}
              />
            </div>

            {catMsg && (
              <p style={catStatus === 'success' ? s.successText : s.errorText}>{catMsg}</p>
            )}

            <button
              style={{ ...s.primaryBtn, opacity: catStatus === 'submitting' ? 0.6 : 1 }}
              onClick={handleAddCategory}
              disabled={catStatus === 'submitting'}
            >
              {catStatus === 'submitting' ? 'Adding…' : 'Add Category'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div style={s.section}>
      <h2 style={s.sectionTitle}>
        {title}
        <span style={s.countBadge}>{count}</span>
      </h2>
      {children}
    </div>
  )
}

function TicketCard({ ticket, action }: {
  ticket: Ticket
  action?: { label: string; onClick: () => void }
}) {
  const statusLabel = ticket.request_status === 1 ? 'Completed' : 'Open'
  const statusStyle = ticket.request_status === 1 ? s.statusDone : s.statusOpen
  return (
    <div style={s.ticketCard}>
      <div style={s.ticketHeader}>
        <span style={s.ticketType}>{ticket.request_type}</span>
        <span style={{ ...s.statusBadge, ...statusStyle }}>{statusLabel}</span>
      </div>
      <p style={s.ticketDesc}>{ticket.request_desc}</p>
      <p style={s.ticketMeta}>From: {ticket.sender_email} &nbsp;·&nbsp; #{ticket.request_id}</p>
      {action && (
        <button style={s.actionBtn} onClick={action.onClick}>{action.label}</button>
      )}
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0b1521',
    color: '#edf3f8',
    fontFamily: 'Inter, "Segoe UI", system-ui, sans-serif',
    textAlign: 'left',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: '56px',
    background: '#0f1e2e',
    borderBottom: '1px solid #1e3048',
  },
  logo: {
    fontFamily: 'Georgia, serif',
    fontSize: '18px',
    fontWeight: 700,
    color: '#edf3f8',
  },
  logoAccent: { color: '#5ba4d4' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  headerUser: { color: '#8fa5ba', fontSize: '14px' },
  badge: {
    padding: '2px 8px',
    background: '#1e3048',
    border: '1px solid #36516d',
    borderRadius: '20px',
    color: '#5ba4d4',
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '.06em',
  },
  logoutBtn: {
    padding: '6px 14px',
    background: 'transparent',
    color: '#8fa5ba',
    border: '1px solid #36516d',
    borderRadius: '6px',
    font: '700 13px Inter, "Segoe UI", system-ui, sans-serif',
    cursor: 'pointer',
  },
  main: {
    width: 'min(860px, calc(100% - 32px))',
    margin: '0 auto',
    padding: '36px 0 56px',
  },
  title: {
    margin: '0 0 24px',
    color: '#edf3f8',
    fontFamily: 'Georgia, serif',
    fontSize: '32px',
    fontWeight: 500,
  },
  tabBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '28px',
    borderBottom: '1px solid #1e3048',
    paddingBottom: '0',
  },
  tabBtn: {
    padding: '10px 20px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#8fa5ba',
    font: '700 14px Inter, "Segoe UI", system-ui, sans-serif',
    cursor: 'pointer',
    marginBottom: '-1px',
  },
  tabBtnActive: {
    color: '#5ba4d4',
    borderBottomColor: '#5ba4d4',
  },
  section: { marginBottom: '36px' },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '0 0 14px',
    color: '#edf3f8',
    fontSize: '16px',
    fontWeight: 800,
  },
  countBadge: {
    padding: '2px 8px',
    background: '#1e3048',
    border: '1px solid #36516d',
    borderRadius: '20px',
    color: '#8fa5ba',
    fontSize: '12px',
    fontWeight: 700,
  },
  ticketCard: {
    padding: '16px',
    marginBottom: '10px',
    background: '#152438',
    border: '1px solid #293d56',
    borderRadius: '8px',
  },
  ticketHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  ticketType: {
    color: '#edf3f8',
    fontSize: '15px',
    fontWeight: 800,
  },
  statusBadge: {
    padding: '2px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '.05em',
  },
  statusOpen: {
    background: '#1a3a2a',
    border: '1px solid #2a6a45',
    color: '#6fcf97',
  },
  statusDone: {
    background: '#1e3048',
    border: '1px solid #36516d',
    color: '#8fa5ba',
  },
  ticketDesc: {
    margin: '0 0 8px',
    color: '#9db0c2',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  ticketMeta: {
    margin: '0 0 10px',
    color: '#4a607a',
    fontSize: '12px',
    fontWeight: 600,
  },
  actionBtn: {
    padding: '6px 16px',
    background: '#5ba4d4',
    color: '#0b1521',
    border: 'none',
    borderRadius: '6px',
    font: '800 13px Inter, "Segoe UI", system-ui, sans-serif',
    cursor: 'pointer',
  },
  muted: {
    color: '#4a607a',
    fontSize: '14px',
    fontStyle: 'italic',
  },
  catCard: {
    maxWidth: '480px',
    padding: '24px',
    background: '#152438',
    border: '1px solid #293d56',
    borderRadius: '8px',
  },
  cardTitle: {
    margin: '0 0 20px',
    color: '#edf3f8',
    fontSize: '18px',
    fontWeight: 800,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    marginBottom: '18px',
  },
  label: {
    color: '#9db0c2',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '.05em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '44px',
    background: '#20334b',
    border: '1px solid #36516d',
    borderRadius: '6px',
    padding: '11px 12px',
    color: '#edf3f8',
    font: '600 14px Inter, "Segoe UI", system-ui, sans-serif',
    outline: 'none',
  },
  primaryBtn: {
    minWidth: '140px',
    minHeight: '44px',
    padding: '10px 18px',
    background: '#5ba4d4',
    color: '#0b1521',
    border: 'none',
    borderRadius: '6px',
    font: '900 14px Inter, "Segoe UI", system-ui, sans-serif',
    cursor: 'pointer',
  },
  successText: {
    margin: '0 0 14px',
    padding: '10px 12px',
    background: '#12324a',
    border: '1px solid #2d6a9f',
    borderRadius: '6px',
    color: '#7dbde8',
    fontSize: '13px',
    fontWeight: 800,
  },
  errorText: {
    margin: '0 0 14px',
    color: '#ff8c8c',
    fontSize: '13px',
    fontWeight: 800,
  },
}
