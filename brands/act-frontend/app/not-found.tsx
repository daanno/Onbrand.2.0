export default function NotFound() {
  return (
    <html>
      <head>
        <title>404 - Page Not Found</title>
      </head>
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 20 }}>
        <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
          <h1>404 - Page Not Found</h1>
          <p>The page you are looking for does not exist.</p>
          <a 
            href="/"
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: '#485c11',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            Return to Home
          </a>
        </div>
      </body>
    </html>
  )
}
