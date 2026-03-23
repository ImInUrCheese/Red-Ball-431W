import { useState } from 'react'
import { login } from '../../api/auth'
import type { UserRole } from '../../api/auth'
import './LoginPage.css'

type Tab = 'signin' | 'register'
type Toast = { message: string; success: boolean } | null

export default function LoginPage({ onLogin }: { onLogin: (role: UserRole) => void }) {
  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [toast, setToast] = useState<Toast>(null)

  function showToast(message: string, success: boolean) {
    setToast({ message, success })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleSignIn() {
    if (!email || !password) {
      showToast('Please enter your email and password.', false)
      return
    }
    const data = await login(email, password)
    if (data.success && data.role) {
      onLogin(data.role)
    } else {
      showToast(data.error || 'Invalid email or password.', false)
    }
  }

  return (
    <div className="login-body">
      <nav className="login-nav">
        <div className="nav-logo"><span>Nittany</span>Auction</div>
      </nav>

      {toast && (
        <div className={`toast ${toast.success ? 'toast-success' : 'toast-error'}`}>
          {toast.message}
        </div>
      )}

      <main className="login-main">
        <div className="hero">
          <h1><span>Nittany</span>Auction</h1>
          <p>Lion State University Marketplace</p>
        </div>

        <div className="card">
          <div className="tabs" role="tablist">
            <button
              className={`tab-btn${tab === 'signin' ? ' active' : ''}`}
              role="tab"
              aria-selected={tab === 'signin'}
              onClick={() => setTab('signin')}
            >
              Sign In
            </button>
            <button
              className={`tab-btn${tab === 'register' ? ' active' : ''}`}
              role="tab"
              aria-selected={tab === 'register'}
              onClick={() => setTab('register')}
            >
              Register
            </button>
          </div>

          {tab === 'signin' ? (
            <div>
              <div className="form-group">
                <label htmlFor="email">LSU Email Address</label>
                <input
                  type="email"
                  id="email"
                  placeholder="yourname@lsu.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <button className="btn-primary" onClick={handleSignIn}>
                Sign In &rarr;
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '1.1rem', letterSpacing: '.05em' }}>
              Coming Soon
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
