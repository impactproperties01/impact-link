import { z } from 'zod'

export const inspectionContactSchema = z.object({
  name: z.string().trim().min(2, 'Enter the inspection contact name.').max(100, 'Name must be 100 characters or fewer.'),
  phone: z.string().trim().max(30, 'Phone number is too long.').refine(
    (value) => /^\+?\d{7,15}$/.test(value.replace(/[\s()-]/g, '')),
    'Enter a valid inspection phone number, including the country code if needed.',
  ),
})

export type OwnerInspectionContact = { name: string | null; phone: string | null } | null
export type InspectionContactSelection = {
  inspectionContactType: 'OWNER' | 'CUSTOM'
  inspectionContactName?: string
  inspectionContactPhone?: string
}

export function getInspectionContactInput(selection: InspectionContactSelection, owner: OwnerInspectionContact) {
  return selection.inspectionContactType === 'OWNER'
    ? { name: owner?.name || '', phone: owner?.phone || '' }
    : { name: selection.inspectionContactName || '', phone: selection.inspectionContactPhone || '' }
}
