export const SUPPORT_EMAIL = 'contact@theimpactproperties.com'

export function getListingContactHref(propertyId: string) {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Listing enquiry: ${propertyId}`)}`
}

export const SUPPORT_PHONE = '07083804443'
export const SUPPORT_PHONE_HREF = 'tel:+2347083804443'

export function getInspectionEmailHref(propertyId: string, title: string) {
  const subject = `Schedule an inspection: ${propertyId}`
  const body = [
    'Hello Impact Link,', '',
    'I would like to schedule an inspection for:',
    title,
    `Listing reference: ${propertyId}`, '',
    'Preferred date:',
    'Preferred time:',
    'My name:',
    'My phone number:',
  ].join('\n')
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
