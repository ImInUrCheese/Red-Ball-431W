import type { CSSProperties } from 'react'

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search listings by title...',
}: SearchBarProps) {
  return (
    <label style={styles.wrapper}>
      <span style={styles.icon}>⌕</span>
      <input
        aria-label="Search listings"
        style={styles.input}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '.75rem',
    background: '#1e2f47',
    border: '1px solid #2a3d58',
    borderRadius: '8px',
    padding: '0 .95rem',
    boxSizing: 'border-box',
  },
  icon: {
    color: '#7a8fa8',
    fontSize: '1.15rem',
    lineHeight: 1,
  },
  input: {
    width: '100%',
    minWidth: 0,
    height: '48px',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#e8edf4',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: '.95rem',
  },
}
