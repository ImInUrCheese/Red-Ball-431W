import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { UserRole } from './api/auth'
import AccountSettingsPage from './pages/AccountSettingsPage'
import BidderLanding from './pages/BidderLanding'
import CreateListingPage from './pages/CreateListingPage'
import HelpdeskLanding from './pages/HelpdeskLanding'
import LoginPage from './pages/login/LoginPage'
import SellerLanding from './pages/SellerLanding'

type DemoPage = 'createListing' | 'accountSettings'
type Page = 'login' | UserRole | DemoPage

const demoPages: { id: DemoPage; label: string; hash: string }[] = [
  { id: 'createListing', label: 'Create Listing', hash: '#create-listing' },
  { id: 'accountSettings', label: 'Account Settings', hash: '#account-settings' },
]

function getInitialPage(): Page {
  if (window.location.hash === '#create-listing') return 'createListing'
  if (window.location.hash === '#account-settings') return 'accountSettings'
  return 'login'
}

export default function App() {
  const [page, setPage] = useState<Page>(getInitialPage)

  function openPage(nextPage: Page, hash = '') {
    window.history.replaceState(null, '', hash || window.location.pathname)
    setPage(nextPage)
  }

  if (page === 'bidder') return <BidderLanding />
  if (page === 'seller') return <SellerLanding />
  if (page === 'helpdesk') return <HelpdeskLanding />

  if (page === 'createListing' || page === 'accountSettings') {
    return (
      <div style={styles.shell}>
        <nav style={styles.nav}>
          <button
            type="button"
            style={styles.loginButton}
            onClick={() => openPage('login')}
          >
            Back to Login
          </button>

          <div style={styles.switcher} aria-label="Demo pages">
            {demoPages.map((demoPage) => (
              <button
                key={demoPage.id}
                type="button"
                style={{
                  ...styles.switchButton,
                  ...(page === demoPage.id ? styles.switchButtonActive : {}),
                }}
                onClick={() => openPage(demoPage.id, demoPage.hash)}
              >
                {demoPage.label}
              </button>
            ))}
          </div>
        </nav>

        {page === 'createListing' && <CreateListingPage />}
        {page === 'accountSettings' && <AccountSettingsPage />}
      </div>
    )
  }

  return <LoginPage onLogin={(role) => openPage(role)} />
}

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: '100vh',
    background: '#0b1521',
  },
  nav: {
    minHeight: '62px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '10px 24px',
    background: '#101d2d',
    borderBottom: '1px solid #293d56',
    boxSizing: 'border-box',
  },
  loginButton: {
    minHeight: '36px',
    padding: '8px 12px',
    background: 'transparent',
    color: '#edf3f8',
    border: '1px solid #36516d',
    borderRadius: '6px',
    font: '800 13px Inter, "Segoe UI", system-ui, sans-serif',
    cursor: 'pointer',
  },
  switcher: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  switchButton: {
    minHeight: '36px',
    padding: '8px 12px',
    background: '#20334b',
    color: '#9db0c2',
    border: '1px solid #36516d',
    borderRadius: '6px',
    font: '800 13px Inter, "Segoe UI", system-ui, sans-serif',
    cursor: 'pointer',
  },
  switchButtonActive: {
    background: '#5ba4d4',
    borderColor: '#5ba4d4',
    color: '#0b1521',
  },
}
