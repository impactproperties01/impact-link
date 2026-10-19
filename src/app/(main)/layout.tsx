import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Sidebar />
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0 overflow-x-hidden relative">
        <div className="max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
      <BottomNav />
    </>
  )
}