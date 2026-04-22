export interface Ticket {
  request_id: number
  sender_email: string
  helpdesk_staff_email: string
  request_type: string
  request_desc: string
  request_status: number
}

export async function submitTicket(
  sender_email: string,
  request_type: string,
  request_desc: string,
): Promise<{ success: boolean; request_id?: number; error?: string }> {
  const res = await fetch('/api/helpdesk/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender_email, request_type, request_desc }),
  })
  return res.json()
}

export async function getTickets(
  staff_email: string,
): Promise<{ mine: Ticket[]; unclaimed: Ticket[] }> {
  const res = await fetch(`/api/helpdesk/tickets?staff_email=${encodeURIComponent(staff_email)}`)
  return res.json()
}

export async function claimTicket(
  request_id: number,
  staff_email: string,
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`/api/helpdesk/tickets/${request_id}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staff_email }),
  })
  return res.json()
}

export async function completeTicket(
  request_id: number,
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`/api/helpdesk/tickets/${request_id}/complete`, {
    method: 'POST',
  })
  return res.json()
}

export async function getAllCategories(): Promise<string[]> {
  const res = await fetch('/api/helpdesk/categories')
  return res.json()
}

export async function addCategory(
  parent_category: string,
  category_name: string,
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch('/api/helpdesk/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parent_category, category_name }),
  })
  return res.json()
}
