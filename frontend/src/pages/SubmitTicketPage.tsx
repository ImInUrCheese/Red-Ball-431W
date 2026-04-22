import { useState } from 'react'
import type { CSSProperties } from 'react'
import { submitTicket } from '../api/helpdesk'

interface SubmitTicketPageProps {
  userName: string
  onBack: () => void
}

export default function SubmitTicketPage({ userName, onBack }: SubmitTicketPageProps) {
  const [requestType, setRequestType] = useState('')
  const [requestDesc, setRequestDesc] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit() {
    if (!requestType.trim() || !requestDesc.trim()) {
      setErrorMsg('Both fields are required.')
      setStatus('error')
      return
    }
    setStatus('submitting')
    setErrorMsg('')
    const res = await submitTicket(userName, requestType.trim(), requestDesc.trim())
    if (res.success) {
      setStatus('success')
      setRequestType('')
      setRequestDesc('')
    } else {
      setErrorMsg(res.error || 'Failed to submit ticket.')
      setStatus('error')
    }
  }

  return (
    <div style={s.page}>
      <main style={s.main}>
        <button style={s.backBtn} onClick={onBack}>← Back</button>
        <p style={s.eyebrow}>Support</p>
        <h1 style={s.title}>Submit a Ticket</h1>
        <p style={s.subtitle}>Describe your issue and the helpdesk team will follow up.</p>

        <div style={s.card}>
          <div style={s.field}>
            <label style={s.label} htmlFor="req-type">Request Type</label>
            <input
              id="req-type"
              style={s.input}
              placeholder="e.g. Account Issue, Listing Problem"
              value={requestType}
              onChange={e => setRequestType(e.target.value)}
              disabled={status === 'submitting'}
            />
          </div>

          <div style={s.field}>
            <label style={s.label} htmlFor="req-desc">Description</label>
            <textarea
              id="req-desc"
              style={{ ...s.input, ...s.textarea }}
              placeholder="Please describe your issue in detail."
              value={requestDesc}
              onChange={e => setRequestDesc(e.target.value)}
              disabled={status === 'submitting'}
            />
          </div>

          {status === 'success' && (
            <p style={s.success}>Ticket submitted! The helpdesk team will be in touch.</p>
          )}
          {status === 'error' && <p style={s.error}>{errorMsg}</p>}

          <div style={s.actions}>
            <button
              style={{ ...s.primaryBtn, opacity: status === 'submitting' ? 0.6 : 1 }}
              onClick={handleSubmit}
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Submitting…' : 'Submit Ticket'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

const s: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0b1521',
    color: '#edf3f8',
    fontFamily: 'Inter, "Segoe UI", system-ui, sans-serif',
    textAlign: 'left',
  },
  main: {
    width: 'min(620px, calc(100% - 32px))',
    margin: '0 auto',
    padding: '40px 0 56px',
  },
  backBtn: {
    marginBottom: '16px',
    padding: '6px 12px',
    background: 'transparent',
    color: '#7dbde8',
    border: '1px solid #36516d',
    borderRadius: '6px',
    font: '700 13px Inter, "Segoe UI", system-ui, sans-serif',
    cursor: 'pointer',
  },
  eyebrow: {
    margin: '0 0 8px',
    color: '#5ba4d4',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
  },
  title: {
    margin: '0 0 6px',
    color: '#edf3f8',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '36px',
    fontWeight: 500,
  },
  subtitle: {
    margin: '0 0 28px',
    color: '#8fa5ba',
    fontSize: '15px',
    lineHeight: 1.45,
  },
  card: {
    padding: '24px',
    background: '#152438',
    border: '1px solid #293d56',
    borderRadius: '8px',
    boxShadow: '0 16px 40px rgba(0,0,0,.22)',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    marginBottom: '18px',
  },
  label: {
    color: '#9db0c2',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '.05em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '44px',
    background: '#20334b',
    border: '1px solid #36516d',
    borderRadius: '6px',
    padding: '11px 12px',
    color: '#edf3f8',
    font: '600 14px Inter, "Segoe UI", system-ui, sans-serif',
    outline: 'none',
  },
  textarea: {
    minHeight: '140px',
    lineHeight: 1.5,
    resize: 'vertical',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '4px',
  },
  primaryBtn: {
    minWidth: '140px',
    minHeight: '44px',
    padding: '10px 18px',
    background: '#5ba4d4',
    color: '#0b1521',
    border: 'none',
    borderRadius: '6px',
    font: '900 14px Inter, "Segoe UI", system-ui, sans-serif',
    cursor: 'pointer',
  },
  success: {
    margin: '0 0 14px',
    padding: '12px',
    background: '#12324a',
    border: '1px solid #2d6a9f',
    borderRadius: '6px',
    color: '#7dbde8',
    fontSize: '13px',
    fontWeight: 800,
  },
  error: {
    margin: '0 0 14px',
    color: '#ff8c8c',
    fontSize: '13px',
    fontWeight: 800,
  },
}
