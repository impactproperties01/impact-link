import { z } from 'zod'
import { inspectionContactSchema } from '@/lib/inspection-contact'

export const PROPERTY_DECLARATION = 'I confirm that I am the property owner or I am authorised to list this property on behalf of the owner, and every other information supplied is true/correct.'

export const propertySchema = z.object({
  listingType: z.enum(['RENTAL', 'SALE', 'SHORTLET', 'LEASE']),
  propertyType: z.enum(['APARTMENT', 'DUPLEX', 'HOUSE', 'LAND', 'COMMERCIAL', 'OTHER']),
  
  // Safely allows empty strings for Rent/Shortlet where these fields are hidden
  title: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),

  propertyRelationship: z.enum(['DIRECT_OWNER', 'OTHER']),
  ownerRelationship: z.string().trim().max(200, 'Relationship must be 200 characters or fewer.').optional(),
  directOwnerName: z.string().trim().min(2, 'Enter the direct owner’s full name.').max(100, 'Name must be 100 characters or fewer.'),
  directOwnerPhone: z.string().trim().max(30, 'Phone number is too long.').refine(
    (value) => /^\+?\d{7,15}$/.test(value.replace(/[\s()-]/g, '')),
    'Enter a valid phone number for the direct owner.',
  ),
  directOwnerAddress: z.string().trim().min(5, 'Enter the direct owner’s address.').max(500, 'Address must be 500 characters or fewer.'),
  features: z.string().trim().min(1, 'Describe the features of this property.').max(5000, 'Features must be 5,000 characters or fewer.'),
  declarationAccepted: z.boolean().default(false).refine((value) => value, 'Confirm the property declaration before submitting.'),
  
  state: z.string().min(2, "State is required"),
  locationArea: z.string().min(2, "Area/City is required"),
  address: z.string().min(5, "Full address is required"),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  
  // Base details (coerced to prevent NaN crashes on empty fields)
  bedrooms: z.coerce.number().min(0).optional(),
  bathrooms: z.coerce.number().min(0).optional(),
  toilets: z.coerce.number().min(0).optional(),
  parkingSpaces: z.coerce.number().min(0).optional(),
  
  // Dynamic fields from Step 2
  bedroomTypes: z.array(z.string()).optional(),
  totalUnits: z.coerce.number().optional(),
  availableUnits: z.coerce.number().optional(),
  size: z.coerce.number().optional(),
  shortletBedrooms: z.string().optional(),
  
  // Pricing
  basePrice: z.coerce.number().min(1, "Price is required"),
  
  // FIX: Explicitly define the key as z.string() and the value as z.coerce.number()
  unitPrices: z.record(z.string(), z.coerce.number()).optional(), 
  
  serviceCharge: z.coerce.number().optional().catch(undefined),
  cautionFee: z.coerce.number().optional().catch(undefined),
  legalFee: z.coerce.number().min(0).optional(),
  agencyFee: z.coerce.number().min(0).optional(),
  commissionPct: z.coerce.number().min(0).optional(), 
  tenancyDuration: z.string().optional().or(z.literal('')),
  installmentalPrice: z.coerce.number().optional().catch(undefined),
  
  inspectionContactType: z.enum(['OWNER', 'CUSTOM']).default('OWNER'),
  inspectionContactName: z.string().trim().max(100).optional(),
  inspectionContactPhone: z.string().trim().max(30).optional(),

  // Documents array
  documents: z.array(z.string()).optional(),
}).superRefine((data, context) => {
  if (data.propertyRelationship === 'OTHER' && !data.ownerRelationship) {
    context.addIssue({ code: 'custom', path: ['ownerRelationship'], message: 'State your relationship with the direct owner.' })
  }
  if (data.listingType === 'LEASE') {
    if (!['HOUSE', 'COMMERCIAL', 'LAND'].includes(data.propertyType)) {
      context.addIssue({ code: 'custom', path: ['propertyType'], message: 'Choose Residential homes, Commercial buildings, or Land for a lease.' })
    }
    if (!data.title?.trim()) {
      context.addIssue({ code: 'custom', path: ['title'], message: 'Enter a description for this lease.' })
    }
    if (data.propertyType === 'LAND' && (!data.size || data.size <= 0)) {
      context.addIssue({ code: 'custom', path: ['size'], message: 'Enter the land size in sqm.' })
    }
  }
  if (data.inspectionContactType !== 'CUSTOM') return
  const contact = inspectionContactSchema.safeParse({ name: data.inspectionContactName || '', phone: data.inspectionContactPhone || '' })
  if (!contact.success) {
    for (const issue of contact.error.issues) {
      context.addIssue({ code: 'custom', path: [issue.path[0] === 'name' ? 'inspectionContactName' : 'inspectionContactPhone'], message: issue.message })
    }
  }
}).transform((data) => ({ ...data, ownerRelationship: data.propertyRelationship === 'OTHER' ? data.ownerRelationship : '' }))
  .transform((data) => data.listingType === 'LEASE' ? {
  ...data,
  tenancyDuration: '1 year',
  bedroomTypes: [],
  unitPrices: {},
  totalUnits: undefined,
  availableUnits: undefined,
  shortletBedrooms: undefined,
  installmentalPrice: undefined,
  documents: [],
  ...(data.propertyType === 'LAND' ? { bedrooms: 0, bathrooms: 0, toilets: 0, parkingSpaces: 0 } : {}),
  ...(data.propertyType === 'COMMERCIAL' ? { bedrooms: 0 } : {}),
} : data)

export type PropertyFormData = z.infer<typeof propertySchema>
