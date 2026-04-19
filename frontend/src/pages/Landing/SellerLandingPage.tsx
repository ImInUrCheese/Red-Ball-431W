import { useState } from 'react'
import Header from './LandingPageHeader'
import type { Notification } from './LandingPageHeader'
import type { UserRole } from '../../api/auth'
import './SellerLandingPage.css'

// ── Types ────────────────────────────────────────────────────

interface ActiveListing {
  id: string
  title: string
  category: string
  endsAt: string
  topBid: number
  reservePrice: number
  numBids: number
  unansweredQuestions: number
}

interface SaleRecord {
  id: string
  title: string
  category: string
  finalBid: number
  date: string
  status: 'sold' | 'pending' | 'unsold'
}

interface PendingQuestion {
  id: string
  listingTitle: string
  from: string
  question: string
}

// ── Mock data ─────────────────────────────────────────────────
// TODO: Replace with API calls to productService, bidService, and sellerService
//
// When implemented:
//   const [activeListings, setActiveListings] = useState<ActiveListing[]>([])
//   useEffect(() => {
//     sellerService.getMyListings({ status: 'active' }).then(setActiveListings)
//   }, [])
//
//   const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([])
//   useEffect(() => {
//     sellerService.getSalesHistory().then(setSalesHistory)
//   }, [])
//
//   const [questions, setQuestions] = useState<PendingQuestion[]>([])
//   useEffect(() => {
//     sellerService.getPendingQuestions().then(setQuestions)
//   }, [])

const MOCK_LISTINGS: ActiveListing[] = [
  { id: '1', title: 'MacBook Pro 2021 — 14 inch, M1 Pro', category: 'Electronics', endsAt: '5h 2m left',   topBid: 920, reservePrice: 800, numBids: 12, unansweredQuestions: 2 },
  { id: '2', title: 'Standing Desk — Adjustable Height',  category: 'Furniture',   endsAt: '23h 45m left', topBid: 210, reservePrice: 150, numBids: 8,  unansweredQuestions: 0 },
]

const MOCK_HISTORY: SaleRecord[] = [
  { id: 'h1', title: 'Calculus Textbook 9th Ed.',  category: 'Textbooks',    finalBid: 38,  date: 'Apr 10, 2026', status: 'sold'    },
  { id: 'h2', title: 'Ergonomic Desk Chair',        category: 'Furniture',    finalBid: 145, date: 'Mar 28, 2026', status: 'sold'    },
  { id: 'h3', title: 'Dorm Room Desk Lamp',         category: 'Furniture',    finalBid: 12,  date: 'Mar 15, 2026', status: 'unsold'  },
  { id: 'h4', title: 'Physics Lab Kit',             category: 'Lab Supplies', finalBid: 55,  date: 'Mar 3, 2026',  status: 'pending' },
]

const MOCK_QUESTIONS: PendingQuestion[] = [
  { id: 'q1', listingTitle: 'MacBook Pro 2021', from: 'jordan.t@lsu.edu', question: 'Does the battery hold a full charge? Any signs of wear on the keyboard?' },
  { id: 'q2', listingTitle: 'MacBook Pro 2021', from: 'priya.m@lsu.edu',  question: 'Is shipping available or pickup only?' },
]

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', message: 'Your listing "Standing Desk" received a bid of $210!', won: true, seen: false },
]

// ── Helpers ──────────────────────────────────────────────────

const STATUS_LABEL: Record<SaleRecord['status'], string> = {
  sold:    'Sold',
  pending: 'Pending Payment',
  unsold:  'Not Sold',
}

// ── Props ────────────────────────────────────────────────────

interface SellerPageProps {
  userName: string
  role: UserRole
  onNavigate: (page: 'home' | 'account' | 'helpdesk') => void
  onLogout: () => void
}

// ── Component ────────────────────────────────────────────────

export default function SellerPage({ userName, role, onNavigate, onLogout }: SellerPageProps) {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)
  const [questions, setQuestions]         = useState<PendingQuestion[]>(MOCK_QUESTIONS)
  const [answers, setAnswers]             = useState<Record<string, string>>({})

  function dismissNotification(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, seen: true } : n))
  }

  function handleAnswerChange(qId: string, value: string) {
    setAnswers(prev => ({ ...prev, [qId]: value }))
  }

  function handleSendAnswer(qId: string) {
    // TODO: Wire to sellerService.answerQuestion(qId, answers[qId])
    //
    // When implemented:
    //   sellerService.answerQuestion(qId, answers[qId])
    //     .then(() => setQuestions(prev => prev.filter(q => q.id !== qId)))
    //     .catch(err => console.error('Failed to send answer:', err))
    if (!answers[qId]?.trim()) return
    setQuestions(prev => prev.filter(q => q.id !== qId))
    setAnswers(prev => { const n = { ...prev }; delete n[qId]; return n })
  }

  // Initials for avatar
  const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

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
            {/* TODO: Pull rating from sellerService.getMyRating()
                When implemented:
                const [rating, setRating] = useState<{ avg: number; count: number } | null>(null)
                useEffect(() => { sellerService.getMyRating().then(setRating) }, [])
                Then render: rating.avg and rating.count below
            */}
            <div className="seller-rating">
              <span className="stars">★★★★☆</span>
              <span>4.0 (14 ratings)</span>
            </div>
          </div>
        </div>

        {/* TODO: Navigate to List an Item page
            When implemented: onClick={() => onNavigate('list-item')
        */}
        <button className="list-item-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          List an Item
        </button>
      </div>

      {/* ── Main two-column layout ── */}
      <div className="seller-content">

        {/* ── Left: Active listings + Sales history ── */}
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
                    <th>Time Left</th>
                    <th>Top Bid</th>
                    <th>Bids</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {/* TODO: Replace MOCK_LISTINGS with activeListings from sellerService.getMyListings() */}
                  {MOCK_LISTINGS.map(listing => (
                    <tr
                      key={listing.id}
                      className="table-row-clickable"
                      // TODO: onClick={() => onNavigate(`/listing/${listing.id}`)}
                    >
                      <td className="td-title">
                        {listing.title}
                        {listing.unansweredQuestions > 0 && (
                          <span className="q-badge">❓ {listing.unansweredQuestions} question{listing.unansweredQuestions > 1 ? 's' : ''}</span>
                        )}
                      </td>
                      <td>{listing.category}</td>
                      <td>{listing.endsAt}</td>
                      <td className="td-amount">${listing.topBid}</td>
                      <td>{listing.numBids}</td>
                      <td>
                        <span className={`status-pill ${listing.topBid >= listing.reservePrice ? 'status-sold' : 'status-unsold'}`}>
                          {listing.topBid >= listing.reservePrice ? 'Above Reserve' : 'Below Reserve'}
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
                    <th>Final Bid</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {/* TODO: Replace MOCK_HISTORY with salesHistory from sellerService.getSalesHistory() */}
                  {MOCK_HISTORY.map(record => (
                    <tr key={record.id}>
                      <td className="td-title">{record.title}</td>
                      <td>{record.category}</td>
                      <td className="td-amount">${record.finalBid}</td>
                      <td>{record.date}</td>
                      <td><span className={`status-pill status-${record.status}`}>{STATUS_LABEL[record.status]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Right: Pending questions ── */}
        <aside className="questions-col">
          <h2 className="section-heading">Pending Questions</h2>

          {/* TODO: Replace MOCK_QUESTIONS with questions from sellerService.getPendingQuestions()
              When implemented:
              const [questions, setQuestions] = useState<PendingQuestion[]>([])
              useEffect(() => {
                sellerService.getPendingQuestions().then(setQuestions)
              }, [])
          */}
          {questions.length === 0 ? (
            <div className="no-questions">No pending questions 🎉</div>
          ) : (
            questions.map(q => (
              <div key={q.id} className="q-card">
                <div className="q-card-meta">
                  <span className="q-listing-name">{q.listingTitle}</span>
                  <span className="q-from">{q.from}</span>
                </div>
                <p className="q-text">{q.question}</p>
                <div className="q-answer-wrap">
                  <input
                    className="q-answer-input"
                    type="text"
                    placeholder="Type your answer…"
                    value={answers[q.id] || ''}
                    onChange={e => handleAnswerChange(q.id, e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendAnswer(q.id)}
                  />
                  <button className="q-send-btn" onClick={() => handleSendAnswer(q.id)}>Send</button>
                </div>
              </div>
            ))
          )}
        </aside>
      </div>
    </div>
  )
}