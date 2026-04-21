import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'

type AccountForm = {
  firstName: string
  lastName: string
  email: string
  phone: string
  streetNumber: string
  streetName: string
  city: string
  state: string
  zipCode: string
  major: string
  age: string
  cardType: string
  cardLastFour: string
  expireMonth: string
  expireYear: string
  bankRoutingNumber: string
  bankAccountNumber: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

type SettingsTab = 'profile' | 'payment' | 'password' | 'sellerInfo'

const allTabs: { id: SettingsTab; icon: string; label: string; roles: string[] }[] = [
  { id: 'profile',    icon: 'P', label: 'Profile',     roles: ['bidder', 'seller', 'helpdesk'] },
  { id: 'payment',   icon: '$', label: 'Payment',     roles: ['bidder'] },
  { id: 'password',  icon: '*', label: 'Password',    roles: ['bidder', 'seller', 'helpdesk'] },
  { id: 'sellerInfo', icon: 'S', label: 'Seller Info', roles: ['seller'] },
]

const initialForm: AccountForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '(814) 555-0192',
  streetNumber: '173',
  streetName: 'College Ave',
  city: 'State College',
  state: 'PA',
  zipCode: '16801',
  major: 'Computer Science',
  age: '21',
  cardType: 'Visa',
  cardLastFour: '4242',
  expireMonth: '05',
  expireYear: '2028',
  bankRoutingNumber: '021000021',
  bankAccountNumber: '000123456789',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

interface AccountSettingsProps {
  userName: string
  role: 'bidder' | 'seller' | 'helpdesk'
  onBack: () => void
}

export default function AccountSettingsPage({ userName, role, onBack }: AccountSettingsProps) {
  const tabs = allTabs.filter(t => t.roles.includes(role))
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [status, setStatus] = useState('')
  const [form, setForm] = useState<AccountForm>(() => ({ ...initialForm, email: userName }))

  const fullName = `${form.firstName} ${form.lastName}`.trim()
  const initials = useMemo(
    () =>
      [form.firstName, form.lastName]
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase())
        .join('')
        .slice(0, 2) || 'U',
    [form.firstName, form.lastName],
  )

  function updateField(field: keyof AccountForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setStatus('')
  }

  function validateActiveTab() {
    if (activeTab === 'profile') {
      if (!form.firstName.trim() || !form.lastName.trim()) return 'First and last name are required.'
      if (!Number.isInteger(Number(form.age)) || Number(form.age) < 18) {
        return 'Age must be a whole number of at least 18.'
      }
      if (!form.zipCode.trim()) return 'Zip code is required.'
    }

    if (activeTab === 'payment') {
      if (form.cardLastFour && !/^\d{4}$/.test(form.cardLastFour)) {
        return 'Card last four must be exactly 4 digits.'
      }
      if (form.expireMonth && (Number(form.expireMonth) < 1 || Number(form.expireMonth) > 12)) {
        return 'Expiration month must be between 1 and 12.'
      }
    }

    if (activeTab === 'password') {
      if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
        return 'Fill out all password fields before saving.'
      }
      if (form.newPassword.length < 8) return 'New password must be at least 8 characters.'
      if (form.newPassword !== form.confirmPassword) return 'New passwords do not match.'
    }

    if (activeTab === 'sellerInfo') {
      if (!/^\d{9}$/.test(form.bankRoutingNumber)) return 'Routing number must be 9 digits.'
      if (!/^\d{4,17}$/.test(form.bankAccountNumber)) {
        return 'Account number must be 4 to 17 digits.'
      }
    }

    return ''
  }

  function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault()
    const error = validateActiveTab()

    if (error) {
      setStatus(error)
      return
    }

    setStatus(`${tabs.find((tab) => tab.id === activeTab)?.label} changes saved locally.`)
  }

  return (
    <div style={styles.page}>
      <main style={styles.main}>
        <header style={styles.profileHeader}>
          <button type="button" style={styles.backButton} onClick={onBack}>← Back</button>
          <div style={styles.avatar}>{initials || form.email[0]?.toUpperCase() || 'U'}</div>
          <div style={styles.profileTitleBlock}>
            <p style={styles.eyebrow}>Account Settings</p>
            <h1 style={styles.name}>{fullName || form.email}</h1>
            <p style={styles.emailLine}>{form.email} · {role}</p>
          </div>
        </header>

        <div style={styles.content}>
          <aside style={styles.sidebar} aria-label="Account settings">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab

              return (
                <button
                  key={tab.id}
                  type="button"
                  style={{
                    ...styles.tabButton,
                    ...(isActive ? styles.tabButtonActive : {}),
                  }}
                  onClick={() => {
                    setStatus('')
                    setActiveTab(tab.id)
                  }}
                >
                  <span style={{ ...styles.tabIcon, ...(isActive ? styles.tabIconActive : {}) }}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              )
            })}
          </aside>

          <form style={styles.card} onSubmit={handleSubmit}>
            {activeTab === 'profile' && (
              <>
                <section style={styles.section}>
                  <h2 style={styles.sectionTitle}>Personal Information</h2>
                  <div style={styles.fieldRow}>
                    <label style={styles.field}>
                      <span style={styles.label}>First Name</span>
                      <input
                        style={styles.input}
                        value={form.firstName}
                        onChange={(event) => updateField('firstName', event.target.value)}
                      />
                    </label>

                    <label style={styles.field}>
                      <span style={styles.label}>Last Name</span>
                      <input
                        style={styles.input}
                        value={form.lastName}
                        onChange={(event) => updateField('lastName', event.target.value)}
                      />
                    </label>
                  </div>

                  <label style={styles.field}>
                    <span style={styles.label}>Email Address</span>
                    <input style={{ ...styles.input, ...styles.readOnlyInput }} value={form.email} readOnly />
                  </label>

                  <label style={styles.field}>
                    <span style={styles.label}>Phone Number</span>
                    <input
                      style={styles.input}
                      value={form.phone}
                      onChange={(event) => updateField('phone', event.target.value)}
                    />
                  </label>
                </section>

                <section style={{ ...styles.section, ...styles.sectionDivider }}>
                  <h2 style={styles.sectionTitle}>Address</h2>
                  <div style={styles.addressGrid}>
                    <label style={styles.field}>
                      <span style={styles.label}>Street No.</span>
                      <input
                        style={styles.input}
                        value={form.streetNumber}
                        onChange={(event) => updateField('streetNumber', event.target.value)}
                      />
                    </label>

                    <label style={styles.field}>
                      <span style={styles.label}>Street Name</span>
                      <input
                        style={styles.input}
                        value={form.streetName}
                        onChange={(event) => updateField('streetName', event.target.value)}
                      />
                    </label>
                  </div>

                  <div style={styles.locationGrid}>
                    <label style={styles.field}>
                      <span style={styles.label}>City</span>
                      <input
                        style={styles.input}
                        value={form.city}
                        onChange={(event) => updateField('city', event.target.value)}
                      />
                    </label>

                    <label style={styles.field}>
                      <span style={styles.label}>State</span>
                      <input
                        style={styles.input}
                        value={form.state}
                        onChange={(event) => updateField('state', event.target.value)}
                      />
                    </label>

                    <label style={styles.field}>
                      <span style={styles.label}>Zip</span>
                      <input
                        style={styles.input}
                        value={form.zipCode}
                        onChange={(event) => updateField('zipCode', event.target.value)}
                      />
                    </label>
                  </div>
                </section>

                <section style={{ ...styles.section, ...styles.sectionDivider }}>
                  <h2 style={styles.sectionTitle}>Academic Info</h2>
                  <div style={styles.fieldRow}>
                    <label style={styles.field}>
                      <span style={styles.label}>Major</span>
                      <input
                        style={styles.input}
                        value={form.major}
                        onChange={(event) => updateField('major', event.target.value)}
                      />
                    </label>

                    <label style={styles.field}>
                      <span style={styles.label}>Age</span>
                      <input
                        style={styles.input}
                        type="number"
                        min="18"
                        value={form.age}
                        onChange={(event) => updateField('age', event.target.value)}
                      />
                    </label>
                  </div>
                </section>
              </>
            )}

            {activeTab === 'payment' && (
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Payment Method</h2>
                <div style={styles.paymentPreview}>
                  <span>{form.cardType || 'Card'}</span>
                  <strong>**** {form.cardLastFour || '0000'}</strong>
                </div>

                <div style={styles.fieldRow}>
                  <label style={styles.field}>
                    <span style={styles.label}>Card Type</span>
                    <select
                      style={styles.input}
                      value={form.cardType}
                      onChange={(event) => updateField('cardType', event.target.value)}
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="Discover">Discover</option>
                      <option value="American Express">American Express</option>
                    </select>
                  </label>

                  <label style={styles.field}>
                    <span style={styles.label}>Last Four</span>
                    <input
                      style={styles.input}
                      value={form.cardLastFour}
                      maxLength={4}
                      onChange={(event) => updateField('cardLastFour', event.target.value.replace(/\D/g, ''))}
                    />
                  </label>
                </div>

                <div style={styles.fieldRow}>
                  <label style={styles.field}>
                    <span style={styles.label}>Expire Month</span>
                    <input
                      style={styles.input}
                      value={form.expireMonth}
                      maxLength={2}
                      onChange={(event) => updateField('expireMonth', event.target.value.replace(/\D/g, ''))}
                    />
                  </label>

                  <label style={styles.field}>
                    <span style={styles.label}>Expire Year</span>
                    <input
                      style={styles.input}
                      value={form.expireYear}
                      maxLength={4}
                      onChange={(event) => updateField('expireYear', event.target.value.replace(/\D/g, ''))}
                    />
                  </label>
                </div>
              </section>
            )}

            {activeTab === 'password' && (
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Password</h2>
                <label style={styles.field}>
                  <span style={styles.label}>Current Password</span>
                  <input
                    style={styles.input}
                    type="password"
                    value={form.currentPassword}
                    onChange={(event) => updateField('currentPassword', event.target.value)}
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>New Password</span>
                  <input
                    style={styles.input}
                    type="password"
                    value={form.newPassword}
                    onChange={(event) => updateField('newPassword', event.target.value)}
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>Confirm New Password</span>
                  <input
                    style={styles.input}
                    type="password"
                    value={form.confirmPassword}
                    onChange={(event) => updateField('confirmPassword', event.target.value)}
                  />
                </label>
              </section>
            )}

            {activeTab === 'sellerInfo' && (
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Seller Payout Info</h2>
                <div style={styles.callout}>
                  Balance and payout updates are local only until backend account routes are added.
                </div>

                <label style={styles.field}>
                  <span style={styles.label}>Bank Routing Number</span>
                  <input
                    style={styles.input}
                    value={form.bankRoutingNumber}
                    maxLength={9}
                    onChange={(event) => updateField('bankRoutingNumber', event.target.value.replace(/\D/g, ''))}
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>Bank Account Number</span>
                  <input
                    style={styles.input}
                    value={form.bankAccountNumber}
                    maxLength={17}
                    onChange={(event) => updateField('bankAccountNumber', event.target.value.replace(/\D/g, ''))}
                  />
                </label>
              </section>
            )}

            {status && (
              <p style={status.includes('saved') ? styles.successText : styles.errorText}>{status}</p>
            )}

            <div style={styles.actions}>
              <button style={styles.saveButton} type="submit">
                Save Locally
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
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
  profileTitleBlock: {
    minWidth: 0,
  },
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
    letterSpacing: 0,
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
  tabIconActive: {
    background: '#5ba4d4',
    color: '#0b1521',
  },
  card: {
    minHeight: '510px',
    padding: '22px',
    background: '#152438',
    border: '1px solid #293d56',
    borderRadius: '8px',
    boxShadow: '0 16px 40px rgba(0, 0, 0, .22)',
  },
  section: {
    margin: 0,
  },
  sectionDivider: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #293d56',
  },
  sectionTitle: {
    margin: '0 0 18px',
    color: '#edf3f8',
    fontSize: '18px',
    fontWeight: 800,
    letterSpacing: 0,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    marginBottom: '16px',
  },
  fieldRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '14px',
  },
  addressGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '14px',
  },
  locationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: '14px',
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
  readOnlyInput: {
    color: '#8fa5ba',
    cursor: 'not-allowed',
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
  callout: {
    marginBottom: '18px',
    padding: '14px',
    background: '#102033',
    border: '1px solid #293d56',
    borderRadius: '6px',
    color: '#9db0c2',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '18px',
  },
  saveButton: {
    minWidth: '132px',
    minHeight: '44px',
    padding: '10px 18px',
    background: '#5ba4d4',
    color: '#0b1521',
    border: 'none',
    borderRadius: '6px',
    font: '900 14px Inter, "Segoe UI", system-ui, sans-serif',
    cursor: 'pointer',
  },
  errorText: {
    margin: '10px 0 0',
    color: '#ff8c8c',
    fontSize: '13px',
    fontWeight: 800,
    lineHeight: 1.35,
  },
  successText: {
    margin: '10px 0 0',
    padding: '12px',
    background: '#12324a',
    border: '1px solid #2d6a9f',
    borderRadius: '6px',
    color: '#7dbde8',
    fontSize: '13px',
    fontWeight: 800,
  },
}
