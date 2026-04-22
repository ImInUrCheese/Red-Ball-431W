import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { getProfile, getPaymentInfo, updateProfile, changePassword } from '../api/user'

type SettingsTab = 'profile' | 'payment' | 'sellerInfo' | 'password'

const allTabs: { id: SettingsTab; icon: string; label: string; roles: string[] }[] = [
  { id: 'profile',    icon: 'P', label: 'Profile',     roles: ['bidder', 'seller', 'helpdesk'] },
  { id: 'payment',    icon: '$', label: 'Payment',     roles: ['bidder'] },
  { id: 'sellerInfo', icon: 'S', label: 'Seller Info', roles: ['seller'] },
  { id: 'password',   icon: '*', label: 'Password',    roles: ['bidder', 'seller', 'helpdesk'] },
]

interface AccountSettingsProps {
  userName: string
  role: 'bidder' | 'seller' | 'helpdesk'
  onBack: () => void
}

type StatusState = { msg: string; ok: boolean } | null

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  )
}

export default function AccountSettingsPage({ userName, role, onBack }: AccountSettingsProps) {
  const tabs = allTabs.filter(t => t.roles.includes(role))
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  // Profile state
  const [firstName, setFirstName]   = useState('')
  const [lastName, setLastName]     = useState('')
  const [age, setAge]               = useState('')
  const [major, setMajor]           = useState('')
  const [routing, setRouting]       = useState('')
  const [account, setAccount]       = useState('')
  const [profileStatus, setProfileStatus] = useState<StatusState>(null)
  const [saving, setSaving]         = useState(false)

  // Payment (read-only)
  const [payment, setPayment] = useState<{ card_type: string; last_four: string; expire_month: number; expire_year: number } | null>(null)

  // Password state
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwStatus, setPwStatus]               = useState<StatusState>(null)
  const [savingPw, setSavingPw]               = useState(false)

  useEffect(() => {
    getProfile().then(p => {
      setFirstName(p.first_name ?? '')
      setLastName(p.last_name ?? '')
      setAge(p.age != null ? String(p.age) : '')
      setMajor(p.major ?? '')
      setRouting(p.bank_routing_number ?? '')
      setAccount(p.bank_account_number ?? '')
    }).catch(() => {})

    if (role === 'bidder') {
      getPaymentInfo().then(setPayment).catch(() => {})
    }
  }, [userName, role])

  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const initials = useMemo(
    () => [firstName, lastName].filter(Boolean).map(p => p[0].toUpperCase()).join('').slice(0, 2) || 'U',
    [firstName, lastName],
  )

  async function handleSaveProfile() {
    setSaving(true)
    setProfileStatus(null)
    try {
      const payload = role === 'bidder'
        ? { first_name: firstName, last_name: lastName, age: age ? parseInt(age, 10) : undefined, major: major || undefined }
        : { bank_routing_number: routing || undefined, bank_account_number: account || undefined }
      const res = await updateProfile(payload)
      setProfileStatus({ msg: res.success ? 'Profile saved.' : (res.error ?? 'Failed to save.'), ok: res.success })
    } catch {
      setProfileStatus({ msg: 'Failed to save.', ok: false })
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (!newPassword || !confirmPassword) {
      setPwStatus({ msg: 'Both fields are required.', ok: false })
      return
    }
    if (newPassword !== confirmPassword) {
      setPwStatus({ msg: 'Passwords do not match.', ok: false })
      return
    }
    if (newPassword.length < 6) {
      setPwStatus({ msg: 'Password must be at least 6 characters.', ok: false })
      return
    }
    setSavingPw(true)
    setPwStatus(null)
    try {
      const res = await changePassword(newPassword)
      setPwStatus({ msg: res.success ? 'Password updated.' : (res.error ?? 'Failed to update.'), ok: res.success })
      if (res.success) { setNewPassword(''); setConfirmPassword('') }
    } catch {
      setPwStatus({ msg: 'Failed to update.', ok: false })
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div style={s.page}>
      <main style={s.main}>
        <header style={s.profileHeader}>
          <button type="button" style={s.backButton} onClick={onBack}>← Back</button>
          <div style={s.avatar}>{initials}</div>
          <div style={s.profileTitleBlock}>
            <p style={s.eyebrow}>Account Settings</p>
            <h1 style={s.name}>{fullName || userName}</h1>
            <p style={s.emailLine}>{userName} · {role}</p>
          </div>
        </header>

        <div style={s.content}>
          <aside style={s.sidebar}>
            {tabs.map(tab => {
              const isActive = tab.id === activeTab
              return (
                <button
                  key={tab.id}
                  type="button"
                  style={{ ...s.tabButton, ...(isActive ? s.tabButtonActive : {}) }}
                  onClick={() => { setActiveTab(tab.id); setProfileStatus(null); setPwStatus(null) }}
                >
                  <span style={{ ...s.tabIcon, ...(isActive ? s.tabIconActive : {}) }}>{tab.icon}</span>
                  {tab.label}
                </button>
              )
            })}
          </aside>

          <div style={s.card}>

            {/* ── Profile tab ── */}
            {activeTab === 'profile' && (
              <section style={s.section}>
                <h2 style={s.sectionTitle}>Personal Information</h2>

                {/* Email — always read-only */}
                <Field label="Email Address">
                  <span style={s.readonlyValue}>{userName}</span>
                  <span style={s.hint}>Email can only be changed via a helpdesk request.</span>
                </Field>

                {role === 'bidder' && (
                  <>
                    <div style={s.fieldRow}>
                      <Field label="First Name">
                        <input style={s.input} value={firstName} onChange={e => setFirstName(e.target.value)} />
                      </Field>
                      <Field label="Last Name">
                        <input style={s.input} value={lastName} onChange={e => setLastName(e.target.value)} />
                      </Field>
                    </div>
                    <div style={s.fieldRow}>
                      <Field label="Age">
                        <input style={s.input} type="number" min="1" value={age} onChange={e => setAge(e.target.value)} />
                      </Field>
                      <Field label="Major (optional)">
                        <input style={s.input} value={major} onChange={e => setMajor(e.target.value)} placeholder="e.g. Computer Science" />
                      </Field>
                    </div>
                  </>
                )}

                {profileStatus && (
                  <p style={profileStatus.ok ? s.successText : s.errorText}>{profileStatus.msg}</p>
                )}

                {role !== 'helpdesk' && (
                  <div style={s.actions}>
                    <button style={{ ...s.saveButton, opacity: saving ? 0.6 : 1 }} onClick={handleSaveProfile} disabled={saving}>
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* ── Payment tab (read-only) ── */}
            {activeTab === 'payment' && (
              <section style={s.section}>
                <h2 style={s.sectionTitle}>Payment Method</h2>
                {payment ? (
                  <>
                    <div style={s.paymentPreview}>
                      <span>{payment.card_type}</span>
                      <strong>**** {payment.last_four}</strong>
                    </div>
                    <div style={s.fieldRow}>
                      <Field label="Card Type"><span style={s.readonlyValue}>{payment.card_type}</span></Field>
                      <Field label="Last Four"><span style={s.readonlyValue}>{payment.last_four}</span></Field>
                    </div>
                    <div style={s.fieldRow}>
                      <Field label="Expiry Month"><span style={s.readonlyValue}>{String(payment.expire_month).padStart(2, '0')}</span></Field>
                      <Field label="Expiry Year"><span style={s.readonlyValue}>{payment.expire_year}</span></Field>
                    </div>
                    <p style={s.hint}>To update payment info, submit a helpdesk request.</p>
                  </>
                ) : (
                  <p style={s.muted}>No payment method on file.</p>
                )}
              </section>
            )}

            {/* ── Seller Info tab ── */}
            {activeTab === 'sellerInfo' && (
              <section style={s.section}>
                <h2 style={s.sectionTitle}>Seller Payout Info</h2>
                <Field label="Bank Routing Number">
                  <input style={s.input} value={routing} onChange={e => setRouting(e.target.value)} placeholder="9-digit routing number" />
                </Field>
                <Field label="Bank Account Number">
                  <input style={s.input} value={account} onChange={e => setAccount(e.target.value)} placeholder="Account number" />
                </Field>

                {profileStatus && (
                  <p style={profileStatus.ok ? s.successText : s.errorText}>{profileStatus.msg}</p>
                )}
                <div style={s.actions}>
                  <button style={{ ...s.saveButton, opacity: saving ? 0.6 : 1 }} onClick={handleSaveProfile} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </section>
            )}

            {/* ── Password tab ── */}
            {activeTab === 'password' && (
              <section style={s.section}>
                <h2 style={s.sectionTitle}>Change Password</h2>
                <Field label="New Password">
                  <input style={s.input} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
                </Field>
                <Field label="Confirm New Password">
                  <input style={s.input} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                </Field>

                {pwStatus && (
                  <p style={pwStatus.ok ? s.successText : s.errorText}>{pwStatus.msg}</p>
                )}
                <div style={s.actions}>
                  <button style={{ ...s.saveButton, opacity: savingPw ? 0.6 : 1 }} onClick={handleChangePassword} disabled={savingPw}>
                    {savingPw ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              </section>
            )}
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
    width: 'min(960px, calc(100% - 32px))',
    margin: '0 auto',
    padding: '40px 0 56px',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '22px',
  },
  backButton: {
    padding: '6px 12px',
    background: 'transparent',
    color: '#7dbde8',
    border: '1px solid #36516d',
    borderRadius: '6px',
    font: '700 13px Inter, "Segoe UI", system-ui, sans-serif',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  avatar: {
    width: '64px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: '50%',
    background: '#5ba4d4',
    color: '#0b1521',
    fontSize: '20px',
    fontWeight: 900,
  },
  profileTitleBlock: { minWidth: 0 },
  eyebrow: {
    margin: '0 0 6px',
    color: '#5ba4d4',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
  },
  name: {
    margin: 0,
    color: '#edf3f8',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '34px',
    fontWeight: 500,
    lineHeight: 1.05,
  },
  emailLine: {
    marginTop: '8px',
    color: '#8fa5ba',
    fontSize: '14px',
    fontWeight: 700,
    overflowWrap: 'anywhere',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    alignItems: 'start',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '10px',
    background: '#152438',
    border: '1px solid #293d56',
    borderRadius: '8px',
  },
  tabButton: {
    width: '100%',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: '6px',
    color: '#9db0c2',
    font: '800 13px Inter, "Segoe UI", system-ui, sans-serif',
    textAlign: 'left',
    cursor: 'pointer',
  },
  tabButtonActive: {
    background: '#253a54',
    borderColor: '#4b6b8b',
    color: '#edf3f8',
  },
  tabIcon: {
    width: '24px',
    height: '24px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: '50%',
    background: '#20334b',
    color: '#9db0c2',
    fontSize: '12px',
    fontWeight: 900,
  },
  tabIconActive: { background: '#5ba4d4', color: '#0b1521' },
  card: {
    minHeight: '400px',
    padding: '22px',
    background: '#152438',
    border: '1px solid #293d56',
    borderRadius: '8px',
    boxShadow: '0 16px 40px rgba(0,0,0,.22)',
  },
  section: { margin: 0 },
  sectionTitle: {
    margin: '0 0 18px',
    color: '#edf3f8',
    fontSize: '18px',
    fontWeight: 800,
  },
  fieldRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
  },
  label: {
    color: '#9db0c2',
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '.07em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    minHeight: '44px',
    boxSizing: 'border-box',
    background: '#20334b',
    border: '1px solid #36516d',
    borderRadius: '6px',
    padding: '11px 12px',
    color: '#edf3f8',
    font: '600 14px Inter, "Segoe UI", system-ui, sans-serif',
    outline: 'none',
  },
  readonlyValue: {
    color: '#edf3f8',
    fontSize: '15px',
    fontWeight: 600,
  },
  hint: {
    color: '#4a607a',
    fontSize: '12px',
    fontWeight: 500,
    marginTop: '2px',
  },
  paymentPreview: {
    minHeight: '88px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginBottom: '18px',
    padding: '16px',
    background: '#20334b',
    border: '1px solid #36516d',
    borderRadius: '8px',
    color: '#edf3f8',
    fontSize: '14px',
    fontWeight: 800,
  },
  muted: {
    color: '#4a607a',
    fontSize: '14px',
    fontStyle: 'italic',
    margin: 0,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '8px',
  },
  saveButton: {
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
  successText: {
    margin: '0 0 12px',
    padding: '10px 12px',
    background: '#12324a',
    border: '1px solid #2d6a9f',
    borderRadius: '6px',
    color: '#7dbde8',
    fontSize: '13px',
    fontWeight: 800,
  },
  errorText: {
    margin: '0 0 12px',
    color: '#ff8c8c',
    fontSize: '13px',
    fontWeight: 800,
  },
}
