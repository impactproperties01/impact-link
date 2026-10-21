'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { v2 as cloudinary } from 'cloudinary'
import { propertySchema, PROPERTY_DECLARATION } from '@/components/properties/schema'
import { revalidatePath } from 'next/cache'
import { getListingFeeFields } from '@/lib/property-fees'
import { getInspectionContactInput, inspectionContactSchema } from '@/lib/inspection-contact'

// Ensure your .env contains these three variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function refreshPropertyViews(propertyId: string) {
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/properties')
  revalidatePath('/dashboard/tenants')
  revalidatePath('/dashboard/payments')
  revalidatePath(`/dashboard/properties/${propertyId}`)
  revalidatePath(`/dashboard/properties/${propertyId}/manage`)
}

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
    const owner = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, phone: true } })
    if (!owner) return { success: false, error: 'Your account could not be found. Please sign in again.' }
    const inspectionContact = inspectionContactSchema.safeParse(getInspectionContactInput(propertyData, owner))
    if (!inspectionContact.success) {
      return { success: false, error: propertyData.inspectionContactType === 'OWNER'
        ? 'Your account needs a valid name and phone number. Choose Input details in the Inspection step.'
        : inspectionContact.error.issues[0]?.message || 'Enter valid inspection contact details.' }
    }
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
      declarationAccepted,
      ...restData 
    } = propertyData

    const newProperty = await prisma.property.create({
      data: {
        ...restData,
        ...getListingFeeFields(propertyData.listingType, propertyData.basePrice),
        declarationAcceptedAt: declarationAccepted ? new Date() : null,
        declarationText: PROPERTY_DECLARATION,
        inspectionContactName: inspectionContact.data.name,
        inspectionContactPhone: inspectionContact.data.phone,
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

    refreshPropertyViews(newProperty.id)
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
    refreshPropertyViews(propertyId)
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

    refreshPropertyViews(propertyId)
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

    refreshPropertyViews(propertyId)
    return { success: true }
  } catch (error) {
    console.error("Failed to update unit:", error)
    return { success: false, error: "Something went wrong updating the unit." }
  }
}
