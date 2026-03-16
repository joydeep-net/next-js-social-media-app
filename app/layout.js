import './globals.css'

export const metadata = {
  title: 'Social App',
  description: 'A simple social media app',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
