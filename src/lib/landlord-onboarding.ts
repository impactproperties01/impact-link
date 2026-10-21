import { z } from 'zod'

const phoneNumber = z.string().trim().max(30, 'Phone number is too long.').refine(
  (value) => /^\+?\d{7,15}$/.test(value.replace(/[\s()-]/g, '')),
  'Enter a valid phone number.',
)

export const landlordOnboardingSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(100),
  phone: phoneNumber,
  address: z.string().trim().min(5, 'Enter your residential or contact address.').max(500),
  stateOfOrigin: z.string().trim().min(2, 'Enter your state of origin.').max(100),
  lga: z.string().trim().min(2, 'Enter your Local Government Area (LGA).').max(100),
  nextOfKinName: z.string().trim().min(2, 'Enter your next of kin’s full name.').max(100),
  nextOfKinPhone: phoneNumber,
})
