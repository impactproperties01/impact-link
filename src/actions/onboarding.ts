'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'

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

    const fullName = formData.get('fullName') as string
    const phone = formData.get('phone') as string
    // const address = formData.get('address') as string // (If your Prisma schema has an address field, add it below!)
    const file = formData.get('profileImage') as File | null

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
        phone: phone,
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