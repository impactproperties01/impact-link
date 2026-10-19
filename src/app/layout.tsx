import './globals.css'
import SessionProvider from '@/components/providers/SessionProvider'

export const metadata = {
  title: 'Impact Link',
  description: 'Find the right property in Nigeria',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-white text-brand-dark antialiased">
        {/* No Sidebar, No BottomNav. Just children. */}
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}