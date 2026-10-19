import { z } from 'zod'

export const propertySchema = z.object({
  listingType: z.enum(['RENTAL', 'SALE', 'SHORTLET']),
  propertyType: z.enum(['APARTMENT', 'DUPLEX', 'HOUSE', 'LAND', 'COMMERCIAL', 'OTHER']),
  
  // Safely allows empty strings for Rent/Shortlet where these fields are hidden
  title: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  
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
  
  // Documents array
  documents: z.array(z.string()).optional(),
})

export type PropertyFormData = z.infer<typeof propertySchema>