import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import PropertyViewClient from './PropertyViewClient'

// 1. Update params to be a Promise
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params // 2. Await it here (even if you don't strictly use id for the title yet)
  return { title: 'View Property | Impact Link' }
}

// 1. Update params to be a Promise here as well
export default async function PropertyViewPage({ params }: { params: Promise<{ id: string }> }) {
  // 2. Await the params before using them!
  const { id } = await params 
  
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return null
  }

  // Fetch the specific property and verify it belongs to this user
  const property = await prisma.property.findUnique({
    where: {
      id: id, // Now this has the actual string ID!
      ownerId: userId
    }
  })

  // If the property doesn't exist or isn't theirs, trigger a 404
  if (!property) {
    notFound()
  }

  return <PropertyViewClient property={property} />
}