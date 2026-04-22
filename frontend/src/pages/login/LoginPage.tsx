import { useState } from 'react'
import { login, register } from '../../api/auth'
import type { UserRole } from '../../api/auth'
import './LoginPage.css'

type Tab = 'signin' | 'register'
type Toast = { message: string; success: boolean } | null

export default function LoginPage({ onLogin }: { onLogin: (roles: UserRole[], email: string) => void }) {
  const [tab, setTab] = useState<Tab>('signin')
  const [toast, setToast] = useState<Toast>(null)

  // sign-in state
  const [siEmail, setSiEmail] = useState('')
  const [siPassword, setSiPassword] = useState('')

  // register state
  const [regRole, setRegRole] = useState<UserRole>('bidder')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  // bidder fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [major, setMajor] = useState('')
  // seller fields
  const [routingNum, setRoutingNum] = useState('')
  const [accountNum, setAccountNum] = useState('')
  // helpdesk fields
  const [position, setPosition] = useState('')

  function showToast(message: string, success: boolean) {
    setToast({ message, success })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleSignIn() {
    if (!siEmail || !siPassword) {
      showToast('Please enter your email and password.', false)
      return
    }
    const data = await login(siEmail, siPassword)
    if (data.success && data.roles && data.roles.length > 0) {
      onLogin(data.roles, siEmail.trim().toLowerCase())
    } else {
      showToast(data.error || 'Invalid email or password.', false)
    }
  }

  async function handleRegister() {
    if (!regEmail || !regPassword) {
      showToast('Email and password are required.', false)
      return
    }
    if (regPassword !== regConfirm) {
      showToast('Passwords do not match.', false)
      return
    }
    if (regRole === 'bidder' && (!firstName || !lastName || !age)) {
      showToast('First name, last name, and age are required.', false)
      return
    }
    if (regRole === 'seller' && (!routingNum || !accountNum)) {
      showToast('Routing number and account number are required.', false)
      return
    }
    if (regRole === 'helpdesk' && !position) {
      showToast('Position is required.', false)
      return
    }

    try {
      const data = await register({
        role: regRole,
        email: regEmail,
        password: regPassword,
        ...(regRole === 'bidder' && { first_name: firstName, last_name: lastName, age: parseInt(age, 10), major: major || undefined }),
        ...(regRole === 'seller' && { bank_routing_number: routingNum, bank_account_number: accountNum }),
        ...(regRole === 'helpdesk' && { position }),
      })

      if (data.success && data.role) {
        showToast('Account created! Please sign in.', true)
        setTimeout(() => setTab('signin'), 1500)
      } else {
        showToast(data.error || 'Registration failed.', false)
      }
    } catch {
      showToast('Registration failed. Please check your connection and try again.', false)
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
                <label htmlFor="si-email">LSU Email Address</label>
                <input
                  type="email"
                  id="si-email"
                  placeholder="yourname@lsu.edu"
                  value={siEmail}
                  onChange={e => setSiEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="si-password">Password</label>
                <input
                  type="password"
                  id="si-password"
                  placeholder="••••••••"
                  value={siPassword}
                  onChange={e => setSiPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                />
              </div>
              <button className="btn-primary" onClick={handleSignIn}>
                Sign In &rarr;
              </button>
            </div>
          ) : (
            <div>
              {/* Role selector */}
              <div className="form-group">
                <label>Account Type</label>
                <div className="tabs" style={{ marginBottom: 0 }}>
                  {(['bidder', 'seller'] as UserRole[]).map(r => (
                    <button
                      key={r}
                      className={`tab-btn${regRole === r ? ' active' : ''}`}
                      onClick={() => setRegRole(r)}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Common fields */}
              <div className="form-group" style={{ marginTop: '1.3rem' }}>
                <label htmlFor="reg-email">LSU Email Address</label>
                <input
                  type="email"
                  id="reg-email"
                  placeholder="yourname@lsu.edu"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                />
              </div>
              <div className="name-row">
                <div className="form-group">
                  <label htmlFor="reg-password">Password</label>
                  <input
                    type="password"
                    id="reg-password"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reg-confirm">Confirm Password</label>
                  <input
                    type="password"
                    id="reg-confirm"
                    placeholder="••••••••"
                    value={regConfirm}
                    onChange={e => setRegConfirm(e.target.value)}
                  />
                </div>
              </div>

              {/* Bidder fields */}
              {regRole === 'bidder' && (
                <>
                  <div className="name-row">
                    <div className="form-group">
                      <label htmlFor="first-name">First Name</label>
                      <input
                        id="first-name"
                        placeholder="Jane"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="last-name">Last Name</label>
                      <input
                        id="last-name"
                        placeholder="Doe"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="name-row">
                    <div className="form-group">
                      <label htmlFor="age">Age</label>
                      <input
                        id="age"
                        type="number"
                        min="16"
                        placeholder="21"
                        value={age}
                        onChange={e => setAge(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="major">Major (optional)</label>
                      <input
                        id="major"
                        placeholder="Computer Science"
                        value={major}
                        onChange={e => setMajor(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Seller fields */}
              {regRole === 'seller' && (
                <>
                  <div className="form-group">
                    <label htmlFor="routing">Bank Routing Number</label>
                    <input
                      id="routing"
                      placeholder="021000021"
                      value={routingNum}
                      onChange={e => setRoutingNum(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="account">Bank Account Number</label>
                    <input
                      id="account"
                      placeholder="123456789"
                      value={accountNum}
                      onChange={e => setAccountNum(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Helpdesk fields */}
              {regRole === 'helpdesk' && (
                <div className="form-group">
                  <label htmlFor="position">Position / Title</label>
                  <input
                    id="position"
                    placeholder="Support Specialist"
                    value={position}
                    onChange={e => setPosition(e.target.value)}
                  />
                </div>
              )}

              <button className="btn-primary" onClick={handleRegister}>
                Create Account &rarr;
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
