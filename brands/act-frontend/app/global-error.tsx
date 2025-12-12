'use client'

// Very simple error page to avoid context-related errors during build
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '1rem',
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
          }}>Something went wrong</h1>
          <p style={{
            fontSize: '1.125rem',
            marginBottom: '1.5rem',
          }}>We're sorry, but something went wrong.</p>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#2563eb',
              color: 'white',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
