'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'
import { landlordOnboardingSchema } from '@/lib/landlord-onboarding'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function completeLandlordOnboarding(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const actor = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
    if (actor?.role !== 'OWNER') return { success: false, error: 'Only property owners can complete landlord onboarding.' }

    const validated = landlordOnboardingSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { success: false, error: validated.error.issues[0]?.message || 'Check your profile details.' }
    const { fullName, ...profile } = validated.data
    const file = formData.get('profileImage') as File | null
    if (file && (typeof file === 'string' || (file.size > 0 && (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(file.type))))) {
      return { success: false, error: 'Upload a JPG or PNG profile photo smaller than 5MB.' }
    }

    let imageUrl = session.user.image // Default to existing image if any

    // 1. If an image was uploaded, process and send to Cloudinary
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      imageUrl = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'impact_link_profiles' }, 
          (error, result) => {
            if (error) reject(error)
            else resolve(result?.secure_url as string)
          }
        ).end(buffer)
      })
    }

    // 2. Update the user record and flip isVerified to true
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: fullName,
        ...profile,
        image: imageUrl as string | undefined,
        isVerified: true, // KYC Complete!
      }
    })

    return { success: true, error: null }
  } catch (error) {
    console.error("Onboarding Error:", error)
    return { success: false, error: "Failed to save profile. Please try again." }
  }
}
