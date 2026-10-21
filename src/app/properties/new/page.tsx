import AddPropertyForm from '@/components/properties/AddPropertyForm'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export const metadata = {
  title: 'Add New Property | Impact Link',
}

export default async function NewPropertyPage() {
  const session = await auth()
  const ownerContact = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, phone: true, address: true } })
    : null
  return (
    <div className="min-h-screen bg-gray-50/50 pt-8 px-4">
      <AddPropertyForm ownerContact={ownerContact} ownerAddress={ownerContact?.address} />
    </div>
  )
}
