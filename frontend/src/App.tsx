import { useEffect, useState } from 'react'
import { getMe, logout as apiLogout } from './api/auth'
import type { UserRole } from './api/auth'
import AccountSettingsPage from './pages/AccountSettingsPage'
import BiddingPage from './pages/BiddingPage'
import CreateListingPage from './pages/CreateListingPage'
import HelpdeskLanding from './pages/HelpdeskLanding'
import SubmitTicketPage from './pages/SubmitTicketPage'
import RolePickerPage from './pages/login/RolePickerPage'
import BidderLandingPage from './pages/Landing/BidderLandingPage'
import SellerLandingPage from './pages/Landing/SellerLandingPage'
import LoginPage from './pages/login/LoginPage'

type Page = 'login' | 'rolePicker' | UserRole | 'account' | 'createListing' | 'bidding' | 'submitTicket'

export default function App() {
  const [page, setPage] = useState<Page>('login')
  const [userName, setUserName] = useState('')
  const [role, setRole] = useState<UserRole>('bidder')
  const [pendingRoles, setPendingRoles] = useState<UserRole[]>([])
  const [checking, setChecking] = useState(true)
  const [selectedListing, setSelectedListing] = useState<{ sellerEmail: string; listingId: number } | null>(null)
  const [listingRefreshKey, setListingRefreshKey] = useState(0)

  // On start check if the user has an active session and skip the login 
  useEffect(() => {
    getMe().then(data => {
      if (data.success && data.email && data.role) {
        setUserName(data.email)
        setRole(data.role)
        setPage(data.role)
      }
    }).finally(() => setChecking(false))
  }, [])


  // handels the login 
  function handleLogin(roles: UserRole[], email: string) {
    setUserName(email)
    if (roles.length === 1) {
      setRole(roles[0])
      setPage(roles[0])
    } else {
      setPendingRoles(roles)
      setPage('rolePicker')
    }
  }

  // select landing page
  function handleRoleSelected(r: UserRole) {
    setRole(r)
    setPendingRoles([])
    setPage(r)
  }

  function handleNavigate(dest: 'home' | 'account' | 'helpdesk' | 'createListing') {
    if (dest === 'home') setPage(role)
    else if (dest === 'account') setPage('account')
    else if (dest === 'createListing') setPage('createListing')
    else if (dest === 'helpdesk') setPage('submitTicket')
  }

  // handels bid now
  function handleBidNow(sellerEmail: string, listingId: number) {
    setSelectedListing({ sellerEmail, listingId })
    setPage('bidding')
  }

  // handels logout 
  async function handleLogout() {
    await apiLogout()
    setPage('login')
    setUserName('')
    setPendingRoles([])
  }

  if (checking) return null

  if (page === 'rolePicker') return (
    <RolePickerPage
      email={userName}
      roles={pendingRoles}
      onRoleSelected={handleRoleSelected}
    />
  )

  if (page === 'bidding' && selectedListing) return (
    <BiddingPage
      sellerEmail={selectedListing.sellerEmail}
      listingId={selectedListing.listingId}
      userName={userName}
      onBack={() => { setListingRefreshKey(k => k + 1); setPage(role) }}
    />
  )

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
      onBidNow={handleBidNow}
      refreshKey={listingRefreshKey}
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

  if (page === 'submitTicket') return (
    <SubmitTicketPage
      userName={userName}
      onBack={() => setPage(role)}
    />
  )

  if (page === 'helpdesk') return (
    <HelpdeskLanding
      userName={userName}
      onLogout={handleLogout}
    />
  )

  return <LoginPage onLogin={handleLogin} />
}
