'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <head>
        <title>Error</title>
      </head>
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 20 }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <h1>Something went wrong</h1>
          <button onClick={() => reset()}>Try again</button>
        </div>
      </body>
    </html>
  )
}
