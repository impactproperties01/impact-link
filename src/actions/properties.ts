'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { v2 as cloudinary } from 'cloudinary'
import { propertySchema } from '@/components/properties/schema'
import { revalidatePath } from 'next/cache'

// Ensure your .env contains these three variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function createPropertyAction(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to list a property." }
    }

    // 1. Extract Data
    const files = formData.getAll('images') as File[]
    const rawData = JSON.parse(formData.get('data') as string)

    // 2. SERVER-SIDE VALIDATION (Crucial Security Step)
    const validatedData = propertySchema.safeParse(rawData)
    
    if (!validatedData.success) {
      console.error("Server Validation Failed:", validatedData.error.flatten())
      return { success: false, error: "Invalid property data submitted. Please check your fields." }
    }

    const propertyData = validatedData.data 
    const imageUrls: string[] = []

    // 3. Upload Images to Cloudinary via Stream
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const url = await new Promise<string>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'impact_link/properties' }, 
          (error, result) => {
            if (error || !result) reject(error)
            else resolve(result.secure_url)
          }
        ).end(buffer)
      })
      imageUrls.push(url)
    }

   // 4. Clean Data & Save to Neon Postgres
    // Extract fields that might be undefined so they aren't spread as undefined
    const { 
      title, 
      description, 
      bedrooms, 
      bathrooms, 
      toilets, 
      parkingSpaces, 
      unitPrices, // <-- Extract unitPrices here
      ...restData 
    } = propertyData

    const newProperty = await prisma.property.create({
      data: {
        ...restData,
        title: title || "",             
        description: description || "", 
        bedrooms: bedrooms || 0,
        bathrooms: bathrooms || 0,
        toilets: toilets || 0,
        parkingSpaces: parkingSpaces || 0,
        unitPrices: unitPrices || {}, // <-- Saves the linked multi-unit prices safely as JSON
        images: imageUrls,
        ownerId: session.user.id,
        status: 'PENDING'
      }
    })

    return { success: true, propertyId: newProperty.id }

  } catch (error) {
    console.error("Property Creation Error:", error)
    return { success: false, error: "Something went wrong saving your property." }
  }
}

// NEW: Action to update units from the Manage Dashboard Modal
export async function updatePropertyUnitsAction(
  propertyId: string, 
  data: { totalUnits: number, availableUnits: number, bedroomTypes: string[] }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.property.update({
      where: {
        id: propertyId,
        ownerId: session.user.id
      },
      data: {
        totalUnits: data.totalUnits,
        availableUnits: data.availableUnits,
        bedroomTypes: data.bedroomTypes
      }
    })

    // Forces Next.js to pull fresh data for this specific property page
    revalidatePath(`/dashboard/properties/${propertyId}/manage`)
    return { success: true }
  } catch (error) {
    console.error("Failed to update units:", error)
    return { success: false, error: "Something went wrong saving units." }
  }
}

// NEW: Action to create an individual door/unit
export async function createPropertyUnitAction(
  propertyId: string, 
  data: { 
    name: string, 
    type: string, 
    price: number, 
    status: string, 
    tenantName?: string,
    tenantPhone?: string,
    rentStartDate?: Date | null,
    rentEndDate?: Date | null
  }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Verify the user actually owns the property before adding a unit
    const property = await prisma.property.findUnique({
      where: { id: propertyId, ownerId: session.user.id }
    })

    if (!property) {
      return { success: false, error: "Property not found or unauthorized." }
    }

    await prisma.unit.create({
      data: {
        name: data.name,
        type: data.type,
        price: data.price,
        status: data.status,
        tenantName: data.status === 'OCCUPIED' ? data.tenantName : null,
        tenantPhone: data.status === 'OCCUPIED' ? data.tenantPhone : null,
        rentStartDate: data.status === 'OCCUPIED' ? data.rentStartDate : null,
        rentEndDate: data.status === 'OCCUPIED' ? data.rentEndDate : null,
        propertyId: propertyId
      }
    })

    revalidatePath(`/dashboard/properties/${propertyId}/manage`)
    return { success: true }
  } catch (error) {
    console.error("Failed to create unit:", error)
    return { success: false, error: "Something went wrong creating the unit." }
  }
}

// NEW: Action to update an existing individual unit
export async function updatePropertyUnitAction(
  unitId: string,
  propertyId: string, 
  data: { 
    name: string, 
    type: string, 
    price: number, 
    status: string, 
    tenantName?: string | null,
    tenantPhone?: string | null,
    rentStartDate?: Date | null,
    rentEndDate?: Date | null
  }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId, ownerId: session.user.id }
    })

    if (!property) {
      return { success: false, error: "Property not found or unauthorized." }
    }

    await prisma.unit.update({
      where: { id: unitId },
      data: {
        name: data.name,
        type: data.type,
        price: data.price,
        status: data.status,
        tenantName: data.status === 'OCCUPIED' ? data.tenantName : null,
        tenantPhone: data.status === 'OCCUPIED' ? data.tenantPhone : null,
        rentStartDate: data.status === 'OCCUPIED' ? data.rentStartDate : null,
        rentEndDate: data.status === 'OCCUPIED' ? data.rentEndDate : null,
      }
    })

    revalidatePath(`/dashboard/properties/${propertyId}/manage`)
    return { success: true }
  } catch (error) {
    console.error("Failed to update unit:", error)
    return { success: false, error: "Something went wrong updating the unit." }
  }
}

// NEW: Action to record payment and extend tenant lease
export async function recordTenantPaymentAction(unitId: string, propertyId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId, ownerId: session.user.id },
      include: { units: { where: { id: unitId } } }
    })

    if (!property || property.units.length === 0) {
      return { success: false, error: "Property or Unit not found." }
    }

    const unit = property.units[0]
    
    // Determine extension duration based on property settings
    let extensionMonths = 12 // Default to 1 year
    const durationStr = (property.tenancyDuration || '').toLowerCase()
    
    if (durationStr === 'monthly' || durationStr === 'month') {
        extensionMonths = 1
    } else if (durationStr.includes('6') || durationStr.includes('bi')) {
        extensionMonths = 6
    }

    // Calculate new end date (starting from current end date, or today if missing)
    const currentEndDate = unit.rentEndDate ? new Date(unit.rentEndDate) : new Date()
    const newEndDate = new Date(currentEndDate)
    newEndDate.setMonth(newEndDate.getMonth() + extensionMonths)

    await prisma.unit.update({
      where: { id: unitId },
      data: { rentEndDate: newEndDate }
    })

    revalidatePath(`/dashboard/properties/${propertyId}/manage`)
    return { success: true }
  } catch (error) {
    console.error("Failed to record payment:", error)
    return { success: false, error: "Something went wrong extending the lease." }
  }
}