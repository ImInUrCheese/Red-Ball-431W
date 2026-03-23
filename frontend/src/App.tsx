import { useState } from 'react'
import LoginPage from './pages/login/LoginPage'
import BidderLanding from './pages/BidderLanding'
import SellerLanding from './pages/SellerLanding'
import HelpdeskLanding from './pages/HelpdeskLanding'
import type { UserRole } from './api/auth'

type Page = 'login' | UserRole

export default function App() {
  const [page, setPage] = useState<Page>('login')

  if (page === 'bidder') return <BidderLanding />
  if (page === 'seller') return <SellerLanding />
  if (page === 'helpdesk') return <HelpdeskLanding />
  return <LoginPage onLogin={(role) => setPage(role)} />
}
