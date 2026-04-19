import { useState } from 'react'
import LoginPage from './pages/login/LoginPage'
import BidderLandingPage from './pages/Landing/BidderLandingPage'
import SellerLandingPage from './pages/Landing/SellerLandingPage'
import HelpdeskLanding from './pages/HelpdeskLanding'
import type { UserRole } from './api/auth'


type Page = 'login' | UserRole

export default function App() {
  const [page, setPage] = useState<Page>('login')
  const [userName, setUserName] = useState('')
  const [role, setRole] = useState<UserRole>('bidder')

  function handleLogin(r: UserRole, email: string) {
    setRole(r)
    setUserName(email)
    setPage(r)
  }

  if (page === 'bidder') return (
    <BidderLandingPage
      userName={userName}
      role={role}
      onNavigate={() => {}}
      onLogout={() => setPage('login')}
    />
  )
  if (page === 'seller') return (
    <SellerLandingPage 
      userName={userName}
      role={role}
      onNavigate={() => {}}
      onLogout={() => setPage('login')}
    />
  )
  if (page === 'helpdesk') return <HelpdeskLanding />
  return <LoginPage onLogin={handleLogin} />
}
