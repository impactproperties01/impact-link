'use server'

import cloudinary from '@/lib/cloudinary'

export async function uploadPropertyImage(formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) throw new Error('No file provided')

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'impact-link/properties', // Keeps your dashboard organized
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error)
          resolve(result)
        }
      ).end(buffer)
    })

    return { success: true, data: uploadResult }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return { success: false, error: 'Image upload failed' }
  }
}