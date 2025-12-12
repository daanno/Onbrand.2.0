'use client'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Something went wrong</h2>
      <button
        onClick={reset}
        style={{
          padding: '0.5rem',
          backgroundColor: '#485c11',
          color: 'white',
          border: 'none',
          borderRadius: '0.25rem',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  )
}
