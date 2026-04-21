import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties, DragEvent } from 'react'

type ListingForm = {
  auctionTitle: string
  productName: string
  category: string
  quantity: string
  reservePrice: string
  maxBids: string
  description: string
  photoName: string
}

type Step = 1 | 2 | 3

const categories = [
  'Books',
  'Electronics',
  'Furniture',
  'Clothing',
  'Tickets',
  'Kitchen',
  'Sports',
  'Other',
]

const steps: { id: Step; label: string }[] = [
  { id: 1, label: 'Item' },
  { id: 2, label: 'Auction' },
  { id: 3, label: 'Review' },
]

const initialForm: ListingForm = {
  auctionTitle: '',
  productName: '',
  category: '',
  quantity: '1',
  reservePrice: '',
  maxBids: '10',
  description: '',
  photoName: '',
}

interface CreateListingProps {
  userName: string
  onBack: () => void
}

export default function CreateListingPage({ onBack }: CreateListingProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [photoError, setPhotoError] = useState('')
  const [status, setStatus] = useState('')
  const [form, setForm] = useState<ListingForm>(initialForm)

  const reviewRows = useMemo(
    () => [
      ['Auction Title', form.auctionTitle || 'Not provided'],
      ['Product Name', form.productName || 'Not provided'],
      ['Category', form.category || 'Not selected'],
      ['Quantity', form.quantity || 'Not provided'],
      ['Reserve Price', form.reservePrice ? `$${Number(form.reservePrice).toFixed(2)}` : 'Not provided'],
      ['Max Bids', form.maxBids || 'Not provided'],
      ['Photo', form.photoName || 'No photo selected'],
    ],
    [form],
  )

  function updateField(field: keyof ListingForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setStatus('')
  }

  function getStepError() {
    if (currentStep === 1) {
      if (!form.auctionTitle.trim()) return 'Auction title is required.'
      if (!form.productName.trim()) return 'Product name is required.'
      if (!form.category) return 'Choose a category.'
      if (!form.description.trim()) return 'Description is required.'
    }

    if (currentStep === 2) {
      const quantity = Number(form.quantity)
      const reservePrice = Number(form.reservePrice)
      const maxBids = Number(form.maxBids)

      if (!Number.isInteger(quantity) || quantity < 1) return 'Quantity must be at least 1.'
      if (!form.reservePrice || Number.isNaN(reservePrice) || reservePrice < 0) {
        return 'Reserve price must be 0 or greater.'
      }
      if (!Number.isInteger(maxBids) || maxBids < 1) return 'Max bids must be at least 1.'
    }

    return ''
  }

  function goToNextStep() {
    const error = getStepError()
    if (error) {
      setStatus(error)
      return
    }

    setStatus('')
    setCurrentStep((step) => (step === 1 ? 2 : 3))
  }

  function goToPreviousStep() {
    setStatus('')
    setCurrentStep((step) => (step === 3 ? 2 : 1))
  }

  function handlePhotoSelect(file: File | undefined) {
    if (!file) return

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setPhotoError('Please choose a JPG or PNG image.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Please choose an image under 5MB.')
      return
    }

    setPhotoError('')
    updateField('photoName', file.name)
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    handlePhotoSelect(event.target.files?.[0])
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    handlePhotoSelect(event.dataTransfer.files[0])
  }

  function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault()

    if (currentStep !== 3) {
      goToNextStep()
      return
    }

    setStatus('Listing draft is ready. Database submission is intentionally disabled for now.')
  }

  return (
    <div style={styles.page}>
      <main style={styles.main}>
        <section style={styles.header}>
          <button type="button" style={styles.backButton} onClick={onBack}>← Back</button>
          <p style={styles.eyebrow}>Seller Workspace</p>
          <h1 style={styles.title}>Create Listing</h1>
          <p style={styles.subtitle}>
            Build a draft auction using the current backend listing fields.
          </p>
        </section>

        <div style={styles.layout}>
          <form style={styles.card} onSubmit={handleSubmit}>
            <div style={styles.steps} aria-label="Listing progress">
              {steps.map((step) => {
                const isActive = step.id <= currentStep

                return (
                  <button
                    key={step.id}
                    type="button"
                    style={{
                      ...styles.stepButton,
                      ...(isActive ? styles.stepButtonActive : {}),
                    }}
                    onClick={() => {
                      if (step.id < currentStep) {
                        setStatus('')
                        setCurrentStep(step.id)
                      }
                    }}
                  >
                    <span style={styles.stepNumber}>{step.id}</span>
                    {step.label}
                  </button>
                )
              })}
            </div>

            {currentStep === 1 && (
              <section style={styles.formSection}>
                <h2 style={styles.cardTitle}>Item Details</h2>

                <label style={styles.field}>
                  <span style={styles.label}>Auction Title</span>
                  <input
                    style={styles.input}
                    value={form.auctionTitle}
                    onChange={(event) => updateField('auctionTitle', event.target.value)}
                    placeholder="MacBook Pro 14-inch with charger"
                  />
                </label>

                <div style={styles.fieldRow}>
                  <label style={styles.field}>
                    <span style={styles.label}>Product Name</span>
                    <input
                      style={styles.input}
                      value={form.productName}
                      onChange={(event) => updateField('productName', event.target.value)}
                      placeholder="MacBook Pro"
                    />
                  </label>

                  <label style={styles.field}>
                    <span style={styles.label}>Category</span>
                    <select
                      style={styles.input}
                      value={form.category}
                      onChange={(event) => updateField('category', event.target.value)}
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label style={styles.field}>
                  <span style={styles.label}>Description</span>
                  <textarea
                    style={{ ...styles.input, ...styles.textarea }}
                    value={form.description}
                    onChange={(event) => updateField('description', event.target.value)}
                    placeholder="Condition, pickup notes, included accessories, and anything bidders should know."
                  />
                </label>

                <div style={styles.field}>
                  <span style={styles.label}>Photo</span>
                  <div
                    style={styles.uploadBox}
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDrop}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        fileInputRef.current?.click()
                      }
                    }}
                  >
                    <span style={styles.uploadIcon}>+</span>
                    <span style={styles.uploadText}>
                      {form.photoName || 'Choose image or drag it here'}
                    </span>
                    <span style={styles.uploadHint}>JPG or PNG, up to 5MB</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    style={styles.hiddenInput}
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleFileInputChange}
                  />
                  {photoError && <p style={styles.errorText}>{photoError}</p>}
                </div>
              </section>
            )}

            {currentStep === 2 && (
              <section style={styles.formSection}>
                <h2 style={styles.cardTitle}>Auction Rules</h2>

                <div style={styles.fieldRow}>
                  <label style={styles.field}>
                    <span style={styles.label}>Quantity</span>
                    <input
                      style={styles.input}
                      type="number"
                      min="1"
                      step="1"
                      value={form.quantity}
                      onChange={(event) => updateField('quantity', event.target.value)}
                    />
                  </label>

                  <label style={styles.field}>
                    <span style={styles.label}>Max Bids</span>
                    <input
                      style={styles.input}
                      type="number"
                      min="1"
                      step="1"
                      value={form.maxBids}
                      onChange={(event) => updateField('maxBids', event.target.value)}
                    />
                  </label>
                </div>

                <label style={styles.field}>
                  <span style={styles.label}>Reserve Price</span>
                  <input
                    style={styles.input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.reservePrice}
                    onChange={(event) => updateField('reservePrice', event.target.value)}
                    placeholder="0.00"
                  />
                </label>

                <div style={styles.callout}>
                  Auctions close when the max bid count is reached. If the highest bid meets the
                  reserve, the winner will move to payment.
                </div>
              </section>
            )}

            {currentStep === 3 && (
              <section style={styles.formSection}>
                <h2 style={styles.cardTitle}>Review Draft</h2>
                <div style={styles.reviewGrid}>
                  {reviewRows.map(([label, value]) => (
                    <div key={label} style={styles.reviewItem}>
                      <span style={styles.reviewLabel}>{label}</span>
                      <strong style={styles.reviewValue}>{value}</strong>
                    </div>
                  ))}
                  <div style={{ ...styles.reviewItem, ...styles.reviewWide }}>
                    <span style={styles.reviewLabel}>Description</span>
                    <strong style={styles.reviewValue}>
                      {form.description || 'Not provided'}
                    </strong>
                  </div>
                </div>
              </section>
            )}

            {status && (
              <p style={status.includes('ready') ? styles.successText : styles.errorText}>{status}</p>
            )}

            <div style={styles.actions}>
              {currentStep > 1 && (
                <button style={styles.secondaryButton} type="button" onClick={goToPreviousStep}>
                  Back
                </button>
              )}
              <button style={styles.primaryButton} type="submit">
                {currentStep === 1 && 'Continue'}
                {currentStep === 2 && 'Review'}
                {currentStep === 3 && 'Save Draft'}
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
    width: 'min(760px, calc(100% - 32px))',
    margin: '0 auto',
    padding: '40px 0 56px',
  },
  header: {
    marginBottom: '24px',
  },
  backButton: {
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
    margin: 0,
    color: '#edf3f8',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '40px',
    fontWeight: 500,
    letterSpacing: 0,
    lineHeight: 1.05,
  },
  subtitle: {
    maxWidth: '620px',
    marginTop: '10px',
    color: '#8fa5ba',
    fontSize: '15px',
    lineHeight: 1.45,
  },
  layout: {
    display: 'block',
  },
  card: {
    padding: '22px',
    background: '#152438',
    border: '1px solid #293d56',
    borderRadius: '8px',
    boxShadow: '0 16px 40px rgba(0, 0, 0, .22)',
  },
  steps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '8px',
    marginBottom: '22px',
  },
  stepButton: {
    minHeight: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px',
    background: '#102033',
    border: '1px solid #293d56',
    borderRadius: '6px',
    color: '#8fa5ba',
    font: '700 13px Inter, "Segoe UI", system-ui, sans-serif',
    cursor: 'pointer',
  },
  stepButtonActive: {
    background: '#253a54',
    color: '#edf3f8',
    borderColor: '#4b6b8b',
  },
  stepNumber: {
    width: '22px',
    height: '22px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    background: '#5ba4d4',
    color: '#0b1521',
    fontSize: '12px',
    fontWeight: 900,
  },
  formSection: {
    minHeight: '410px',
  },
  cardTitle: {
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
  textarea: {
    minHeight: '122px',
    lineHeight: 1.45,
    resize: 'vertical',
  },
  uploadBox: {
    minHeight: '118px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    background: '#102033',
    border: '1px dashed #4b6b8b',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  uploadIcon: {
    width: '30px',
    height: '30px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    background: '#5ba4d4',
    color: '#0b1521',
    fontSize: '22px',
    fontWeight: 900,
  },
  uploadText: {
    color: '#edf3f8',
    fontSize: '14px',
    fontWeight: 800,
    overflowWrap: 'anywhere',
  },
  uploadHint: {
    color: '#8fa5ba',
    fontSize: '12px',
    fontWeight: 700,
  },
  hiddenInput: {
    display: 'none',
  },
  callout: {
    padding: '14px',
    background: '#102033',
    border: '1px solid #293d56',
    borderRadius: '6px',
    color: '#9db0c2',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  reviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
  },
  reviewItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    padding: '12px',
    background: '#102033',
    border: '1px solid #293d56',
    borderRadius: '6px',
  },
  reviewWide: {
    gridColumn: '1 / -1',
  },
  reviewLabel: {
    color: '#8fa5ba',
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '.06em',
    textTransform: 'uppercase',
  },
  reviewValue: {
    color: '#edf3f8',
    fontSize: '14px',
    fontWeight: 800,
    lineHeight: 1.35,
    overflowWrap: 'anywhere',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '18px',
  },
  primaryButton: {
    minWidth: '128px',
    minHeight: '44px',
    padding: '10px 18px',
    background: '#5ba4d4',
    color: '#0b1521',
    border: 'none',
    borderRadius: '6px',
    font: '900 14px Inter, "Segoe UI", system-ui, sans-serif',
    cursor: 'pointer',
  },
  secondaryButton: {
    minWidth: '96px',
    minHeight: '44px',
    padding: '10px 18px',
    background: '#20334b',
    color: '#edf3f8',
    border: '1px solid #36516d',
    borderRadius: '6px',
    font: '800 14px Inter, "Segoe UI", system-ui, sans-serif',
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
