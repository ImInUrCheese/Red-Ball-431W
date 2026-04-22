import { useState, useRef, useEffect } from 'react'
import type { UserRole } from '../../api/auth'
import { getProfile } from '../../api/user'
import './LandingPageHeader.css'

// ── Types ────────────────────────────────────────────────────

export interface Notification {
  id: string
  message: string
  won: boolean
  seen: boolean
}

interface HeaderProps {
  userName: string
  role: UserRole
  notifications?: Notification[]
  onDismissNotification?: (id: string) => void
  onNavigate: (page: 'home' | 'account' | 'helpdesk') => void
  onLogout: () => void
}

// ── Component ────────────────────────────────────────────────

export default function Header({
  userName,
  role,
  notifications = [],
  onDismissNotification,
  onNavigate,
  onLogout,
}: HeaderProps) {
  const [bellOpen, setBellOpen] = useState(false)
  const [displayName, setDisplayName] = useState<string>(userName)
  const bellRef = useRef<HTMLDivElement>(null)
  const unseenCount = notifications.filter(n => !n.seen).length

  useEffect(() => {
    getProfile().then(p => {
      if (p.first_name || p.last_name) {
        setDisplayName([p.first_name, p.last_name].filter(Boolean).join(' '))
      }
    }).catch(() => {})
  }, [userName])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="site-header">

      {/* Left — logo */}
      <div className="header-left">
        <button className="header-logo" onClick={() => onNavigate('home')}>
          <span>Nittany</span>Auction
        </button>
      </div>

      {/* Center — name + role */}
      <div className="header-center">
        <span className="header-username">{displayName}</span>
        <span className="header-role-badge">{role}</span>
      </div>

      {/* Right — actions */}
      <div className="header-right">

        {/* Notification bell — bidders & sellers only */}
        {role !== 'helpdesk' && (
          <div className="bell-wrap" ref={bellRef}>
            <button
              className={`header-action-btn bell-btn ${bellOpen ? 'active' : ''}`}
              onClick={() => setBellOpen(o => !o)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span>Notifications</span>
              {unseenCount > 0 && <span className="bell-badge">{unseenCount}</span>}
            </button>

            {bellOpen && (
              <div className="notif-dropdown">
                <p className="notif-dropdown-title">Notifications</p>
                {notifications.length === 0 ? (
                  <p className="notif-empty">No notifications.</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`notif-item ${n.seen ? 'seen' : ''}`}>
                      <span className="notif-msg">{n.message}</span>
                      {!n.seen && onDismissNotification && (
                        <button className="notif-mark" onClick={() => onDismissNotification(n.id)}>✕</button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* HelpDesk Request */}
        {role !== 'helpdesk' && (
          <button className="header-action-btn" onClick={() => onNavigate('helpdesk')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <circle cx="12" cy="17" r=".5" fill="currentColor"/>
            </svg>
            <span>Help</span>
          </button>
        )}

        {/* Account Settings */}
        {/* TODO: Navigate to AccountSettingsPage
            When implemented: onNavigate('account') should route to AccountSettingsPage
            which handles profile, payment info (bidders), and banking info (sellers)
        */}
        <button className="header-action-btn" onClick={() => onNavigate('account')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          <span>Account</span>
        </button>

        {/* Logout */}
        <button className="header-action-btn header-logout" onClick={onLogout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </header>
  )
}