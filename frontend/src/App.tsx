import { useState } from 'react'
import type { UserRole } from './api/auth'
import AccountSettingsPage from './pages/AccountSettingsPage'
import CreateListingPage from './pages/CreateListingPage'
import HelpdeskLanding from './pages/HelpdeskLanding'
import BidderLandingPage from './pages/Landing/BidderLandingPage'
import SellerLandingPage from './pages/Landing/SellerLandingPage'
import LoginPage from './pages/login/LoginPage'

type Page = 'login' | UserRole | 'account' | 'createListing'

export default function App() {
  const [page, setPage] = useState<Page>('login')
  const [userName, setUserName] = useState('')
  const [role, setRole] = useState<UserRole>('bidder')

  function handleLogin(r: UserRole, email: string) {
    setRole(r)
    setUserName(email)
    setPage(r)
  }

  function handleNavigate(dest: 'home' | 'account' | 'helpdesk' | 'createListing') {
    if (dest === 'home') setPage(role)
    else if (dest === 'account') setPage('account')
    else if (dest === 'createListing') setPage('createListing')
    else if (dest === 'helpdesk') setPage('helpdesk')
  }

  function handleLogout() {
    setPage('login')
    setUserName('')
  }

  if (page === 'account') return (
    <AccountSettingsPage
      userName={userName}
      role={role}
      onBack={() => setPage(role)}
    />
  )

  if (page === 'createListing') return (
    <CreateListingPage
      userName={userName}
      onBack={() => setPage(role)}
    />
  )

  if (page === 'bidder') return (
    <BidderLandingPage
      userName={userName}
      role={role}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    />
  )

  if (page === 'seller') return (
    <SellerLandingPage
      userName={userName}
      role={role}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    />
  )

  if (page === 'helpdesk') return <HelpdeskLanding />

  return <LoginPage onLogin={handleLogin} />
}
