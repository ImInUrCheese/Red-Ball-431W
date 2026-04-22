import { useState } from 'react'
import { selectRole } from '../../api/auth'
import type { UserRole } from '../../api/auth'
import './LoginPage.css'

const ROLE_LABELS: Record<UserRole, string> = {
  bidder: 'Bidder',
  seller: 'Seller',
  helpdesk: 'Helpdesk Staff',
}

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  bidder: 'Browse listings and place bids',
  seller: 'Manage your auction listings',
  helpdesk: 'View and resolve support tickets',
}

interface RolePickerPageProps {
  email: string
  roles: UserRole[]
  onRoleSelected: (role: UserRole) => void
}

export default function RolePickerPage({ email, roles, onRoleSelected }: RolePickerPageProps) {
  const [selected, setSelected] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    if (!selected) return
    setLoading(true)
    setError('')
    const res = await selectRole(selected)
    if (res.success && res.role) {
      onRoleSelected(res.role)
    } else {
      setError(res.error || 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div className="login-body">
      <nav className="login-nav">
        <div className="nav-logo"><span>Nittany</span>Auction</div>
      </nav>

      <main className="login-main">
        <div className="hero">
          <h1><span>Nittany</span>Auction</h1>
          <p>Select how you want to sign in</p>
        </div>

        <div className="card">
          <p style={{ margin: '0 0 1.4rem', color: 'var(--text-muted)', fontSize: '.9rem', textAlign: 'center' }}>
            <strong style={{ color: 'var(--text-white)' }}>{email}</strong> is registered under multiple roles.<br />
            Choose which account to continue with.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginBottom: '1.4rem' }}>
            {roles.map(role => (
              <button
                key={role}
                onClick={() => setSelected(role)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '.25rem',
                  padding: '1rem 1.2rem',
                  background: selected === role ? 'var(--gold-muted)' : 'var(--bg-input)',
                  border: `1px solid ${selected === role ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all .18s ease',
                  textAlign: 'left',
                  width: '100%',
                  boxShadow: selected === role ? '0 0 0 3px rgba(91,164,212,.15)' : 'none',
                }}
              >
                <span style={{ color: 'var(--text-white)', fontWeight: 700, fontSize: '1rem', fontFamily: 'DM Sans, sans-serif' }}>
                  {ROLE_LABELS[role]}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '.82rem', fontFamily: 'DM Sans, sans-serif' }}>
                  {ROLE_DESCRIPTIONS[role]}
                </span>
              </button>
            ))}
          </div>

          {error && (
            <p style={{ margin: '0 0 1rem', color: '#eb5757', fontSize: '.87rem', fontWeight: 600 }}>{error}</p>
          )}

          <button
            className="btn-primary"
            onClick={handleConfirm}
            disabled={!selected || loading}
            style={{ opacity: !selected || loading ? 0.5 : 1 }}
          >
            {loading ? 'Signing in…' : `Continue as ${selected ? ROLE_LABELS[selected] : '…'}`}
          </button>
        </div>
      </main>
    </div>
  )
}
